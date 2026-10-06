import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorStop,
  PhoneOff,
  MessageSquare,
  Users,
  Settings,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  X,
  Volume2,
  VolumeX,
  ShieldCheck,
  Maximize2,
  Minimize2,
  RefreshCw,
  HelpCircle,
  GraduationCap,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Avatar,
  GlassCard,
  GlassButton,
  LiquidBackground,
  DeveloperCodeBackdrop,
  Modal,
} from '../components/ui/CommonUI.tsx';

interface ParticipantInfo {
  socketId: string;
  userId: string;
  role: 'mentor' | 'learner';
  fullName: string;
  avatarUrl: string;
  email: string;
  micActive: boolean;
  cameraActive: boolean;
  screenSharing: boolean;
  joinedAt: number;
}

interface InRoomChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'mentor' | 'learner';
  text: string;
  timestamp: number;
}

interface TeachingRoomAccessData {
  authorized: boolean;
  myRole: 'mentor' | 'learner';
  peerRole: 'mentor' | 'learner';
  me: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string;
    isVerifiedMentor?: boolean;
  };
  peer: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string;
    isVerifiedMentor?: boolean;
  };
  session: {
    id: number;
    scheduledDate: string;
    startTime: string;
    duration: number;
    notes: string;
    status: string;
    skillName: string;
    skillCategory: string;
    teacher: {
      id: string;
      fullName: string;
      avatarUrl: string;
      isVerifiedMentor?: boolean;
    };
    learner: {
      id: string;
      fullName: string;
      avatarUrl: string;
    };
  };
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export const TeachingRoomPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { token, profile, apiFetch, showToast } = useAuth();
  const navigate = useNavigate();

  // Session & Security Authorization state
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<TeachingRoomAccessData | null>(null);

  // Connection & WebRTC state
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('connecting');
  const [peerConnected, setPeerConnected] = useState(false);

  // Media Controls state
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeScreenSharerId, setActiveScreenSharerId] = useState<string | null>(null);
  const [activeScreenSharerRole, setActiveScreenSharerRole] = useState<'mentor' | 'learner' | null>(null);

  // Participant list & metadata from server
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);

  // In-room chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<InRoomChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Mic permission & devices modal
  const [permErrorModal, setPermErrorModal] = useState<string | null>(null);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isStageExpanded, setIsStageExpanded] = useState(false);

  // Audio activity indicator states (speech volume simulation/meter)
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);

  // Elapsed Session Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Refs for WebRTC and streams
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localAudioStreamRef = useRef<MediaStream | null>(null);
  const localCameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Media senders on RTCPeerConnection
  const audioSenderRef = useRef<RTCRtpSender | null>(null);
  const cameraSenderRef = useRef<RTCRtpSender | null>(null);
  const screenVideoSenderRef = useRef<RTCRtpSender | null>(null);
  const screenAudioSenderRef = useRef<RTCRtpSender | null>(null);

  // HTML Media Element Refs
  const remoteAudioElRef = useRef<HTMLAudioElement | null>(null);
  const remoteVideoElRef = useRef<HTMLVideoElement | null>(null);
  const localCameraPreviewRef = useRef<HTMLVideoElement | null>(null);
  const localScreenPreviewRef = useRef<HTMLVideoElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Queued ICE candidates before remote description set
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);

  // 1. Session Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 2. Fetch Audio Input Devices
  const loadAudioDevices = useCallback(async () => {
    try {
      if (navigator.mediaDevices?.enumerateDevices) {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const mics = devs.filter((d) => d.kind === 'audioinput');
        setAudioInputDevices(mics);
        if (mics.length > 0 && !selectedAudioDevice) {
          setSelectedAudioDevice(mics[0].deviceId);
        }
      }
    } catch (err) {
      console.warn('Could not enumerate audio devices:', err);
    }
  }, [selectedAudioDevice]);

  // 3. Audio Activity Analyzer for Local Stream
  const attachAudioAnalyzer = useCallback((stream: MediaStream, isLocal: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      let running = true;

      const checkVolume = () => {
        if (!running) return;
        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        if (isLocal) {
          setLocalAudioLevel(normalized);
        } else {
          setRemoteAudioLevel(normalized);
        }
        requestAnimationFrame(checkVolume);
      };
      checkVolume();

      return () => {
        running = false;
        try {
          audioCtx.close();
        } catch {
          // ignore
        }
      };
    } catch {
      // AudioContext failure gracefully falls back
    }
  }, []);

  // 4. Validate Room Access with Backend (SECTION 17: SECURITY)
  useEffect(() => {
    let isMounted = true;
    const checkAccess = async () => {
      if (!sessionId) return;
      setLoading(true);
      setAccessError(null);
      try {
        const data = await apiFetch<TeachingRoomAccessData>(
          `/api/sessions/${sessionId}/room-access`
        );
        if (!isMounted) return;
        setRoomData(data);
      } catch (err: any) {
        if (!isMounted) return;
        setAccessError(
          err.message ||
            'Access Denied: You are not an authorized participant of this private Teaching Room.'
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkAccess();
    return () => {
      isMounted = false;
    };
  }, [sessionId, apiFetch]);

  // 5. Initialize Local Microphone Stream (SECTION 3: WEBRTC AUDIO)
  const initLocalAudio = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Your browser does not support WebRTC audio.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedAudioDevice ? { exact: selectedAudioDevice } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      localAudioStreamRef.current = stream;
      setIsMicMuted(false);
      attachAudioAnalyzer(stream, true);
      loadAudioDevices();
      return stream;
    } catch (err: any) {
      console.error('[WebRTC] Microphone access error:', err);
      const isDenied =
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      const msg = isDenied
        ? 'Microphone permission is required for real-time two-way audio. Please allow microphone access in your browser address bar and click Retry.'
        : `Could not access microphone: ${err.message || 'Unknown media error'}`;
      setPermErrorModal(msg);
      return null;
    }
  }, [selectedAudioDevice, attachAudioAnalyzer, loadAudioDevices]);

  // 6. WebRTC Peer Connection & Socket.IO Connection Setup
  useEffect(() => {
    if (!roomData || !sessionId || !token) return;

    let socket: Socket;
    let pc: RTCPeerConnection;

    const setupRealtime = async () => {
      // Create WebRTC RTCPeerConnection
      pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      // Handle incoming remote tracks (audio & screen video)
      pc.ontrack = (event) => {
        console.log('[WebRTC] Received remote track:', event.track.kind);
        const [remoteStream] = event.streams;

        if (event.track.kind === 'audio') {
          // Play remote participant's microphone / screen audio in real time
          if (remoteAudioElRef.current) {
            remoteAudioElRef.current.srcObject = remoteStream || new MediaStream([event.track]);
            remoteAudioElRef.current.play().catch((e) => {
              console.warn('[WebRTC] Autoplay waiting for user gesture:', e);
            });
          }
          if (remoteStream) {
            attachAudioAnalyzer(remoteStream, false);
          }
        } else if (event.track.kind === 'video') {
          // Play remote participant's shared screen or camera video on main stage
          if (remoteVideoElRef.current) {
            remoteVideoElRef.current.srcObject = remoteStream || new MediaStream([event.track]);
            remoteVideoElRef.current.play().catch((e) => {
              console.warn('[WebRTC] Video autoplay caught:', e);
            });
          }
        }
      };

      // Connection State monitoring (SECTION 13: CONNECTION STATUS)
      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setConnectionStatus('connected');
          setPeerConnected(true);
        } else if (
          pc.connectionState === 'connecting' ||
          pc.connectionState === 'new'
        ) {
          setConnectionStatus('connecting');
        } else if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed'
        ) {
          setConnectionStatus('disconnected');
          setPeerConnected(false);
          // Auto-reconnect trigger
          if (pc.connectionState === 'failed') {
            pc.restartIce();
          }
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE state:', pc.iceConnectionState);
        if (
          pc.iceConnectionState === 'connected' ||
          pc.iceConnectionState === 'completed'
        ) {
          setConnectionStatus('connected');
          setPeerConnected(true);
        } else if (pc.iceConnectionState === 'checking') {
          setConnectionStatus('connecting');
        } else if (
          pc.iceConnectionState === 'disconnected' ||
          pc.iceConnectionState === 'failed'
        ) {
          setConnectionStatus('disconnected');
        }
      };

      // Initial Local Microphone track attachment
      const audioStream = await initLocalAudio();
      if (audioStream) {
        audioStream.getAudioTracks().forEach((track) => {
          audioSenderRef.current = pc.addTrack(track, audioStream);
        });
      }

      // Connect Socket.IO
      socket = io({
        auth: { token },
        transports: ['websocket', 'polling'],
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[Socket] Connected to signaling server');
        socket.emit('teaching:join_room', { sessionId: Number(sessionId) });
      });

      socket.on('disconnect', () => {
        console.log('[Socket] Disconnected from signaling server');
        setConnectionStatus('disconnected');
      });

      // Emit local ICE candidates to peer
      pc.onicecandidate = (event) => {
        if (event.candidate && socket.connected) {
          socket.emit('webrtc:signal', {
            sessionId: Number(sessionId),
            signalType: 'ice-candidate',
            data: event.candidate,
          });
        }
      };

      // Room state synchronization
      socket.on('teaching:room_state', async (state) => {
        setParticipants(state.participants || []);
        setActiveScreenSharerId(state.activeScreenSharer || null);
        if (state.chatMessages) {
          setChatMessages(state.chatMessages);
        }

        // Determine if another participant is already present
        const otherParticipant = (state.participants || []).find(
          (p: ParticipantInfo) => p.userId !== profile?.id
        );

        if (otherParticipant) {
          setPeerConnected(true);
          // If I am the Mentor (or initiator), create and send the initial WebRTC Offer
          if (roomData.myRole === 'mentor') {
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit('webrtc:signal', {
                sessionId: Number(sessionId),
                signalType: 'offer',
                data: offer,
              });
            } catch (err) {
              console.error('[WebRTC] Failed to create offer:', err);
            }
          }
        }
      });

      // Handle participant joined
      socket.on('teaching:participant_joined', async ({ participant }) => {
        showToast(
          `${participant.fullName} (${participant.role === 'mentor' ? 'Mentor' : 'Learner'}) entered the Teaching Room.`,
          'info'
        );
        setParticipants((prev) => {
          const filtered = prev.filter((p) => p.userId !== participant.userId);
          return [...filtered, participant];
        });
        setPeerConnected(true);

        // When learner joins, Mentor initiates WebRTC offer
        if (roomData.myRole === 'mentor') {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('webrtc:signal', {
              sessionId: Number(sessionId),
              signalType: 'offer',
              data: offer,
            });
          } catch (err) {
            console.error('[WebRTC] Failed to create offer for new peer:', err);
          }
        }
      });

      // Handle WebRTC Signaling Messages (Offer, Answer, ICE Candidate)
      socket.on(
        'webrtc:signal',
        async ({
          fromUserId,
          signalType,
          data,
        }: {
          fromUserId: string;
          signalType: 'offer' | 'answer' | 'ice-candidate';
          data: any;
        }) => {
          if (!pc) return;

          try {
            if (signalType === 'offer') {
              console.log('[WebRTC] Received Offer from', fromUserId);
              await pc.setRemoteDescription(new RTCSessionDescription(data));

              // Process any queued ICE candidates
              while (iceCandidateQueueRef.current.length > 0) {
                const candidate = iceCandidateQueueRef.current.shift();
                if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
              }

              // Create and send WebRTC Answer
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              socket.emit('webrtc:signal', {
                sessionId: Number(sessionId),
                signalType: 'answer',
                data: answer,
              });
            } else if (signalType === 'answer') {
              console.log('[WebRTC] Received Answer from', fromUserId);
              await pc.setRemoteDescription(new RTCSessionDescription(data));

              // Process any queued ICE candidates
              while (iceCandidateQueueRef.current.length > 0) {
                const candidate = iceCandidateQueueRef.current.shift();
                if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
              }
            } else if (signalType === 'ice-candidate') {
              if (data) {
                if (pc.remoteDescription && pc.remoteDescription.type) {
                  await pc.addIceCandidate(new RTCIceCandidate(data));
                } else {
                  iceCandidateQueueRef.current.push(data);
                }
              }
            }
          } catch (err) {
            console.error('[WebRTC] Error handling signal:', signalType, err);
          }
        }
      );

      // Handle remote participant mic mute/unmute
      socket.on('teaching:participant_mic_changed', ({ userId, micActive }) => {
        setParticipants((prev) =>
          prev.map((p) => (p.userId === userId ? { ...p, micActive } : p))
        );
      });

      // Handle remote participant camera toggle
      socket.on('teaching:participant_camera_changed', ({ userId, cameraActive }) => {
        setParticipants((prev) =>
          prev.map((p) => (p.userId === userId ? { ...p, cameraActive } : p))
        );
      });

      // Handle Screen Share Started
      socket.on(
        'teaching:screen_share_started',
        ({
          userId,
          sharerRole,
          sharerName,
        }: {
          userId: string;
          sharerRole: 'mentor' | 'learner';
          sharerName: string;
        }) => {
          setActiveScreenSharerId(userId);
          setActiveScreenSharerRole(sharerRole);
          if (userId === profile?.id) {
            setIsScreenSharing(true);
          } else {
            showToast(`${sharerName} started screen sharing.`, 'info');
          }
          setParticipants((prev) =>
            prev.map((p) =>
              p.userId === userId ? { ...p, screenSharing: true } : p
            )
          );
        }
      );

      // Handle Screen Share Rejection (SECTION 7: ONLY ONE SCREEN SHARE AT A TIME)
      socket.on('teaching:screen_share_rejected', ({ message }) => {
        showToast(message, 'error');
        // Clean up any local display stream if it was requested
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((t) => t.stop());
          screenStreamRef.current = null;
        }
        setIsScreenSharing(false);
      });

      // Handle Screen Share Stopped (SECTION 8: AUDIO MUST NOT STOP)
      socket.on('teaching:screen_share_stopped', ({ userId }) => {
        setActiveScreenSharerId(null);
        setActiveScreenSharerRole(null);
        if (userId === profile?.id) {
          setIsScreenSharing(false);
        }
        setParticipants((prev) =>
          prev.map((p) =>
            p.userId === userId ? { ...p, screenSharing: false } : p
          )
        );

        // Reset remote video element if remote was sharing
        if (remoteVideoElRef.current && userId !== profile?.id) {
          remoteVideoElRef.current.srcObject = null;
        }
      });

      // In-Room Chat message received
      socket.on('teaching:chat_message', (msg: InRoomChatMessage) => {
        setChatMessages((prev) => [...prev, msg]);
        if (!isChatOpen && msg.senderId !== profile?.id) {
          setUnreadChatCount((c) => c + 1);
        }
      });

      // Participant Left
      socket.on('teaching:participant_left', ({ userId, fullName }) => {
        showToast(`${fullName} left the Teaching Room.`, 'info');
        setParticipants((prev) => prev.filter((p) => p.userId !== userId));
        setPeerConnected(false);
        if (remoteAudioElRef.current) {
          remoteAudioElRef.current.srcObject = null;
        }
        if (remoteVideoElRef.current) {
          remoteVideoElRef.current.srcObject = null;
        }
      });

      socket.on('teaching:error', ({ message }) => {
        showToast(message, 'error');
      });
    };

    setupRealtime();

    return () => {
      // Clean up WebRTC and Socket.IO
      if (socketRef.current) {
        socketRef.current.emit('teaching:leave_room', { sessionId: Number(sessionId) });
        socketRef.current.disconnect();
      }

      if (localAudioStreamRef.current) {
        localAudioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (localCameraStreamRef.current) {
        localCameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, [
    roomData,
    sessionId,
    token,
    profile?.id,
    initLocalAudio,
    attachAudioAnalyzer,
    showToast,
    isChatOpen,
  ]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatOpen]);

  // ==========================================================================
  // SECTION 2: MUTE / UNMUTE CONTROLS
  // ==========================================================================
  const toggleMicrophone = useCallback(() => {
    if (!localAudioStreamRef.current) {
      initLocalAudio();
      return;
    }

    const nextMuted = !isMicMuted;
    localAudioStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });

    setIsMicMuted(nextMuted);

    // Notify peers via Socket.IO
    if (socketRef.current?.connected && sessionId) {
      socketRef.current.emit('teaching:set_mic_state', {
        sessionId: Number(sessionId),
        micActive: !nextMuted,
      });
    }

    showToast(nextMuted ? 'Microphone muted.' : 'Microphone unmuted.', 'info');
  }, [isMicMuted, initLocalAudio, sessionId, showToast]);

  // ==========================================================================
  // SECTION 4, 5, 6, 7 & 8: SCREEN SHARING CONTROLS
  // ==========================================================================
  const handleStartScreenShare = async () => {
    if (!pcRef.current || !socketRef.current || !sessionId) return;

    // SECTION 7: Check if another participant is currently sharing
    if (activeScreenSharerId && activeScreenSharerId !== profile?.id) {
      const sharerLabel =
        activeScreenSharerRole === 'mentor' ? 'Mentor' : 'Learner';
      showToast(
        `${sharerLabel} is currently sharing their screen. Please wait until screen sharing is stopped.`,
        'error'
      );
      return;
    }

    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        showToast('Screen sharing is not supported by your current browser.', 'error');
        return;
      }

      // SECTION 5: Capture Screen Video and optional System/Tab Audio
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
        } as any,
        audio: true, // Captures tab/system audio if supported by browser
      });

      screenStreamRef.current = screenStream;

      // Display local preview
      if (localScreenPreviewRef.current) {
        localScreenPreviewRef.current.srcObject = screenStream;
      }

      const videoTrack = screenStream.getVideoTracks()[0];
      const audioTrack = screenStream.getAudioTracks()[0];

      // Add video track to RTCPeerConnection
      screenVideoSenderRef.current = pcRef.current.addTrack(
        videoTrack,
        screenStream
      );

      // Add optional system/tab audio track if present
      if (audioTrack) {
        screenAudioSenderRef.current = pcRef.current.addTrack(
          audioTrack,
          screenStream
        );
      }

      // SECTION 8: Handle user stopping share via browser's native "Stop Sharing" floating bar
      videoTrack.onended = () => {
        handleStopScreenShare();
      };

      // Notify server of screen share start
      socketRef.current.emit('teaching:start_screen_share', {
        sessionId: Number(sessionId),
      });

      setIsScreenSharing(true);
      setActiveScreenSharerId(profile?.id || null);
      setActiveScreenSharerRole(roomData?.myRole || null);

      // Trigger WebRTC renegotiation offer
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      socketRef.current.emit('webrtc:signal', {
        sessionId: Number(sessionId),
        signalType: 'offer',
        data: offer,
      });

      showToast('Screen sharing started.', 'success');
    } catch (err: any) {
      console.warn('[Screen Share] User cancelled or error:', err);
      // SECTION 16: Handle user cancellation gracefully without breaking audio
      if (err.name !== 'NotAllowedError') {
        showToast('Screen sharing could not be started.', 'error');
      }
    }
  };

  const handleStopScreenShare = async () => {
    if (!sessionId) return;

    try {
      // 1. Stop all tracks from the screen stream
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }

      // 2. Remove screen tracks from RTCPeerConnection
      if (pcRef.current) {
        if (screenVideoSenderRef.current) {
          pcRef.current.removeTrack(screenVideoSenderRef.current);
          screenVideoSenderRef.current = null;
        }
        if (screenAudioSenderRef.current) {
          pcRef.current.removeTrack(screenAudioSenderRef.current);
          screenAudioSenderRef.current = null;
        }
      }

      // 3. Reset local preview
      if (localScreenPreviewRef.current) {
        localScreenPreviewRef.current.srcObject = null;
      }

      // 4. SECTION 8: CRITICAL - Microphone track is NEVER stopped or removed!
      // Audio communication continues seamlessly.

      setIsScreenSharing(false);
      setActiveScreenSharerId(null);
      setActiveScreenSharerRole(null);

      // Notify signaling server
      if (socketRef.current?.connected) {
        socketRef.current.emit('teaching:stop_screen_share', {
          sessionId: Number(sessionId),
        });

        // Trigger renegotiation so peer removes video track
        if (pcRef.current) {
          const offer = await pcRef.current.createOffer();
          await pcRef.current.setLocalDescription(offer);
          socketRef.current.emit('webrtc:signal', {
            sessionId: Number(sessionId),
            signalType: 'offer',
            data: offer,
          });
        }
      }

      showToast('Screen sharing stopped. Microphone audio is still active.', 'info');
    } catch (err) {
      console.error('[Screen Share] Error stopping screen share:', err);
    }
  };

  // ==========================================================================
  // SECTION 12: CAMERA CONTROLS (OPTIONAL)
  // ==========================================================================
  const toggleCamera = async () => {
    if (!pcRef.current || !sessionId) return;

    if (isCameraActive) {
      // Turn camera OFF
      if (localCameraStreamRef.current) {
        localCameraStreamRef.current.getTracks().forEach((t) => t.stop());
        localCameraStreamRef.current = null;
      }
      if (cameraSenderRef.current) {
        pcRef.current.removeTrack(cameraSenderRef.current);
        cameraSenderRef.current = null;
      }
      if (localCameraPreviewRef.current) {
        localCameraPreviewRef.current.srcObject = null;
      }
      setIsCameraActive(false);

      if (socketRef.current?.connected) {
        socketRef.current.emit('teaching:set_camera_state', {
          sessionId: Number(sessionId),
          cameraActive: false,
        });

        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        socketRef.current.emit('webrtc:signal', {
          sessionId: Number(sessionId),
          signalType: 'offer',
          data: offer,
        });
      }
      showToast('Camera turned off.', 'info');
    } else {
      // Turn camera ON
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        localCameraStreamRef.current = camStream;

        if (localCameraPreviewRef.current) {
          localCameraPreviewRef.current.srcObject = camStream;
        }

        const camTrack = camStream.getVideoTracks()[0];
        cameraSenderRef.current = pcRef.current.addTrack(camTrack, camStream);
        setIsCameraActive(true);

        if (socketRef.current?.connected) {
          socketRef.current.emit('teaching:set_camera_state', {
            sessionId: Number(sessionId),
            cameraActive: true,
          });

          const offer = await pcRef.current.createOffer();
          await pcRef.current.setLocalDescription(offer);
          socketRef.current.emit('webrtc:signal', {
            sessionId: Number(sessionId),
            signalType: 'offer',
            data: offer,
          });
        }
        showToast('Camera turned on.', 'success');
      } catch (err: any) {
        console.warn('Camera error:', err);
        showToast('Could not access camera.', 'error');
      }
    }
  };

  // ==========================================================================
  // SEND IN-ROOM CHAT MESSAGE
  // ==========================================================================
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current || !sessionId) return;

    socketRef.current.emit('teaching:send_chat', {
      sessionId: Number(sessionId),
      text: chatInput.trim(),
    });
    setChatInput('');
  };

  // ==========================================================================
  // LEAVE ROOM
  // ==========================================================================
  const handleLeaveRoom = () => {
    if (socketRef.current?.connected && sessionId) {
      socketRef.current.emit('teaching:leave_room', { sessionId: Number(sessionId) });
    }
    navigate('/sessions');
  };

  // Access Loading / Security Error States
  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070B] text-white flex items-center justify-center p-6 relative overflow-hidden">
        <LiquidBackground />
        <div className="relative z-10 glass-level-2 p-8 rounded-3xl flex flex-col items-center gap-4 text-center max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center animate-pulse">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Entering Teaching Room...
          </h2>
          <p className="text-xs text-white/60">
            Validating session authorization and preparing WebRTC real-time audio and screen sharing.
          </p>
        </div>
      </div>
    );
  }

  if (accessError || !roomData) {
    return (
      <div className="min-h-screen bg-[#07070B] text-white flex items-center justify-center p-6 relative overflow-hidden">
        <LiquidBackground />
        <GlassCard level={3} className="relative z-10 p-8 max-w-lg w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-400/35 text-rose-300 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <span className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold">
            Security • Access Forbidden
          </span>
          <h1 className="text-xl font-bold text-white">Teaching Room Authorization Failed</h1>
          <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
            {accessError ||
              'Only the Mentor and Learner assigned to this scheduled session can access this private Teaching Room.'}
          </p>
          <div className="pt-2">
            <GlassButton
              type="button"
              variant="primary"
              onClick={() => navigate('/sessions')}
              className="w-full"
            >
              Return to Study Sessions
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Derive participant states
  const mentorParticipant = participants.find((p) => p.role === 'mentor');
  const learnerParticipant = participants.find((p) => p.role === 'learner');

  const isRemoteScreenSharing =
    Boolean(activeScreenSharerId) && activeScreenSharerId !== profile?.id;
  const isMeScreenSharing = isScreenSharing;

  const currentSharerName =
    activeScreenSharerId === profile?.id
      ? 'You'
      : activeScreenSharerRole === 'mentor'
      ? roomData.session.teacher.fullName
      : roomData.session.learner.fullName;

  return (
    <div className="min-h-screen bg-[#07070B] text-[#F5F5F7] flex flex-col relative overflow-hidden">
      <LiquidBackground />

      {/* Hidden WebRTC Remote Audio Player (Plays peer voice in real time) */}
      <audio ref={remoteAudioElRef} autoPlay playsInline />

      {/* TOP BAR: Room Title, Timer, Status Badges */}
      <header className="sticky top-0 z-30 px-3 sm:px-6 pt-3 pb-2">
        <div className="max-w-[1560px] mx-auto h-16 rounded-2xl glass-level-2 px-4 lg:px-6 flex items-center justify-between gap-3">
          {/* Left: Skill, Session Details & Role */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600/40 via-indigo-600/40 to-cyan-500/40 border border-white/20 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  {roomData.session.skillName} • Teaching Room
                </h1>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border shrink-0 ${
                    roomData.myRole === 'mentor'
                      ? 'bg-violet-500/25 text-violet-200 border-violet-400/40'
                      : 'bg-cyan-500/25 text-cyan-200 border-cyan-400/40'
                  }`}
                >
                  {roomData.myRole === 'mentor' ? 'Mentor Mode' : 'Learner Mode'}
                </span>
                {roomData.me.isVerifiedMentor && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/35 shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/50 truncate">
                Mentor: {roomData.session.teacher.fullName} • Learner:{' '}
                {roomData.session.learner.fullName}
              </p>
            </div>
          </div>

          {/* Center: Timer & Connection Status (SECTION 13) */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-level-1 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-white font-bold">{formatTimer(elapsedSeconds)}</span>
              <span className="text-white/40">/ {roomData.session.duration}m</span>
            </div>

            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/35'
                  : connectionStatus === 'connecting'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/35 animate-pulse'
                  : 'bg-rose-500/20 text-rose-300 border-rose-400/35'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-emerald-400'
                    : connectionStatus === 'connecting'
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
              />
              <span>
                {connectionStatus === 'connected'
                  ? 'Connected'
                  : connectionStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Connection Lost'}
              </span>
            </div>
          </div>

          {/* Right: Stage expand & Close */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsStageExpanded((v) => !v)}
              className="p-2 rounded-xl glass-level-1 text-white/70 hover:text-white hover:border-white/25 transition-all"
              title={isStageExpanded ? 'Compact Stage' : 'Expand Stage'}
            >
              {isStageExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-xl glass-level-1 text-white/70 hover:text-white hover:border-white/25 transition-all"
              title="Audio & Device Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <GlassButton
              type="button"
              variant="danger"
              size="sm"
              onClick={handleLeaveRoom}
              className="flex items-center gap-1.5"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Leave Room</span>
            </GlassButton>
          </div>
        </div>
      </header>

      {/* MAIN TEACHING STUDIO BODY */}
      <main className="flex-1 max-w-[1560px] w-full mx-auto px-3 sm:px-6 py-2 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
        {/* Left / Center Area: Main Stage (Screen Share or Dual Participant Tiles) */}
        <div className="flex-1 flex flex-col gap-3 min-h-0 min-w-0">
          {/* SECTION 14: PARTICIPANT STATUS BAR */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            {/* Mentor Card Status */}
            <div
              className={`p-3 rounded-2xl glass-level-1 border transition-all flex items-center justify-between gap-3 ${
                roomData.session.teacher.id === activeScreenSharerId
                  ? 'border-indigo-400/50 bg-indigo-500/10'
                  : 'border-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar
                  name={roomData.session.teacher.fullName}
                  src={roomData.session.teacher.avatarUrl}
                  size="sm"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-white truncate">
                      {roomData.session.teacher.fullName}
                    </p>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-400/30">
                      Mentor
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/55 mt-0.5">
                    <span className="flex items-center gap-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          mentorParticipant ? 'bg-emerald-400' : 'bg-white/30'
                        }`}
                      />
                      {mentorParticipant ? 'Online' : 'Offline'}
                    </span>
                    <span>•</span>
                    <span
                      className={`flex items-center gap-1 font-mono ${
                        mentorParticipant?.micActive !== false
                          ? 'text-emerald-300 font-semibold'
                          : 'text-amber-300'
                      }`}
                    >
                      {mentorParticipant?.micActive !== false ? (
                        <>
                          <Mic className="w-3 h-3" /> Mic On
                        </>
                      ) : (
                        <>
                          <MicOff className="w-3 h-3" /> Mic Muted
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mentor Screen Sharing Badge */}
              {roomData.session.teacher.id === activeScreenSharerId && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-500/25 border border-indigo-400/40 text-indigo-200 text-xs font-mono font-bold animate-pulse shrink-0">
                  <Monitor className="w-3.5 h-3.5" /> Sharing Screen
                </span>
              )}
            </div>

            {/* Learner Card Status */}
            <div
              className={`p-3 rounded-2xl glass-level-1 border transition-all flex items-center justify-between gap-3 ${
                roomData.session.learner.id === activeScreenSharerId
                  ? 'border-cyan-400/50 bg-cyan-500/10'
                  : 'border-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar
                  name={roomData.session.learner.fullName}
                  src={roomData.session.learner.avatarUrl}
                  size="sm"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-white truncate">
                      {roomData.session.learner.fullName}
                    </p>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      Learner
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/55 mt-0.5">
                    <span className="flex items-center gap-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          learnerParticipant ? 'bg-emerald-400' : 'bg-white/30'
                        }`}
                      />
                      {learnerParticipant ? 'Online' : 'Offline'}
                    </span>
                    <span>•</span>
                    <span
                      className={`flex items-center gap-1 font-mono ${
                        learnerParticipant?.micActive !== false
                          ? 'text-emerald-300 font-semibold'
                          : 'text-amber-300'
                      }`}
                    >
                      {learnerParticipant?.micActive !== false ? (
                        <>
                          <Mic className="w-3 h-3" /> Mic On
                        </>
                      ) : (
                        <>
                          <MicOff className="w-3 h-3" /> Mic Muted
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Learner Screen Sharing Badge */}
              {roomData.session.learner.id === activeScreenSharerId && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 text-xs font-mono font-bold animate-pulse shrink-0">
                  <Monitor className="w-3.5 h-3.5" /> Sharing Screen
                </span>
              )}
            </div>
          </div>

          {/* MAIN STAGE (Screen Video or Interactive Dual Presence Cards) */}
          <div className="flex-1 glass-level-2 rounded-3xl border border-white/12 relative overflow-hidden flex flex-col justify-center items-center min-h-[380px] p-3 sm:p-5">
            <DeveloperCodeBackdrop />

            {/* CASE A: REMOTE PEER IS SHARING THEIR SCREEN */}
            {isRemoteScreenSharing && (
              <div className="w-full h-full flex flex-col relative z-10">
                <div className="flex items-center justify-between pb-2 text-xs font-mono text-white/70 border-b border-white/10 mb-2">
                  <span className="flex items-center gap-2 text-cyan-300 font-bold">
                    <Monitor className="w-4 h-4 text-cyan-400" />
                    <span>{currentSharerName}&apos;s Screen (Live Feed)</span>
                  </span>
                  <span className="text-[11px] text-white/50">
                    Two-way audio active • Speak &amp; listen in real-time
                  </span>
                </div>
                <div className="flex-1 w-full h-full bg-[#040407] rounded-2xl overflow-hidden relative flex items-center justify-center border border-white/10">
                  <video
                    ref={remoteVideoElRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* CASE B: YOU ARE SHARING YOUR SCREEN */}
            {isMeScreenSharing && (
              <div className="w-full h-full flex flex-col relative z-10">
                <div className="flex items-center justify-between pb-2 text-xs font-mono text-white/70 border-b border-white/10 mb-2">
                  <span className="flex items-center gap-2 text-indigo-300 font-bold">
                    <Monitor className="w-4 h-4 text-indigo-400" />
                    <span>You are sharing your screen (Live to {roomData.peer.fullName})</span>
                  </span>
                  <GlassButton
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleStopScreenShare}
                    className="flex items-center gap-1.5"
                  >
                    <MonitorStop className="w-3.5 h-3.5" />
                    <span>Stop Sharing</span>
                  </GlassButton>
                </div>
                <div className="flex-1 w-full h-full bg-[#040407] rounded-2xl overflow-hidden relative flex items-center justify-center border border-white/10">
                  <video
                    ref={localScreenPreviewRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-4 left-4 bg-black/75 px-3 py-1.5 rounded-xl border border-white/20 text-xs font-mono text-emerald-300 flex items-center gap-2 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Audio &amp; Screen Transmitting Real-Time</span>
                  </div>
                </div>
              </div>
            )}

            {/* CASE C: NO SCREEN SHARE ACTIVE -> DUAL LIVE AUDIO & CAMERA PRESENCE TILES */}
            {!isRemoteScreenSharing && !isMeScreenSharing && (
              <div className="relative z-10 w-full h-full grid grid-cols-1 md:grid-cols-2 gap-5 p-2 items-center">
                {/* Peer Tile */}
                <div className="h-full rounded-2xl glass-level-1 border border-white/10 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <Avatar
                    name={roomData.peer.fullName}
                    src={roomData.peer.avatarUrl}
                    size="xl"
                  />
                  <h3 className="text-base font-bold text-white mt-3">
                    {roomData.peer.fullName}
                  </h3>
                  <span className="text-xs font-mono text-white/50 mt-0.5">
                    {roomData.peerRole === 'mentor' ? 'Mentor' : 'Learner'} •{' '}
                    {peerConnected ? 'Connected via WebRTC' : 'Waiting to join...'}
                  </span>

                  {/* Real-time Voice Waves / Meter */}
                  <div className="flex items-center gap-1 mt-4">
                    {[12, 24, 38, 20, 32, 16, 28].map((h, i) => (
                      <span
                        key={i}
                        className={`w-1 rounded-full transition-all duration-150 ${
                          remoteAudioLevel > 15
                            ? 'bg-gradient-to-t from-cyan-400 to-indigo-400'
                            : 'bg-white/15'
                        }`}
                        style={{
                          height:
                            remoteAudioLevel > 15
                              ? `${Math.max(6, Math.min(36, (h * remoteAudioLevel) / 50))}px`
                              : '6px',
                        }}
                      />
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-mono font-semibold border ${
                        peerConnected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/35'
                          : 'bg-white/[0.06] text-white/50 border-white/15'
                      }`}
                    >
                      {peerConnected ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                      <span>{peerConnected ? 'Audio Streaming' : 'Peer Offline'}</span>
                    </span>
                  </div>
                </div>

                {/* Local User Tile */}
                <div className="h-full rounded-2xl glass-level-1 border border-white/10 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  {isCameraActive ? (
                    <div className="w-full h-full rounded-xl overflow-hidden relative">
                      <video
                        ref={localCameraPreviewRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono text-white/70">
                        Camera Active
                      </span>
                    </div>
                  ) : (
                    <>
                      <Avatar
                        name={roomData.me.fullName}
                        src={roomData.me.avatarUrl}
                        size="xl"
                      />
                      <h3 className="text-base font-bold text-white mt-3">
                        {roomData.me.fullName} (You)
                      </h3>
                      <span className="text-xs font-mono text-white/50 mt-0.5">
                        {roomData.myRole === 'mentor' ? 'Mentor' : 'Learner'} •{' '}
                        {isMicMuted ? 'Mic Muted' : 'Speaking Active'}
                      </span>

                      {/* Local Voice Waves / Meter */}
                      <div className="flex items-center gap-1 mt-4">
                        {[14, 30, 22, 36, 18, 28, 12].map((h, i) => (
                          <span
                            key={i}
                            className={`w-1 rounded-full transition-all duration-150 ${
                              !isMicMuted && localAudioLevel > 15
                                ? 'bg-gradient-to-t from-emerald-400 to-cyan-400'
                                : 'bg-white/15'
                            }`}
                            style={{
                              height:
                                !isMicMuted && localAudioLevel > 15
                                  ? `${Math.max(6, Math.min(36, (h * localAudioLevel) / 50))}px`
                                  : '6px',
                            }}
                          />
                        ))}
                      </div>

                      <div className="mt-3">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-mono font-semibold border ${
                            !isMicMuted
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/35'
                              : 'bg-rose-500/20 text-rose-300 border-rose-400/35'
                          }`}
                        >
                          {!isMicMuted ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                          <span>{!isMicMuted ? 'Mic Transmitting' : 'Muted'}</span>
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Area: In-Room Real-Time Chat & Session Info Sidebar */}
        {isChatOpen && (
          <aside className="w-full lg:w-80 glass-level-2 rounded-3xl border border-white/12 flex flex-col overflow-hidden shrink-0 h-[480px] lg:h-auto">
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">In-Room Chat</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages Scroll */}
            <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-white/40 italic">
                  <p>No messages yet.</p>
                  <p className="text-[11px] mt-1">
                    Send notes, questions, or code links during the study session.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMine = msg.senderId === profile?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-white/50">
                        <span className="font-semibold text-white/75">{msg.senderName}</span>
                        <span>•</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`p-3 rounded-2xl max-w-[85%] break-words ${
                          isMine
                            ? 'bg-gradient-to-r from-violet-600/35 to-indigo-600/35 border border-indigo-400/35 text-white'
                            : 'glass-level-1 border border-white/10 text-white/90'
                        }`}
                      >
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="p-3 border-t border-white/10 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message or code snippet..."
                className="flex-1 glass-input px-3.5 py-2 rounded-xl text-xs"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2 rounded-xl btn-liquid-primary disabled:opacity-35 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </aside>
        )}
      </main>

      {/* SECTION 18: FLOATING LIQUID GLASS BOTTOM CONTROL BAR */}
      <footer className="sticky bottom-0 z-30 p-3 sm:pb-5">
        <div className="max-w-2xl mx-auto glass-level-3 rounded-2xl px-4 py-3 border border-white/20 shadow-2xl flex items-center justify-around gap-2 backdrop-blur-2xl">
          {/* 1. Microphone Mute / Unmute (SECTION 1 & 2) */}
          <button
            type="button"
            onClick={toggleMicrophone}
            className={`flex flex-col items-center gap-1 p-2 sm:px-4 rounded-xl transition-all ${
              !isMicMuted
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35 hover:bg-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-400/35 hover:bg-rose-500/30'
            }`}
            title={!isMicMuted ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {!isMicMuted ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
              {!isMicMuted ? 'Mic On' : 'Muted'}
            </span>
          </button>

          {/* 2. Camera Toggle (SECTION 12: OPTIONAL) */}
          <button
            type="button"
            onClick={toggleCamera}
            className={`flex flex-col items-center gap-1 p-2 sm:px-4 rounded-xl transition-all ${
              isCameraActive
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/35 hover:bg-indigo-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/[0.08] border border-transparent'
            }`}
            title={isCameraActive ? 'Turn Camera Off' : 'Turn Camera On'}
          >
            {isCameraActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            <span className="text-[10px] font-mono tracking-wider uppercase">
              {isCameraActive ? 'Camera On' : 'Camera'}
            </span>
          </button>

          {/* 3. Screen Sharing Toggle (SECTION 4, 5, 6, 7 & 8) */}
          {isScreenSharing ? (
            <button
              type="button"
              onClick={handleStopScreenShare}
              className="flex flex-col items-center gap-1 p-2 sm:px-4 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500/30 transition-all animate-pulse"
              title="Stop Sharing Screen"
            >
              <MonitorStop className="w-5 h-5" />
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
                Stop Sharing
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartScreenShare}
              disabled={isRemoteScreenSharing}
              className={`flex flex-col items-center gap-1 p-2 sm:px-4 rounded-xl transition-all ${
                isRemoteScreenSharing
                  ? 'text-white/30 border border-transparent cursor-not-allowed opacity-50'
                  : 'text-white/80 hover:text-white hover:bg-white/[0.08] border border-transparent'
              }`}
              title={
                isRemoteScreenSharing
                  ? `${currentSharerName} is sharing their screen. Wait until stopped.`
                  : 'Share Your Screen'
              }
            >
              <Monitor className="w-5 h-5" />
              <span className="text-[10px] font-mono tracking-wider uppercase">
                Share Screen
              </span>
            </button>
          )}

          {/* 4. In-room Chat Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsChatOpen((v) => !v);
              setUnreadChatCount(0);
            }}
            className={`flex flex-col items-center gap-1 p-2 sm:px-4 rounded-xl relative transition-all ${
              isChatOpen
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/35'
                : 'text-white/60 hover:text-white hover:bg-white/[0.08] border border-transparent'
            }`}
            title="Toggle In-Room Chat"
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5" />
              {unreadChatCount > 0 && !isChatOpen && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-cyan-400 text-[#07070B] font-bold text-[9px] flex items-center justify-center">
                  {unreadChatCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono tracking-wider uppercase">Chat</span>
          </button>

          {/* 5. Leave Room */}
          <button
            type="button"
            onClick={handleLeaveRoom}
            className="flex flex-col items-center gap-1 p-2 sm:px-4 rounded-xl bg-rose-500/25 text-rose-200 border border-rose-400/40 hover:bg-rose-500/35 transition-all"
            title="Leave Teaching Room"
          >
            <PhoneOff className="w-5 h-5 text-rose-300" />
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase">Leave</span>
          </button>
        </div>
      </footer>

      {/* PERMISSION ERROR MODAL (SECTION 15 & 16) */}
      <Modal
        open={Boolean(permErrorModal)}
        onClose={() => setPermErrorModal(null)}
        title="Microphone Access Required"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            <div className="text-xs text-white/85 space-y-1">
              <p className="font-bold text-sm text-white">Browser Permission Needed</p>
              <p>{permErrorModal}</p>
            </div>
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            Real-time audio in SkillBridge uses direct browser-to-browser WebRTC audio streaming.
            Check that microphone permission is set to <strong>Allow</strong> in your browser site
            permissions.
          </p>
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <GlassButton
              type="button"
              variant="secondary"
              onClick={() => setPermErrorModal(null)}
            >
              Dismiss
            </GlassButton>
            <GlassButton
              type="button"
              variant="primary"
              onClick={() => {
                setPermErrorModal(null);
                initLocalAudio();
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Permission</span>
            </GlassButton>
          </div>
        </div>
      </Modal>

      {/* AUDIO SETTINGS MODAL */}
      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Audio & Device Settings"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-white/75 font-medium mb-1.5">
              Microphone Input Device
            </label>
            {audioInputDevices.length > 0 ? (
              <select
                value={selectedAudioDevice}
                onChange={(e) => {
                  setSelectedAudioDevice(e.target.value);
                  initLocalAudio();
                }}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              >
                {audioInputDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Microphone ${i + 1}`}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-white/50 italic">Default system microphone active.</p>
            )}
          </div>

          <div className="p-3.5 rounded-xl glass-level-1 space-y-1.5">
            <p className="font-semibold text-white">Two-Way WebRTC Status</p>
            <p className="text-white/60 text-[11px]">
              Connection State:{' '}
              <strong className="text-cyan-300 font-mono">{connectionStatus}</strong>
            </p>
            <p className="text-white/60 text-[11px]">
              ICE Transport:{' '}
              <strong className="text-emerald-300 font-mono">STUN Google Relay</strong>
            </p>
            <p className="text-white/60 text-[11px]">
              Audio Channels: Full duplex real-time speech
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <GlassButton
              type="button"
              variant="primary"
              onClick={() => setSettingsOpen(false)}
            >
              Done
            </GlassButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};
