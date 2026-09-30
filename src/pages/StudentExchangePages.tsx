import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  X,
  MessageSquare,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  Send,
  Star,
  UserCheck,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  LearningRequestItem,
  ConnectionItem,
  SessionItem,
  ConversationItem,
  ChatMessageItem,
} from '../types.ts';
import {
  Avatar,
  SkillBadge,
  RatingStars,
  Modal,
  LoadingSkeleton,
  EmptyState,
  ErrorState,
  GlassCard,
  GlassButton,
} from '../components/ui/CommonUI.tsx';

// ============================================================================
// 1. LEARNING REQUESTS PAGE (/requests) - LIQUID GLASS
// ============================================================================
export const RequestsPage: React.FC = () => {
  const { apiFetch, showToast, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [incoming, setIncoming] = useState<LearningRequestItem[]>([]);
  const [outgoing, setOutgoing] = useState<LearningRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<{
        incoming: LearningRequestItem[];
        outgoing: LearningRequestItem[];
      }>('/api/requests');
      setIncoming(data.incoming || []);
      setOutgoing(data.outgoing || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load learning requests.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleUpdateStatus = async (
    id: number,
    status: 'Accepted' | 'Rejected' | 'Cancelled'
  ) => {
    setProcessingId(id);
    try {
      const res = await apiFetch<{ message: string }>(`/api/requests/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      showToast(res.message, status === 'Accepted' ? 'success' : 'info');
      await loadRequests();
      await refreshProfile();
    } catch (err: any) {
      showToast(err.message || 'Failed to update request.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Pending: 'bg-amber-500/20 text-amber-200 border-amber-400/35',
      Accepted: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/35',
      Rejected: 'bg-rose-500/20 text-rose-200 border-rose-400/35',
      Cancelled: 'bg-white/[0.06] text-white/55 border-white/15',
    };
    return (
      <span
        className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-semibold border ${
          map[status] || map.Pending
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-300">
            Exchange Invitations
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-0.5">
            Learning Requests
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Review incoming skill exchange invitations and track requests you have sent to peers.
          </p>
        </div>
        <GlassButton
          type="button"
          variant="primary"
          onClick={() => navigate('/discover')}
        >
          Find More Peers
        </GlassButton>
      </div>

      {error && <ErrorState message={error} onRetry={loadRequests} />}

      {loading ? (
        <LoadingSkeleton count={4} height="h-36" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incoming Requests */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center justify-between">
              <span>Incoming Requests</span>
              <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-200 text-xs font-mono">
                {incoming.length}
              </span>
            </h2>

            {incoming.length > 0 ? (
              incoming.map((req) => (
                <GlassCard key={req.id} level={2} className="p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={req.senderName} src={req.senderAvatar} />
                      <div>
                        <p className="text-sm font-bold text-white">{req.senderName}</p>
                        <p className="text-xs text-white/50">
                          {req.senderCollege || 'Student Peer'} •{' '}
                          {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {statusBadge(req.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-medium text-white/60">Wants to learn:</span>
                    <SkillBadge name={req.skillName} variant="teach" />
                    {req.offeredSkillName && (
                      <>
                        <span className="font-medium text-white/60 ml-1">Offers:</span>
                        <SkillBadge name={req.offeredSkillName} variant="learn" />
                      </>
                    )}
                  </div>

                  <p className="text-xs text-white/75 glass-level-1 p-3.5 rounded-xl leading-relaxed">
                    &ldquo;{req.message}&rdquo;
                  </p>

                  {req.status === 'Pending' && (
                    <div className="flex items-center justify-end gap-2.5 pt-1">
                      <GlassButton
                        type="button"
                        variant="danger"
                        size="sm"
                        disabled={processingId === req.id}
                        onClick={() => handleUpdateStatus(req.id, 'Rejected')}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </GlassButton>
                      <GlassButton
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={processingId === req.id}
                        onClick={() => handleUpdateStatus(req.id, 'Accepted')}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept &amp; Connect</span>
                      </GlassButton>
                    </div>
                  )}
                </GlassCard>
              ))
            ) : (
              <EmptyState
                title="No incoming learning requests yet."
                description="When peers want to learn a skill you teach, their requests will appear here."
              />
            )}
          </div>

          {/* Outgoing Requests */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center justify-between">
              <span>Outgoing Requests</span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 text-xs font-mono">
                {outgoing.length}
              </span>
            </h2>

            {outgoing.length > 0 ? (
              outgoing.map((req) => (
                <GlassCard key={req.id} level={2} className="p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={req.receiverName} src={req.receiverAvatar} />
                      <div>
                        <p className="text-sm font-bold text-white">To: {req.receiverName}</p>
                        <p className="text-xs text-white/50">
                          {req.receiverCollege || 'Student Peer'} •{' '}
                          {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {statusBadge(req.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-medium text-white/60">Requested Skill:</span>
                    <SkillBadge name={req.skillName} variant="learn" />
                    {req.offeredSkillName && (
                      <>
                        <span className="font-medium text-white/60 ml-1">Offered:</span>
                        <SkillBadge name={req.offeredSkillName} variant="teach" />
                      </>
                    )}
                  </div>

                  <p className="text-xs text-white/75 glass-level-1 p-3.5 rounded-xl leading-relaxed">
                    &ldquo;{req.message}&rdquo;
                  </p>

                  {req.status === 'Pending' && (
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      {req.receiverId.startsWith('demo-') && (
                        <GlassButton
                          type="button"
                          variant="primary"
                          size="sm"
                          disabled={processingId === req.id}
                          onClick={() => handleUpdateStatus(req.id, 'Accepted')}
                        >
                          Accept (Demo Peer)
                        </GlassButton>
                      )}
                      <GlassButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={processingId === req.id}
                        onClick={() => handleUpdateStatus(req.id, 'Cancelled')}
                      >
                        Cancel Request
                      </GlassButton>
                    </div>
                  )}

                  {req.status === 'Accepted' && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <GlassButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate('/messages')}
                      >
                        Open Chat
                      </GlassButton>
                      <GlassButton
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => navigate('/sessions')}
                      >
                        Schedule Session
                      </GlassButton>
                    </div>
                  )}
                </GlassCard>
              ))
            ) : (
              <EmptyState
                title="No outgoing learning requests yet."
                description="Browse Discover Peers to send your first skill exchange request."
                actionLabel="Discover Peers"
                onAction={() => navigate('/discover')}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. CONNECTIONS PAGE (/connections) - LIQUID GLASS
// ============================================================================
export const ConnectionsPage: React.FC = () => {
  const { apiFetch } = useAuth();
  const navigate = useNavigate();

  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadConnections = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<{ connections: ConnectionItem[] }>('/api/connections');
      setConnections(data.connections || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load connections.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-300">
            Active Network
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-0.5">
            Connected Peers
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Students you are actively connected with for 1-on-1 chat and learning sessions.
          </p>
        </div>
        <GlassButton
          type="button"
          variant="primary"
          onClick={() => navigate('/discover')}
        >
          Connect With More Peers
        </GlassButton>
      </div>

      {error && <ErrorState message={error} onRetry={loadConnections} />}

      {loading ? (
        <LoadingSkeleton count={3} height="h-56" />
      ) : connections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {connections.map((item) => (
            <GlassCard
              key={item.connectionId}
              level={2}
              interactive
              className="p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <Avatar name={item.peer.fullName} src={item.peer.avatarUrl} size="lg" />
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white truncate">
                      {item.peer.fullName}
                    </h3>
                    <p className="text-xs text-white/55 truncate">
                      {item.peer.college || 'University Campus'} • {item.peer.course || 'BCA'}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <RatingStars
                        rating={item.peer.averageRating}
                        count={item.peer.reviewCount}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl glass-level-1 text-xs flex items-center justify-between">
                  <span className="text-white/65 font-medium flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    Shared Sessions
                  </span>
                  <span className="font-mono font-bold text-white">
                    {item.completedSessionsCount} completed / {item.sharedSessionsCount} total
                  </span>
                </div>

                <div>
                  <p className="text-[11px] font-mono uppercase text-white/45 mb-1.5">
                    Can Teach
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.peer.teachingSkills.map((sk) => (
                      <SkillBadge key={sk.id} name={sk.name} level={sk.level} variant="teach" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3.5 border-t border-white/10 flex items-center gap-2.5 relative z-10">
                <GlassButton
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/messages')}
                  className="flex-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat</span>
                </GlassButton>
                <GlassButton
                  type="button"
                  variant="primary"
                  onClick={() => navigate('/sessions')}
                  className="flex-1"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule</span>
                </GlassButton>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No active peer connections yet."
          description="Send a learning request on the Discover Peers page and accept a connection to unlock chat and session scheduling."
          actionLabel="Discover Peers"
          onAction={() => navigate('/discover')}
        />
      )}
    </div>
  );
};

// ============================================================================
// 3. SESSIONS & SESSION DETAILS & RATINGS PAGE (/sessions) - LIQUID GLASS
// ============================================================================
export const SessionsPage: React.FC = () => {
  const { profile, catalogSkills, apiFetch, showToast, refreshProfile } = useAuth();

  const [sessionsList, setSessionsList] = useState<SessionItem[]>([]);
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [detailSession, setDetailSession] = useState<SessionItem | null>(null);
  const [editSession, setEditSession] = useState<SessionItem | null>(null);
  const [rateSession, setRateSession] = useState<SessionItem | null>(null);

  // Create form state
  const [selectedConnId, setSelectedConnId] = useState<number>(0);
  const [myRole, setMyRole] = useState<'learner' | 'teacher'>('learner');
  const [skillId, setSkillId] = useState<number>(0);
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState<string>('17:00');
  const [duration, setDuration] = useState<number>(60);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Rating form state
  const [ratingVal, setRatingVal] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sessRes, connRes] = await Promise.all([
        apiFetch<{ sessions: SessionItem[] }>('/api/sessions'),
        apiFetch<{ connections: ConnectionItem[] }>('/api/connections'),
      ]);
      setSessionsList(sessRes.sessions || []);
      setConnections(connRes.connections || []);
      if (connRes.connections?.length > 0 && !selectedConnId) {
        const firstConn = connRes.connections[0];
        setSelectedConnId(firstConn.connectionId);
        const defaultSkill =
          firstConn.peer.teachingSkills[0]?.skillId || catalogSkills[0]?.id || 0;
        setSkillId(defaultSkill);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, catalogSkills, selectedConnId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const conn = connections.find((c) => c.connectionId === Number(selectedConnId));
    if (!conn || !profile) {
      showToast('Please select a connected peer first.', 'error');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (scheduledDate < todayStr) {
      showToast('Cannot schedule a session in the past.', 'error');
      return;
    }

    const teacherId = myRole === 'teacher' ? profile.id : conn.peer.id;
    const learnerId = myRole === 'learner' ? profile.id : conn.peer.id;

    setSubmitting(true);
    try {
      await apiFetch('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          connectionId: conn.connectionId,
          teacherId,
          learnerId,
          skillId: Number(skillId),
          scheduledDate,
          startTime,
          duration: Number(duration),
          notes,
        }),
      });
      showToast('Session scheduled successfully.', 'success');
      setCreateOpen(false);
      setNotes('');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to schedule session.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSessionStatus = async (
    sess: SessionItem,
    status: 'Completed' | 'Cancelled'
  ) => {
    setSubmitting(true);
    try {
      const res = await apiFetch<{ message: string }>(`/api/sessions/${sess.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      showToast(res.message, status === 'Completed' ? 'success' : 'info');
      setDetailSession(null);
      await loadData();
      await refreshProfile();
      if (status === 'Completed' && !sess.review) {
        setRateSession({ ...sess, status: 'Completed' });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update session.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEditSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSession) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/sessions/${editSession.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          scheduledDate: editSession.scheduledDate,
          startTime: editSession.startTime,
          duration: editSession.duration,
          notes: editSession.notes,
        }),
      });
      showToast('Session updated successfully.', 'success');
      setEditSession(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update session.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateSession) return;
    if (!reviewComment.trim()) {
      showToast('Please write a brief comment about the session.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: rateSession.id,
          rating: ratingVal,
          comment: reviewComment.trim(),
        }),
      });
      showToast('Rating and review submitted!', 'success');
      setRateSession(null);
      setReviewComment('');
      await loadData();
      await refreshProfile();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const upcoming = sessionsList.filter((s) => s.status === 'Scheduled');
  const past = sessionsList.filter((s) => s.status !== 'Scheduled');
  const todayMin = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-violet-300">
            1-on-1 Study Calendar
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-0.5">
            Learning Sessions
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Schedule 1-on-1 peer study sessions, mark sessions complete, and rate your mentors.
          </p>
        </div>

        <GlassButton
          type="button"
          variant="primary"
          onClick={() => setCreateOpen(true)}
          className="self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Session</span>
        </GlassButton>
      </div>

      {error && <ErrorState message={error} onRetry={loadData} />}

      {loading ? (
        <LoadingSkeleton count={4} height="h-40" />
      ) : (
        <div className="space-y-8">
          {/* Upcoming Sessions */}
          <section className="space-y-4">
            <h2 className="text-base font-bold text-white">
              Upcoming Sessions ({upcoming.length})
            </h2>
            {upcoming.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {upcoming.map((s) => (
                  <GlassCard
                    key={s.id}
                    level={2}
                    className="p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <SkillBadge name={s.skillName} variant="teach" />
                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-200 border border-indigo-400/35 text-xs font-mono font-semibold">
                          Scheduled
                        </span>
                      </div>
                      <div className="pt-1 text-xs text-white/65 space-y-1.5">
                        <p>
                          <strong className="text-white">Teacher:</strong> {s.teacherName} •{' '}
                          <strong className="text-white">Learner:</strong> {s.learnerName}
                        </p>
                        <p className="flex items-center gap-2 text-cyan-300 font-mono font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                          <span>
                            {s.scheduledDate} at {s.startTime} ({s.duration} mins)
                          </span>
                        </p>
                        {s.notes && (
                          <p className="text-white/50 italic">&ldquo;{s.notes}&rdquo;</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                      <GlassButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setDetailSession(s)}
                      >
                        View Details
                      </GlassButton>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditSession(s)}
                          className="p-1.5 rounded-xl bg-white/[0.06] border border-white/12 text-white/70 hover:text-white hover:bg-white/12"
                          title="Edit Session"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <GlassButton
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleUpdateSessionStatus(s, 'Cancelled')}
                        >
                          Cancel
                        </GlassButton>
                        <GlassButton
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateSessionStatus(s, 'Completed')}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Complete</span>
                        </GlassButton>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No upcoming sessions."
                description="Schedule a learning session with one of your connected peers above."
                actionLabel="Schedule Session"
                onAction={() => setCreateOpen(true)}
              />
            )}
          </section>

          {/* Past Sessions */}
          <section className="space-y-4">
            <h2 className="text-base font-bold text-white">
              Past &amp; Completed Sessions ({past.length})
            </h2>
            {past.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {past.map((s) => (
                  <GlassCard
                    key={s.id}
                    level={2}
                    className="p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <SkillBadge name={s.skillName} variant="neutral" />
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-semibold border ${
                            s.status === 'Completed'
                              ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/35'
                              : 'bg-white/[0.06] text-white/55 border-white/12'
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                      <p className="text-xs text-white/65">
                        <strong className="text-white">Teacher:</strong> {s.teacherName} •{' '}
                        <strong className="text-white">Learner:</strong> {s.learnerName}
                      </p>
                      <p className="text-xs font-mono text-white/50">
                        {s.scheduledDate} at {s.startTime} ({s.duration} mins)
                      </p>
                      {s.review && (
                        <div className="p-3 rounded-xl glass-level-1 text-xs space-y-1">
                          <RatingStars rating={s.review.rating} />
                          <p className="text-white/75">&ldquo;{s.review.comment}&rdquo;</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3.5 border-t border-white/10 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setDetailSession(s)}
                        className="text-xs font-semibold text-white/60 hover:text-white"
                      >
                        Session Details
                      </button>

                      {s.status === 'Completed' && !s.review && (
                        <GlassButton
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setRatingVal(5);
                            setReviewComment('');
                            setRateSession(s);
                          }}
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                          <span>Rate Session</span>
                        </GlassButton>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/40 italic">No past sessions recorded yet.</p>
            )}
          </section>
        </div>
      )}

      {/* Create Session Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Schedule a Learning Session"
      >
        {connections.length === 0 ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-sm text-white/65">
              You need an active peer connection before scheduling a learning session.
            </p>
          </div>
        ) : (
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/75 mb-1.5">
                Connected Peer
              </label>
              <select
                required
                value={selectedConnId}
                onChange={(e) => setSelectedConnId(Number(e.target.value))}
                className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
              >
                {connections.map((c) => (
                  <option key={c.connectionId} value={c.connectionId}>
                    {c.peer.fullName} ({c.peer.college || 'Campus Peer'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/75 mb-1.5">Your Role</label>
                <select
                  value={myRole}
                  onChange={(e) => setMyRole(e.target.value as 'learner' | 'teacher')}
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                >
                  <option value="learner">I am the Learner</option>
                  <option value="teacher">I am the Teacher</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/75 mb-1.5">
                  Skill Topic
                </label>
                <select
                  required
                  value={skillId}
                  onChange={(e) => setSkillId(Number(e.target.value))}
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                >
                  {catalogSkills.map((sk) => (
                    <option key={sk.id} value={sk.id}>
                      {sk.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/75 mb-1.5">Date</label>
                <input
                  type="date"
                  required
                  min={todayMin}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/75 mb-1.5">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/75 mb-1.5">
                  Duration (min)
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                >
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                  <option value={90}>90 mins</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/75 mb-1.5">
                Session Agenda &amp; Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Topics to cover, exercises, or meeting link..."
                className="glass-input w-full px-3.5 py-2 rounded-xl text-sm"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <GlassButton
                type="button"
                variant="secondary"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </GlassButton>
              <GlassButton type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Scheduling...' : 'Schedule Session'}
              </GlassButton>
            </div>
          </form>
        )}
      </Modal>

      {/* Session Details Modal */}
      <Modal
        open={Boolean(detailSession)}
        onClose={() => setDetailSession(null)}
        title="Learning Session Details"
      >
        {detailSession && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between p-4 rounded-2xl glass-level-1">
              <div>
                <span className="text-[11px] font-mono text-white/45 uppercase block">Skill</span>
                <span className="text-base font-bold text-white">{detailSession.skillName}</span>
              </div>
              <span className="px-3 py-1 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 font-mono font-bold text-xs">
                {detailSession.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl glass-level-1">
                <span className="text-white/45 font-mono uppercase block">Teacher</span>
                <span className="font-bold text-white text-sm mt-0.5 block">
                  {detailSession.teacherName}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl glass-level-1">
                <span className="text-white/45 font-mono uppercase block">Learner</span>
                <span className="font-bold text-white text-sm mt-0.5 block">
                  {detailSession.learnerName}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-level-1 text-xs space-y-1.5 text-white/75">
              <p>
                <strong className="text-white">Date:</strong> {detailSession.scheduledDate}
              </p>
              <p>
                <strong className="text-white">Start Time:</strong> {detailSession.startTime}
              </p>
              <p>
                <strong className="text-white">Duration:</strong> {detailSession.duration} minutes
              </p>
              <p>
                <strong className="text-white">Notes:</strong>{' '}
                {detailSession.notes || 'No additional notes'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              {detailSession.status === 'Scheduled' && (
                <>
                  <GlassButton
                    type="button"
                    variant="danger"
                    onClick={() => handleUpdateSessionStatus(detailSession, 'Cancelled')}
                  >
                    Cancel Session
                  </GlassButton>
                  <GlassButton
                    type="button"
                    variant="primary"
                    onClick={() => handleUpdateSessionStatus(detailSession, 'Completed')}
                  >
                    Mark Complete
                  </GlassButton>
                </>
              )}
              {detailSession.status === 'Completed' && !detailSession.review && (
                <GlassButton
                  type="button"
                  variant="primary"
                  onClick={() => {
                    const s = detailSession;
                    setDetailSession(null);
                    setRateSession(s);
                  }}
                >
                  Rate this session
                </GlassButton>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Session Modal */}
      <Modal
        open={Boolean(editSession)}
        onClose={() => setEditSession(null)}
        title="Edit Scheduled Session"
      >
        {editSession && (
          <form onSubmit={handleSaveEditSession} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/75 mb-1">Date</label>
                <input
                  type="date"
                  min={todayMin}
                  required
                  value={editSession.scheduledDate}
                  onChange={(e) =>
                    setEditSession({ ...editSession, scheduledDate: e.target.value })
                  }
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/75 mb-1">Time</label>
                <input
                  type="time"
                  required
                  value={editSession.startTime}
                  onChange={(e) => setEditSession({ ...editSession, startTime: e.target.value })}
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/75 mb-1">Duration</label>
                <input
                  type="number"
                  required
                  value={editSession.duration}
                  onChange={(e) =>
                    setEditSession({ ...editSession, duration: Number(e.target.value) })
                  }
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/75 mb-1">Notes</label>
              <textarea
                rows={3}
                value={editSession.notes}
                onChange={(e) => setEditSession({ ...editSession, notes: e.target.value })}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <GlassButton
                type="button"
                variant="secondary"
                onClick={() => setEditSession(null)}
              >
                Cancel
              </GlassButton>
              <GlassButton type="submit" variant="primary" disabled={submitting}>
                Save Changes
              </GlassButton>
            </div>
          </form>
        )}
      </Modal>

      {/* Rate Session Modal */}
      <Modal
        open={Boolean(rateSession)}
        onClose={() => setRateSession(null)}
        title="Rate This Learning Session"
      >
        {rateSession && (
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <p className="text-xs text-white/70">
              How was your <strong className="text-white">{rateSession.skillName}</strong> session
              with{' '}
              <strong className="text-white">
                {rateSession.teacherId === profile?.id
                  ? rateSession.learnerName
                  : rateSession.teacherName}
              </strong>
              ?
            </p>

            <div>
              <label className="block text-xs font-medium text-white/75 mb-1.5">
                Star Rating (1 to 5 Stars)
              </label>
              <RatingStars
                rating={ratingVal}
                interactive
                size="md"
                onChange={(val) => setRatingVal(val)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/75 mb-1.5">
                Review Comment
              </label>
              <textarea
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share how helpful the explanation and examples were..."
                className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <GlassButton
                type="button"
                variant="secondary"
                onClick={() => setRateSession(null)}
              >
                Later
              </GlassButton>
              <GlassButton type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </GlassButton>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

// ============================================================================
// 4. MESSAGES / CHAT SYSTEM PAGE (/messages) - LIQUID GLASS MESSAGING
// ============================================================================
export const MessagesPage: React.FC = () => {
  const { profile, apiFetch, showToast } = useAuth();
  const navigate = useNavigate();

  const [conversationsList, setConversationsList] = useState<ConversationItem[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationItem | null>(null);
  const [messagesList, setMessagesList] = useState<ChatMessageItem[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const data = await apiFetch<{ conversations: ConversationItem[] }>('/api/conversations');
      const list = data.conversations || [];
      setConversationsList(list);
      if (list.length > 0 && !activeConv) {
        setActiveConv(list[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, activeConv]);

  const loadMessages = useCallback(
    async (convId: number) => {
      try {
        const data = await apiFetch<{ messages: ChatMessageItem[] }>(
          `/api/conversations/${convId}/messages`
        );
        setMessagesList(data.messages || []);
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    },
    [apiFetch]
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeConv) return;
    loadMessages(activeConv.id);
    const interval = setInterval(() => {
      loadMessages(activeConv.id);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeConv, loadMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesList]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !text.trim()) return;
    setSending(true);
    try {
      const res = await apiFetch<{ messages: ChatMessageItem[] }>(
        `/api/conversations/${activeConv.id}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ content: text.trim() }),
        }
      );
      setMessagesList(res.messages || []);
      setText('');
      await loadConversations();
    } catch (err: any) {
      showToast(err.message || 'Failed to send message.', 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={2} height="h-96" />;
  }

  if (conversationsList.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-300">
            Real-Time Peer Chat
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-0.5">
            Peer Messages
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Only connected peers can message each other on SkillBridge.
          </p>
        </div>
        <EmptyState
          title="No active conversations yet."
          description="Connect with a peer via Discover Peers or accept a learning request to start chatting."
          actionLabel="Discover Peers"
          onAction={() => navigate('/discover')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <span className="text-xs font-mono uppercase tracking-wider text-cyan-300">
          Real-Time Peer Chat
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-0.5">
          Peer Messages
        </h1>
        <p className="text-sm text-white/60">
          Direct 1-on-1 conversations with your connected learning partners.
        </p>
      </div>

      <GlassCard
        level={2}
        className="overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[620px]"
      >
        {/* Left Conversation List */}
        <div className="md:col-span-4 border-r border-white/10 overflow-y-auto bg-white/[0.02]">
          <div className="p-4 border-b border-white/10 font-mono text-[11px] uppercase tracking-wider text-white/45">
            Connected Peers ({conversationsList.length})
          </div>
          <div className="divide-y divide-white/[0.06]">
            {conversationsList.map((conv) => {
              const isSelected = activeConv?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setActiveConv(conv)}
                  className={`w-full p-4 text-left flex items-start justify-between gap-3 transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-violet-600/25 via-indigo-600/20 to-transparent border-l-2 border-cyan-400'
                      : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <Avatar name={conv.peer.fullName} src={conv.peer.avatarUrl} />
                      <span
                        className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0B0B12] absolute bottom-0 right-0"
                        title="Active"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {conv.peer.fullName}
                      </p>
                      <p className="text-xs text-white/50 truncate mt-0.5">
                        {conv.lastMessage ? conv.lastMessage.content : 'Start chatting...'}
                      </p>
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/25 border border-cyan-400/35 text-cyan-200 text-[10px] font-mono font-bold">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Chat Window */}
        <div className="md:col-span-8 flex flex-col h-full bg-[#07070B]/40">
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.03] backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <Avatar name={activeConv.peer.fullName} src={activeConv.peer.avatarUrl} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">
                        {activeConv.peer.fullName}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online
                      </span>
                    </div>
                    <p className="text-xs text-white/50">{activeConv.peer.college}</p>
                  </div>
                </div>

                <GlassButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/sessions')}
                >
                  <Clock className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Schedule Session</span>
                </GlassButton>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3.5">
                {messagesList.length > 0 ? (
                  messagesList.map((m) => {
                    const isMine = m.senderId === profile?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                            isMine
                              ? 'btn-liquid-primary rounded-br-xs'
                              : 'glass-level-2 text-white/90 rounded-bl-xs'
                          }`}
                        >
                          <p>{m.content}</p>
                        </div>
                        <span className="text-[10px] font-mono text-white/40 mt-1 px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-white/40 text-center py-12">
                    Say hello to {activeConv.peer.fullName.split(' ')[0]} to coordinate your next
                    learning session!
                  </p>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Bar */}
              <form
                onSubmit={handleSend}
                className="p-3.5 bg-white/[0.03] border-t border-white/10 flex items-center gap-2.5"
              >
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`Message ${activeConv.peer.fullName}...`}
                  className="glass-input flex-1 px-4 py-2.5 rounded-xl text-sm"
                />
                <GlassButton
                  type="submit"
                  variant="primary"
                  disabled={sending || !text.trim()}
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </GlassButton>
              </form>
            </>
          ) : null}
        </div>
      </GlassCard>
    </div>
  );
};
