import type { Socket, Server as SocketIOServer } from 'socket.io';
import { db } from '../db/index.ts';
import { sessions, profiles, skills } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface RoomParticipant {
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

export interface InRoomChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'mentor' | 'learner';
  text: string;
  timestamp: number;
}

export interface TeachingRoomState {
  sessionId: number;
  skillName: string;
  participants: Map<string, RoomParticipant>; // userId -> RoomParticipant
  activeScreenSharer: string | null; // userId of active screen sharer
  chatMessages: InRoomChatMessage[];
}

// In-memory active teaching rooms
const activeTeachingRooms = new Map<number, TeachingRoomState>();

export function attachTeachingRoomSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    if (!userId) return;

    // 1. Join Teaching Room with strict DB authorization
    socket.on(
      'teaching:join_room',
      async ({ sessionId }: { sessionId: number }) => {
        try {
          const sessId = Number(sessionId);
          if (!sessId || isNaN(sessId)) {
            socket.emit('teaching:error', {
              code: 'INVALID_SESSION',
              message: 'Invalid session ID provided.',
            });
            return;
          }

          // Fetch session from database
          const [sessionRow] = await db
            .select()
            .from(sessions)
            .where(eq(sessions.id, sessId))
            .limit(1);

          if (!sessionRow) {
            socket.emit('teaching:error', {
              code: 'NOT_FOUND',
              message: 'Teaching room session not found.',
            });
            return;
          }

          // SECURITY: Only the assigned Teacher (Mentor) or Learner can join
          const isTeacher = sessionRow.teacherId === userId;
          const isLearner = sessionRow.learnerId === userId;

          if (!isTeacher && !isLearner) {
            socket.emit('teaching:error', {
              code: 'FORBIDDEN',
              message:
                'Access Denied: You are not an authorized participant of this private Teaching Room.',
            });
            return;
          }

          // Fetch user profile
          const [myProfile] = await db
            .select()
            .from(profiles)
            .where(eq(profiles.id, userId))
            .limit(1);

          // Fetch skill name
          const [skillRow] = await db
            .select()
            .from(skills)
            .where(eq(skills.id, sessionRow.skillId))
            .limit(1);

          const role: 'mentor' | 'learner' = isTeacher ? 'mentor' : 'learner';

          // Join Socket.IO room
          const roomKey = `teaching:${sessId}`;
          socket.join(roomKey);
          socket.data.currentTeachingSessionId = sessId;

          // Initialize room state if not exists
          if (!activeTeachingRooms.has(sessId)) {
            activeTeachingRooms.set(sessId, {
              sessionId: sessId,
              skillName: skillRow?.name || 'Skill Exchange',
              participants: new Map(),
              activeScreenSharer: null,
              chatMessages: [],
            });
          }

          const room = activeTeachingRooms.get(sessId)!;

          const participant: RoomParticipant = {
            socketId: socket.id,
            userId,
            role,
            fullName: myProfile?.fullName || (isTeacher ? 'Mentor' : 'Learner'),
            avatarUrl: myProfile?.avatarUrl || '',
            email: myProfile?.email || '',
            micActive: true,
            cameraActive: false,
            screenSharing: false,
            joinedAt: Date.now(),
          };

          room.participants.set(userId, participant);

          // Prepare serialized participants list
          const participantList = Array.from(room.participants.values());

          // Send full current room state to joining participant
          socket.emit('teaching:room_state', {
            sessionId: sessId,
            skillName: room.skillName,
            myRole: role,
            participants: participantList,
            activeScreenSharer: room.activeScreenSharer,
            chatMessages: room.chatMessages.slice(-50),
          });

          // Broadcast participant joined to other participants in the room
          socket.to(roomKey).emit('teaching:participant_joined', {
            participant,
          });

          console.log(
            `[Teaching Room] User ${myProfile?.fullName || userId} (${role}) joined session #${sessId}`
          );
        } catch (err: any) {
          console.error('[Teaching Room] Error in teaching:join_room:', err);
          socket.emit('teaching:error', {
            code: 'SERVER_ERROR',
            message: 'Failed to join teaching room.',
          });
        }
      }
    );

    // 2. WebRTC Signaling Relay (Offer, Answer, ICE Candidate)
    socket.on(
      'webrtc:signal',
      ({
        sessionId,
        targetUserId,
        signalType,
        data,
      }: {
        sessionId: number;
        targetUserId?: string;
        signalType: 'offer' | 'answer' | 'ice-candidate';
        data: any;
      }) => {
        const sessId = Number(sessionId);
        if (!sessId) return;

        const roomKey = `teaching:${sessId}`;
        const room = activeTeachingRooms.get(sessId);
        if (!room || !room.participants.has(userId)) return;

        // Relay to specific peer or broadcast to other in room
        if (targetUserId) {
          const targetParticipant = room.participants.get(targetUserId);
          if (targetParticipant) {
            io.to(targetParticipant.socketId).emit('webrtc:signal', {
              sessionId: sessId,
              fromUserId: userId,
              signalType,
              data,
            });
            return;
          }
        }

        socket.to(roomKey).emit('webrtc:signal', {
          sessionId: sessId,
          fromUserId: userId,
          signalType,
          data,
        });
      }
    );

    // 3. Microphone Mute / Unmute State Notification
    socket.on(
      'teaching:set_mic_state',
      ({
        sessionId,
        micActive,
      }: {
        sessionId: number;
        micActive: boolean;
      }) => {
        const sessId = Number(sessionId);
        const room = activeTeachingRooms.get(sessId);
        if (!room) return;

        const participant = room.participants.get(userId);
        if (participant) {
          participant.micActive = Boolean(micActive);
          io.to(`teaching:${sessId}`).emit('teaching:participant_mic_changed', {
            userId,
            micActive: participant.micActive,
          });
        }
      }
    );

    // 4. Camera State Notification
    socket.on(
      'teaching:set_camera_state',
      ({
        sessionId,
        cameraActive,
      }: {
        sessionId: number;
        cameraActive: boolean;
      }) => {
        const sessId = Number(sessionId);
        const room = activeTeachingRooms.get(sessId);
        if (!room) return;

        const participant = room.participants.get(userId);
        if (participant) {
          participant.cameraActive = Boolean(cameraActive);
          io.to(`teaching:${sessId}`).emit('teaching:participant_camera_changed', {
            userId,
            cameraActive: participant.cameraActive,
          });
        }
      }
    );

    // 5. Screen Sharing Request & Concurrency Enforcement (Section 7)
    socket.on(
      'teaching:start_screen_share',
      ({ sessionId }: { sessionId: number }) => {
        const sessId = Number(sessionId);
        const room = activeTeachingRooms.get(sessId);
        if (!room) return;

        const participant = room.participants.get(userId);
        if (!participant) return;

        // Section 7: "ONLY ONE SCREEN SHARE AT A TIME"
        if (room.activeScreenSharer && room.activeScreenSharer !== userId) {
          const currentSharer = room.participants.get(room.activeScreenSharer);
          const sharerRoleName =
            currentSharer?.role === 'mentor' ? 'Mentor' : 'Learner';
          socket.emit('teaching:screen_share_rejected', {
            activeSharerId: room.activeScreenSharer,
            sharerRole: currentSharer?.role,
            message: `${sharerRoleName} is currently sharing their screen. Please wait until screen sharing is stopped.`,
          });
          return;
        }

        // Grant permission to share screen
        room.activeScreenSharer = userId;
        participant.screenSharing = true;

        io.to(`teaching:${sessId}`).emit('teaching:screen_share_started', {
          userId,
          sharerRole: participant.role,
          sharerName: participant.fullName,
        });
      }
    );

    // 6. Stop Screen Sharing (Section 8: Audio must NOT stop)
    socket.on(
      'teaching:stop_screen_share',
      ({ sessionId }: { sessionId: number }) => {
        const sessId = Number(sessionId);
        const room = activeTeachingRooms.get(sessId);
        if (!room) return;

        const participant = room.participants.get(userId);
        if (participant) {
          participant.screenSharing = false;
        }

        if (room.activeScreenSharer === userId) {
          room.activeScreenSharer = null;
          io.to(`teaching:${sessId}`).emit('teaching:screen_share_stopped', {
            userId,
          });
        }
      }
    );

    // 7. In-Room Chat Messages
    socket.on(
      'teaching:send_chat',
      ({
        sessionId,
        text,
      }: {
        sessionId: number;
        text: string;
      }) => {
        const sessId = Number(sessionId);
        const room = activeTeachingRooms.get(sessId);
        if (!room) return;

        const participant = room.participants.get(userId);
        if (!participant) return;

        const cleanText = String(text || '').trim();
        if (!cleanText) return;

        const message: InRoomChatMessage = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          senderId: userId,
          senderName: participant.fullName,
          senderRole: participant.role,
          text: cleanText,
          timestamp: Date.now(),
        };

        room.chatMessages.push(message);
        if (room.chatMessages.length > 100) {
          room.chatMessages.shift();
        }

        io.to(`teaching:${sessId}`).emit('teaching:chat_message', message);
      }
    );

    // 8. Leave Room & Disconnect Handling
    const handleLeaveRoom = (sessId: number) => {
      const room = activeTeachingRooms.get(sessId);
      if (!room) return;

      const participant = room.participants.get(userId);
      if (participant) {
        room.participants.delete(userId);

        if (room.activeScreenSharer === userId) {
          room.activeScreenSharer = null;
          io.to(`teaching:${sessId}`).emit('teaching:screen_share_stopped', {
            userId,
          });
        }

        socket.to(`teaching:${sessId}`).emit('teaching:participant_left', {
          userId,
          fullName: participant.fullName,
        });

        // Clean up empty room after 5 minutes of inactivity
        if (room.participants.size === 0) {
          setTimeout(() => {
            const current = activeTeachingRooms.get(sessId);
            if (current && current.participants.size === 0) {
              activeTeachingRooms.delete(sessId);
            }
          }, 5 * 60 * 1000);
        }
      }
    };

    socket.on('teaching:leave_room', ({ sessionId }: { sessionId: number }) => {
      const sessId = Number(sessionId);
      if (sessId) {
        socket.leave(`teaching:${sessId}`);
        handleLeaveRoom(sessId);
      }
    });

    socket.on('disconnect', () => {
      const currentTeachingSessionId = socket.data.currentTeachingSessionId as
        | number
        | undefined;
      if (currentTeachingSessionId) {
        handleLeaveRoom(currentTeachingSessionId);
      }
    });
  });
}
