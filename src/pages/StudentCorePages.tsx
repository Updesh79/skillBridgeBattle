import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Calendar,
  Star,
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Flag,
  Ban,
  ArrowRight,
  Clock,
  GraduationCap,
  MapPin,
  Target,
  Bell,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  PeerProfile,
  SessionItem,
  NotificationItemData,
  ConnectionItem,
} from '../types.ts';
import {
  Avatar,
  SkillBadge,
  MatchScore,
  RatingStars,
  Modal,
  LoadingSkeleton,
  EmptyState,
  ErrorState,
  SearchBar,
  Pagination,
  PeerCard,
  GlassCard,
  GlassButton,
  GlassProgress,
  GlassStatCard,
  DeveloperCodeBackdrop,
} from '../components/ui/CommonUI.tsx';
import { BattleStatsSection } from './SkillBattlePages.tsx';

// Shared Modal: View Peer Profile + Rule-Based Match Breakdown + Report/Block
export const PeerProfileModal: React.FC<{
  peer: PeerProfile | null;
  onClose: () => void;
  onSendRequest: (peer: PeerProfile) => void;
  onBlockedOrReported?: () => void;
}> = ({ peer, onClose, onSendRequest, onBlockedOrReported }) => {
  const { apiFetch, showToast } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Spam');
  const [reportDesc, setReportDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!peer) return null;

  const handleBlock = async () => {
    setSubmitting(true);
    try {
      await apiFetch('/api/blocked', {
        method: 'POST',
        body: JSON.stringify({ blockedUserId: peer.id }),
      });
      showToast(`${peer.fullName} has been blocked.`, 'info');
      onBlockedOrReported?.();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to block user.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          reportedUserId: peer.id,
          reason: reportReason,
          description: reportDesc,
        }),
      });
      showToast('Report submitted to administrators.', 'success');
      setReportOpen(false);
      setReportDesc('');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit report.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={Boolean(peer)} onClose={onClose} title="Student Peer Profile" maxWidth="max-w-2xl">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Avatar name={peer.fullName} src={peer.avatarUrl} size="xl" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">{peer.fullName}</h2>
                {peer.isVerifiedMentor ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/35">
                    <CheckCircle2 className="w-3 h-3" /> Verified Mentor
                  </span>
                ) : peer.accountType === 'MENTOR' ? (
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-400/25">
                    Mentor
                  </span>
                ) : peer.isDemo ? (
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/[0.08] text-white/70 border border-white/15">
                    Campus Peer
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-white/65 flex items-center gap-1.5 mt-1">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                <span>
                  {peer.college || 'University Campus'} • {peer.course || peer.qualification || 'BCA'}{' '}
                  {peer.year ? `(${peer.year})` : ''}
                </span>
              </p>
              {peer.isVerifiedMentor && peer.verifiedSkills && (
                <p className="text-[11px] font-mono text-emerald-300 mt-0.5">
                  Verified Skills: {peer.verifiedSkills}
                </p>
              )}
              {peer.location && (
                <p className="text-xs text-white/50 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{peer.location}</span>
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <RatingStars rating={peer.averageRating} count={peer.reviewCount} />
                <span className="text-xs font-mono text-white/50">
                  • {peer.completedSessionsCount} completed sessions
                </span>
                {peer.experienceYears && (
                  <span className="text-xs font-mono text-cyan-300">
                    • {peer.experienceYears} yrs experience
                  </span>
                )}
              </div>
              {(peer.githubUrl || peer.linkedinUrl) && (
                <div className="flex items-center gap-3 mt-1.5 text-xs">
                  {peer.githubUrl && (
                    <a
                      href={peer.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-300 hover:underline font-mono"
                    >
                      GitHub ↗
                    </a>
                  )}
                  {peer.linkedinUrl && (
                    <a
                      href={peer.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-300 hover:underline font-mono"
                    >
                      LinkedIn ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2">
            <MatchScore score={peer.match?.score || 0} isMutual={peer.match?.isMutualExchange} />
            <span className="text-xs text-white/55 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {peer.availability || 'Weekdays & Weekends'}
            </span>
          </div>
        </div>

        {/* Bio */}
        {peer.bio && (
          <div>
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-white/45 mb-1">
              Academic Bio
            </h4>
            <p className="text-sm text-white/80 leading-relaxed">{peer.bio}</p>
          </div>
        )}

        {/* Rule-Based Compatibility Breakdown Box */}
        {peer.match && (
          <div className="p-4 rounded-2xl glass-level-1 border border-white/15 space-y-3 relative overflow-hidden">
            <DeveloperCodeBackdrop />
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-violet-400" />
                Rule-Based Compatibility Breakdown
              </span>
              <span className="text-sm font-mono font-bold text-emerald-300">
                {peer.match.score}% Match
              </span>
            </div>

            {peer.match.summaryLines.length > 0 && (
              <div className="relative z-10 space-y-1 bg-emerald-500/10 p-3 rounded-xl border border-emerald-400/25">
                {peer.match.summaryLines.map((line, idx) => (
                  <p key={idx} className="text-xs text-emerald-200 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{line}</span>
                  </p>
                ))}
              </div>
            )}

            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="text-white/50 block text-[10px]">Teaches You</span>
                <span className="font-mono font-bold text-white">
                  +{peer.match.breakdown.teachesMePoints} / 50
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="text-white/50 block text-[10px]">Learns From You</span>
                <span className="font-mono font-bold text-white">
                  +{peer.match.breakdown.learnsFromMePoints} / 30
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="text-white/50 block text-[10px]">Category Match</span>
                <span className="font-mono font-bold text-white">
                  +{peer.match.breakdown.categoryPoints} / 10
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="text-white/50 block text-[10px]">Schedule Overlap</span>
                <span className="font-mono font-bold text-white">
                  +{peer.match.breakdown.availabilityPoints} / 10
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Skills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl glass-level-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-violet-300 mb-2.5">
              Skills {peer.fullName.split(' ')[0]} Can Teach
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {peer.teachingSkills.map((s) => (
                <SkillBadge key={s.id} name={s.name} level={s.level} variant="teach" />
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-level-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-2.5">
              Skills {peer.fullName.split(' ')[0]} Wants To Learn
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {peer.learningSkills.map((s) => (
                <SkillBadge key={s.id} name={s.name} level={s.level} variant="learn" />
              ))}
            </div>
          </div>
        </div>

        {/* Recent Reviews */}
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-white/45 mb-2.5">
            Recent Student Reviews ({peer.reviewCount})
          </h4>
          {peer.recentReviews && peer.recentReviews.length > 0 ? (
            <div className="space-y-2.5">
              {peer.recentReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3.5 rounded-xl glass-level-1 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{rev.reviewerName}</span>
                    <RatingStars rating={rev.rating} />
                  </div>
                  <p className="text-white/65">{rev.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/40 italic">No reviews yet.</p>
          )}
        </div>

        {/* Report Form if toggled */}
        {reportOpen && (
          <form
            onSubmit={handleReport}
            className="p-4 rounded-2xl bg-rose-500/10 border border-rose-400/30 space-y-3"
          >
            <h5 className="text-xs font-bold text-rose-200 uppercase tracking-wider">
              Report {peer.fullName}
            </h5>
            <div>
              <label className="block text-xs font-medium text-rose-200 mb-1">Reason</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              >
                <option value="Spam">Spam</option>
                <option value="Harassment">Harassment</option>
                <option value="Fake profile">Fake profile</option>
                <option value="Inappropriate behavior">Inappropriate behavior</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-rose-200 mb-1">
                Additional Details
              </label>
              <textarea
                rows={2}
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Describe the issue..."
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <GlassButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setReportOpen(false)}
              >
                Cancel
              </GlassButton>
              <GlassButton type="submit" variant="danger" size="sm" disabled={submitting}>
                Submit Report
              </GlassButton>
            </div>
          </form>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReportOpen(!reportOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-rose-300 hover:bg-rose-500/15 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report</span>
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleBlock}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-rose-300 hover:bg-rose-500/15 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Block User</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <GlassButton type="button" variant="secondary" onClick={onClose}>
              Close
            </GlassButton>
            {!peer.isConnected && !peer.hasPendingRequest && (
              <GlassButton
                type="button"
                variant="primary"
                onClick={() => {
                  onClose();
                  onSendRequest(peer);
                }}
              >
                Send Learning Request
              </GlassButton>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Shared Modal: Send Learning Request
export const SendRequestModal: React.FC<{
  peer: PeerProfile | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ peer, onClose, onSuccess }) => {
  const { profile, apiFetch, showToast } = useAuth();
  const [skillId, setSkillId] = useState<number>(0);
  const [offeredSkillId, setOfferedSkillId] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [autoAcceptDemo, setAutoAcceptDemo] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (peer) {
      const preferredLearn =
        peer.match?.peerCanTeachMe?.[0]?.skillId || peer.teachingSkills?.[0]?.skillId || 0;
      const preferredOffer =
        peer.match?.iCanTeachPeer?.[0]?.skillId || profile?.teachingSkills?.[0]?.skillId || 0;
      setSkillId(preferredLearn);
      setOfferedSkillId(preferredOffer);

      const learnName =
        peer.teachingSkills.find((s) => s.skillId === preferredLearn)?.name || 'your skill';
      const offerName =
        profile?.teachingSkills.find((s) => s.skillId === preferredOffer)?.name || 'my skills';
      setMessage(
        `Hi ${peer.fullName.split(' ')[0]}, I want to learn ${learnName} from you. I can help you with ${offerName} in exchange.`
      );
    }
  }, [peer, profile]);

  if (!peer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillId || !message.trim()) {
      showToast('Please select a skill and write a message.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/api/requests', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: peer.id,
          skillId,
          offeredSkillId: offeredSkillId || null,
          message: message.trim(),
          autoAcceptDemo: peer.isDemo ? autoAcceptDemo : false,
        }),
      });
      showToast(
        peer.isDemo && autoAcceptDemo
          ? `Connected with ${peer.fullName}! You can now chat and schedule sessions.`
          : 'Learning request sent.',
        'success'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to send request. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={Boolean(peer)}
      onClose={onClose}
      title={`Send Learning Request to ${peer.fullName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-white/75 mb-1.5">
            Skill You Want to Learn from {peer.fullName.split(' ')[0]}
          </label>
          <select
            required
            value={skillId}
            onChange={(e) => setSkillId(Number(e.target.value))}
            className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
          >
            {peer.teachingSkills.map((sk) => (
              <option key={sk.skillId} value={sk.skillId}>
                {sk.name} ({sk.level})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/75 mb-1.5">
            Skill You Can Offer in Exchange (Optional)
          </label>
          <select
            value={offeredSkillId}
            onChange={(e) => setOfferedSkillId(Number(e.target.value))}
            className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
          >
            <option value={0}>-- Select a skill you teach --</option>
            {profile?.teachingSkills.map((sk) => (
              <option key={sk.skillId} value={sk.skillId}>
                {sk.name} ({sk.level})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/75 mb-1.5">
            Personal Message
          </label>
          <textarea
            rows={4}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi, I want to learn Python from you. I can help you with UI design in exchange."
            className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
          />
        </div>

        {peer.isDemo && (
          <label className="flex items-start gap-2.5 p-3.5 rounded-xl bg-indigo-500/15 border border-indigo-400/30 cursor-pointer">
            <input
              type="checkbox"
              checked={autoAcceptDemo}
              onChange={(e) => setAutoAcceptDemo(e.target.checked)}
              className="mt-0.5 rounded accent-indigo-500"
            />
            <div className="text-xs">
              <span className="font-semibold text-white block">
                Instant Campus Peer Connection (Demo Mode)
              </span>
              <span className="text-white/65">
                Automatically accept this request from {peer.fullName.split(' ')[0]} so you can
                immediately test Chat and Session Scheduling.
              </span>
            </div>
          </label>
        )}

        <div className="flex justify-end gap-2.5 pt-2">
          <GlassButton type="button" variant="secondary" onClick={onClose}>
            Cancel
          </GlassButton>
          <GlassButton type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send Request'}
          </GlassButton>
        </div>
      </form>
    </Modal>
  );
};

// ============================================================================
// 1. STUDENT DASHBOARD PAGE (/dashboard) - PREMIUM LIQUID GLASS COMMAND CENTER
// ============================================================================
export const DashboardPage: React.FC = () => {
  const { profile, apiFetch, refreshProfile, showToast, unreadNotifications } = useAuth();
  const navigate = useNavigate();

  const [recommendedPeers, setRecommendedPeers] = useState<PeerProfile[]>([]);
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<SessionItem[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeer, setSelectedPeer] = useState<PeerProfile | null>(null);
  const [requestPeer, setRequestPeer] = useState<PeerProfile | null>(null);
  const [applyingPreset, setApplyingPreset] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [discRes, connRes, sessRes, notifRes] = await Promise.all([
        apiFetch<{ peers: PeerProfile[] }>('/api/discover'),
        apiFetch<{ connections: ConnectionItem[] }>('/api/connections'),
        apiFetch<{ sessions: SessionItem[] }>('/api/sessions'),
        apiFetch<{ notifications: NotificationItemData[] }>('/api/notifications'),
      ]);

      setRecommendedPeers(discRes.peers.slice(0, 3));
      setConnections(connRes.connections || []);
      setUpcomingSessions(
        (sessRes.sessions || []).filter((s) => s.status === 'Scheduled').slice(0, 4)
      );
      setRecentNotifications((notifRes.notifications || []).slice(0, 4));
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleApplyVivaPreset = async () => {
    setApplyingPreset(true);
    try {
      const res = await apiFetch<{ message: string }>('/api/my-skills/viva-preset', {
        method: 'POST',
      });
      showToast(res.message, 'success');
      await refreshProfile();
      await loadDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Failed to apply preset.', 'error');
    } finally {
      setApplyingPreset(false);
    }
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const topMatchScore = recommendedPeers[0]?.match?.score || 90;
  const activeGoalsCount =
    profile?.goals?.filter((g) => g.status !== 'Completed').length || 0;

  return (
    <div className="space-y-8">
      {/* Top Command Center Welcome Banner */}
      <GlassCard level={2} className="relative overflow-hidden p-6 sm:p-8">
        <DeveloperCodeBackdrop variant="hero" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/15 text-[11px] font-mono text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Welcome back • {profile?.college || 'University Campus'} •{' '}
                {profile?.availability || 'Flexible Schedule'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              {greeting}, {profile?.fullName.split(' ')[0]}
            </h1>
            <p className="text-xs sm:text-sm text-white/65 max-w-2xl leading-relaxed">
              Your peer skill exchange command center. Review compatibility matches, manage study
              sessions, and monitor your academic skill mastery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {profile &&
              profile.teachingSkills.length === 0 &&
              profile.learningSkills.length === 0 && (
                <GlassButton
                  type="button"
                  variant="secondary"
                  disabled={applyingPreset}
                  onClick={handleApplyVivaPreset}
                >
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>
                    {applyingPreset
                      ? 'Configuring...'
                      : 'Load Mutual Match Demo (UI/UX ↔ Python)'}
                  </span>
                </GlassButton>
              )}
            <GlassButton
              type="button"
              variant="primary"
              size="lg"
              onClick={() => navigate('/discover')}
            >
              <span>Discover Peers</span>
              <ArrowRight className="w-4 h-4" />
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {error && <ErrorState message={error} onRetry={loadDashboardData} />}

      {/* 6 Visually Rich Liquid Glass Command Cards: Compatibility, Connections, Learning Sessions, Learning Progress, Goals, Notifications */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <GlassStatCard
          label="Compatibility"
          value={`${topMatchScore}%`}
          sub={`${profile?.teachingSkills.length || 0} teaching • ${
            profile?.learningSkills.length || 0
          } learning`}
          icon={Sparkles}
          accent="purple"
          onClick={() => navigate('/discover')}
        />
        <GlassStatCard
          label="Connections"
          value={connections.length}
          sub="Active peer exchanges"
          icon={Users}
          accent="cyan"
          onClick={() => navigate('/connections')}
        />
        <GlassStatCard
          label="Learning Sessions"
          value={upcomingSessions.length}
          sub={`${profile?.completedSessionsCount || 0} completed total`}
          icon={Calendar}
          accent="blue"
          onClick={() => navigate('/sessions')}
        />
        <GlassStatCard
          label="Learning Progress"
          value={`${profile?.overallProgress || 0}%`}
          sub={`${profile?.progress?.length || 0} skills tracked`}
          icon={TrendingUp}
          accent="emerald"
          onClick={() => navigate('/progress')}
        />
        <GlassStatCard
          label="Goals"
          value={activeGoalsCount}
          sub={`${profile?.goals?.length || 0} total learning goals`}
          icon={Target}
          accent="amber"
          onClick={() => navigate('/goals')}
        />
        <GlassStatCard
          label="Notifications"
          value={unreadNotifications}
          sub={
            profile?.averageRating
              ? `${profile.averageRating.toFixed(1)} ★ avg rating`
              : 'All caught up'
          }
          icon={Bell}
          accent="rose"
          onClick={() => navigate('/notifications')}
        />
      </div>

      {/* 1 vs 1 Skill Battle Stats Overview */}
      <BattleStatsSection compact />

      {/* Recommended Peers For You */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Recommended Peers For You
            </h2>
            <p className="text-xs text-white/55">
              Ranked by rule-based mutual skill exchange compatibility (+50/+30/+10/+10)
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/discover')}
            className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
          >
            <span>Explore Community</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <LoadingSkeleton count={3} height="h-72" />
        ) : recommendedPeers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommendedPeers.map((peer) => (
              <PeerCard
                key={peer.id}
                peer={peer}
                onViewProfile={(p) => setSelectedPeer(p)}
                onSendRequest={(p) => setRequestPeer(p)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No recommended peers found."
            description="Add skills you can teach and skills you want to learn so we can compute your peer compatibility matches."
            actionLabel="Add My Skills"
            onAction={() => navigate('/my-skills')}
          />
        )}
      </section>

      {/* Bottom Split: Learning Progress + Upcoming Sessions & Recent Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Learning Progress */}
        <GlassCard level={2} className="lg:col-span-6 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Learning Progress</h3>
              <p className="text-xs text-white/55 mt-0.5">
                Overall Mastery:{' '}
                <strong className="font-mono text-cyan-300">
                  {profile?.overallProgress || 0}%
                </strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/progress')}
              className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
            >
              Manage Progress →
            </button>
          </div>

          {profile?.progress && profile.progress.length > 0 ? (
            <div className="space-y-3.5">
              {profile.progress.map((prog) => (
                <div
                  key={prog.id}
                  className="p-4 rounded-2xl glass-level-1 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white text-sm">{prog.skillName}</span>
                      <span className="text-white/50 ml-2 font-mono text-[11px]">
                        {prog.startingLevel} → {prog.currentLevel}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-cyan-300">
                      {prog.progressPercentage}%
                    </span>
                  </div>
                  <GlassProgress value={prog.progressPercentage} accent="indigo" />
                  <div className="flex items-center justify-between text-[11px] text-white/50">
                    <span className="font-mono">Sessions: {prog.sessionsCompleted}</span>
                    {prog.topicsCompleted && (
                      <span className="truncate max-w-[240px]">
                        Topics: {prog.topicsCompleted}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No learning progress tracked yet."
              description="Add a skill you want to learn or click 'Load Mutual Match Demo' above to start tracking."
              actionLabel="Go to Progress"
              onAction={() => navigate('/progress')}
            />
          )}
        </GlassCard>

        {/* Upcoming Sessions & Recent Activity */}
        <div className="lg:col-span-6 space-y-6">
          <GlassCard level={2} className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight">Upcoming Sessions</h3>
              <button
                type="button"
                onClick={() => navigate('/sessions')}
                className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
              >
                View All →
              </button>
            </div>

            {upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="p-4 rounded-2xl glass-level-1 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{sess.skillName}</p>
                      <p className="text-xs text-white/60 mt-0.5">
                        Teacher: {sess.teacherName} • Learner: {sess.learnerName}
                      </p>
                      <p className="text-xs text-cyan-300 font-mono font-medium mt-1">
                        {sess.scheduledDate} at {sess.startTime} ({sess.duration} mins)
                      </p>
                    </div>
                    <GlassButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate('/sessions')}
                    >
                      Details
                    </GlassButton>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-white/50 py-6 text-center rounded-2xl glass-level-1">
                No upcoming sessions scheduled yet. Connect with a peer to book a session!
              </div>
            )}
          </GlassCard>

          {/* Recent Notifications */}
          <GlassCard level={2} className="p-6 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight">
                Recent Notifications
              </h3>
              <button
                type="button"
                onClick={() => navigate('/notifications')}
                className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
              >
                All Notifications →
              </button>
            </div>
            {recentNotifications.length > 0 ? (
              <div className="space-y-2.5">
                {recentNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-2xl border text-xs transition-all ${
                      n.isRead
                        ? 'glass-level-1 text-white/60'
                        : 'bg-indigo-500/15 border-indigo-400/30 text-white'
                    }`}
                  >
                    <p className="font-bold text-white">{n.title}</p>
                    <p className="mt-0.5 text-white/70">{n.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/45 italic">No notifications yet.</p>
            )}
          </GlassCard>
        </div>
      </div>

      <PeerProfileModal
        peer={selectedPeer}
        onClose={() => setSelectedPeer(null)}
        onSendRequest={(p) => setRequestPeer(p)}
        onBlockedOrReported={loadDashboardData}
      />

      <SendRequestModal
        peer={requestPeer}
        onClose={() => setRequestPeer(null)}
        onSuccess={loadDashboardData}
      />
    </div>
  );
};

// ============================================================================
// 2. DISCOVER PEERS PAGE (/discover) - LIQUID GLASS COMMUNITY DISCOVERY
// ============================================================================
export const DiscoverPeersPage: React.FC = () => {
  const { apiFetch, categories, catalogSkills } = useAuth();
  const [peers, setPeers] = useState<PeerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter states
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [skillId, setSkillId] = useState<string>('');
  const [level, setLevel] = useState<string>('');
  const [availability, setAvailability] = useState<string>('');
  const [mutualOnly, setMutualOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'match' | 'rating' | 'sessions'>('match');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const [selectedPeer, setSelectedPeer] = useState<PeerProfile | null>(null);
  const [requestPeer, setRequestPeer] = useState<PeerProfile | null>(null);

  const fetchPeers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (categoryId) params.set('categoryId', categoryId);
      if (skillId) params.set('skillId', skillId);
      if (level) params.set('level', level);
      if (availability) params.set('availability', availability);

      const data = await apiFetch<{ peers: PeerProfile[] }>(
        `/api/discover?${params.toString()}`
      );
      setPeers(data.peers || []);
      setPage(1);
    } catch (err: any) {
      setError(err.message || 'Failed to search peers.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, search, categoryId, skillId, level, availability]);

  useEffect(() => {
    fetchPeers();
  }, [fetchPeers]);

  const displayedPeers = React.useMemo(() => {
    let list = [...peers];
    if (mutualOnly) {
      list = list.filter((p) => p.match?.isMutualExchange);
    }
    if (sortBy === 'rating') {
      list.sort((a, b) => b.averageRating - a.averageRating || b.match.score - a.match.score);
    } else if (sortBy === 'sessions') {
      list.sort(
        (a, b) =>
          b.completedSessionsCount - a.completedSessionsCount || b.match.score - a.match.score
      );
    } else {
      list.sort((a, b) => b.match.score - a.match.score || b.averageRating - a.averageRating);
    }
    return list;
  }, [peers, mutualOnly, sortBy]);

  const totalPages = Math.ceil(displayedPeers.length / pageSize);
  const paginatedPeers = displayedPeers.slice((page - 1) * pageSize, page * pageSize);

  const featuredAcademicSkills = catalogSkills.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Discover Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-300">
            Academic Skill Directory &amp; Peer Matching
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1 tracking-tight">
            Discover Your Learning Community
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Find people who can teach what you want to learn — and learn from what you already know.
          </p>
        </div>
        <div className="text-xs font-mono text-white/70 glass-level-1 px-4 py-2.5 rounded-2xl shrink-0">
          Showing <strong className="text-cyan-300">{displayedPeers.length}</strong> matching{' '}
          {displayedPeers.length === 1 ? 'student' : 'students'}
        </div>
      </div>

      {/* Main Liquid Glass Search & Filter Panel */}
      <GlassCard level={2} className="p-5 sm:p-6 space-y-5">
        {/* Large Glass Search Input + Sort + Reset */}
        <div className="flex flex-col md:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by academic skill (e.g. Python, SQL, React, UI/UX), student name, or college..."
          />

          <div className="flex items-center gap-2.5 shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="glass-input px-3.5 py-3 rounded-2xl text-xs font-semibold"
              title="Sort results"
            >
              <option value="match">Sort: Highest Compatibility</option>
              <option value="rating">Sort: Highest Rating</option>
              <option value="sessions">Sort: Most Sessions</option>
            </select>

            <GlassButton
              type="button"
              variant="secondary"
              onClick={() => {
                setSearch('');
                setCategoryId('');
                setSkillId('');
                setLevel('');
                setAvailability('');
                setMutualOnly(false);
                setSortBy('match');
              }}
              className="py-3"
            >
              Reset
            </GlassButton>
          </div>
        </div>

        {/* Quick-Select Academic Skill Filter Controls */}
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-white/45 block mb-2">
            Quick Filter by Popular Skills Offered
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSkillId('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                skillId === ''
                  ? 'btn-liquid-primary'
                  : 'bg-white/[0.04] text-white/70 border-white/10 hover:bg-white/[0.09] hover:text-white'
              }`}
            >
              All Skills
            </button>
            {featuredAcademicSkills.map((sk) => {
              const active = skillId === String(sk.id);
              return (
                <button
                  key={sk.id}
                  type="button"
                  onClick={() => setSkillId(active ? '' : String(sk.id))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    active
                      ? 'btn-liquid-primary'
                      : 'bg-white/[0.04] text-white/70 border-white/10 hover:bg-white/[0.09] hover:text-white'
                  }`}
                >
                  {sk.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5 Compact Glass Filter Controls: Category, Skills, Proficiency, Availability, Compatibility */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-white/10">
          <div>
            <label className="block text-[11px] font-mono uppercase text-white/45 mb-1.5">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setSkillId('');
              }}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-white/45 mb-1.5">
              Skills
            </label>
            <select
              value={skillId}
              onChange={(e) => setSkillId(e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs"
            >
              <option value="">All Skills ({catalogSkills.length})</option>
              {catalogSkills
                .filter((s) => !categoryId || s.categoryId === Number(categoryId))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.categoryName})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-white/45 mb-1.5">
              Proficiency
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs"
            >
              <option value="">Any Level</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-white/45 mb-1.5">
              Availability
            </label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs"
            >
              <option value="">Any Availability</option>
              <option value="Weekdays">Weekdays</option>
              <option value="Weekends">Weekends</option>
              <option value="Evenings">Evenings</option>
              <option value="Flexible">Flexible</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-white/45 mb-1.5">
              Compatibility
            </label>
            <label className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-white/12 bg-white/[0.04] cursor-pointer hover:bg-white/[0.08] transition-colors">
              <input
                type="checkbox"
                checked={mutualOnly}
                onChange={(e) => setMutualOnly(e.target.checked)}
                className="rounded accent-indigo-500"
              />
              <span className="text-xs font-medium text-white/85">Mutual Exchange Only</span>
            </label>
          </div>
        </div>
      </GlassCard>

      {error && <ErrorState message={error} onRetry={fetchPeers} />}

      {loading ? (
        <LoadingSkeleton count={6} height="h-72" />
      ) : paginatedPeers.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedPeers.map((peer) => (
              <PeerCard
                key={peer.id}
                peer={peer}
                onViewProfile={(p) => setSelectedPeer(p)}
                onSendRequest={(p) => setRequestPeer(p)}
              />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState
          title="No matching peers found for these skill filters."
          description="Try clearing some search filters or selecting a broader skill category."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setCategoryId('');
            setSkillId('');
            setLevel('');
            setAvailability('');
            setMutualOnly(false);
          }}
        />
      )}

      <PeerProfileModal
        peer={selectedPeer}
        onClose={() => setSelectedPeer(null)}
        onSendRequest={(p) => setRequestPeer(p)}
        onBlockedOrReported={fetchPeers}
      />

      <SendRequestModal
        peer={requestPeer}
        onClose={() => setRequestPeer(null)}
        onSuccess={fetchPeers}
      />
    </div>
  );
};

// ============================================================================
// 3. MY SKILLS PAGE (/my-skills) - LIQUID GLASS SKILLS PORTFOLIO
// ============================================================================
export const MySkillsPage: React.FC = () => {
  const { profile, catalogSkills, categories, apiFetch, refreshProfile, showToast } = useAuth();

  const [teachSkillId, setTeachSkillId] = useState<string>('');
  const [teachLevel, setTeachLevel] = useState<string>('Intermediate');
  const [learnSkillId, setLearnSkillId] = useState<string>('');
  const [learnLevel, setLearnLevel] = useState<string>('Beginner');
  const [filterCat, setFilterCat] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<{ type: 'teach' | 'learn'; id: number } | null>(null);
  const [editLevelVal, setEditLevelVal] = useState<string>('Intermediate');

  const filteredCatalog = catalogSkills.filter(
    (s) => !filterCat || s.categoryId === Number(filterCat)
  );

  const handleAddTeach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teachSkillId) {
      showToast('Please select a skill to teach.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/api/my-skills/teach', {
        method: 'POST',
        body: JSON.stringify({ skillId: Number(teachSkillId), level: teachLevel }),
      });
      showToast('Skill added to your teaching list!', 'success');
      setTeachSkillId('');
      await refreshProfile();
    } catch (err: any) {
      showToast(err.message || 'Failed to add teaching skill.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddLearn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnSkillId) {
      showToast('Please select a skill to learn.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/api/my-skills/learn', {
        method: 'POST',
        body: JSON.stringify({ skillId: Number(learnSkillId), level: learnLevel }),
      });
      showToast('Skill added to your learning list!', 'success');
      setLearnSkillId('');
      await refreshProfile();
    } catch (err: any) {
      showToast(err.message || 'Failed to add learning skill.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateLevel = async (type: 'teach' | 'learn', id: number) => {
    try {
      await apiFetch(`/api/my-skills/${type}/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ level: editLevelVal }),
      });
      showToast('Skill level updated.', 'success');
      setEditingId(null);
      await refreshProfile();
    } catch (err: any) {
      showToast(err.message || 'Failed to update skill level.', 'error');
    } finally {
      setEditingId(null);
    }
  };

  const handleDeleteSkill = async (type: 'teach' | 'learn', id: number) => {
    try {
      await apiFetch(`/api/my-skills/${type}/${id}`, { method: 'DELETE' });
      showToast('Skill removed.', 'info');
      await refreshProfile();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove skill.', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-violet-300">
            Exchange Credentials
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-0.5">
            My Skills Portfolio
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Manage the skills you can teach peers and the skills you want to learn in return.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="text-xs font-mono text-white/55">Filter Catalog:</label>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="glass-input px-3.5 py-2 rounded-xl text-xs"
          >
            <option value="">All Categories ({catalogSkills.length} skills)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: SKILLS I CAN TEACH */}
        <GlassCard level={2} className="p-6 space-y-6">
          <div className="border-b border-white/10 pb-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-violet-300">
                Mentor &amp; Share
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Skills I Can Teach
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-violet-500/20 border border-violet-400/30 text-violet-200 text-xs font-mono font-bold">
              {profile?.teachingSkills.length || 0} listed
            </span>
          </div>

          <form onSubmit={handleAddTeach} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <select
              value={teachSkillId}
              onChange={(e) => setTeachSkillId(e.target.value)}
              className="glass-input sm:col-span-6 px-3 py-2.5 rounded-xl text-xs"
            >
              <option value="">-- Select Skill to Teach --</option>
              {filteredCatalog.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.categoryName})
                </option>
              ))}
            </select>

            <select
              value={teachLevel}
              onChange={(e) => setTeachLevel(e.target.value)}
              className="glass-input sm:col-span-4 px-3 py-2.5 rounded-xl text-xs"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            <GlassButton
              type="submit"
              variant="primary"
              disabled={submitting}
              className="sm:col-span-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </GlassButton>
          </form>

          <div className="space-y-2.5">
            {profile?.teachingSkills && profile.teachingSkills.length > 0 ? (
              profile.teachingSkills.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl glass-level-1 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-bold text-white">{item.name}</p>
                    <p className="text-xs text-white/50">Category: {item.categoryName}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingId?.type === 'teach' && editingId.id === item.id ? (
                      <>
                        <select
                          value={editLevelVal}
                          onChange={(e) => setEditLevelVal(e.target.value)}
                          className="glass-input px-2.5 py-1 rounded-lg text-xs"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                        <GlassButton
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateLevel('teach', item.id)}
                        >
                          Save
                        </GlassButton>
                      </>
                    ) : (
                      <>
                        <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-200 border border-violet-400/30 text-xs font-mono font-medium">
                          {item.level}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId({ type: 'teach', id: item.id });
                            setEditLevelVal(item.level);
                          }}
                          className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                          title="Edit level"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSkill('teach', item.id)}
                          className="p-1.5 rounded-lg text-white/50 hover:text-rose-400 hover:bg-rose-500/15 transition-colors"
                          title="Delete skill"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-white/40 italic py-6 text-center">
                No teaching skills added yet. Add a skill above!
              </p>
            )}
          </div>
        </GlassCard>

        {/* SECTION 2: SKILLS I WANT TO LEARN */}
        <GlassCard level={2} className="p-6 space-y-6">
          <div className="border-b border-white/10 pb-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-300">
                Acquire &amp; Grow
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Skills I Want to Learn
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 text-xs font-mono font-bold">
              {profile?.learningSkills.length || 0} listed
            </span>
          </div>

          <form onSubmit={handleAddLearn} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <select
              value={learnSkillId}
              onChange={(e) => setLearnSkillId(e.target.value)}
              className="glass-input sm:col-span-6 px-3 py-2.5 rounded-xl text-xs"
            >
              <option value="">-- Select Skill to Learn --</option>
              {filteredCatalog.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.categoryName})
                </option>
              ))}
            </select>

            <select
              value={learnLevel}
              onChange={(e) => setLearnLevel(e.target.value)}
              className="glass-input sm:col-span-4 px-3 py-2.5 rounded-xl text-xs"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            <GlassButton
              type="submit"
              variant="primary"
              disabled={submitting}
              className="sm:col-span-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </GlassButton>
          </form>

          <div className="space-y-2.5">
            {profile?.learningSkills && profile.learningSkills.length > 0 ? (
              profile.learningSkills.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl glass-level-1 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-bold text-white">{item.name}</p>
                    <p className="text-xs text-white/50">Category: {item.categoryName}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingId?.type === 'learn' && editingId.id === item.id ? (
                      <>
                        <select
                          value={editLevelVal}
                          onChange={(e) => setEditLevelVal(e.target.value)}
                          className="glass-input px-2.5 py-1 rounded-lg text-xs"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                        <GlassButton
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateLevel('learn', item.id)}
                        >
                          Save
                        </GlassButton>
                      </>
                    ) : (
                      <>
                        <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 text-xs font-mono font-medium">
                          {item.level}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId({ type: 'learn', id: item.id });
                            setEditLevelVal(item.level);
                          }}
                          className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                          title="Edit level"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSkill('learn', item.id)}
                          className="p-1.5 rounded-lg text-white/50 hover:text-rose-400 hover:bg-rose-500/15 transition-colors"
                          title="Delete skill"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-white/40 italic py-6 text-center">
                No learning skills added yet. Add a skill above!
              </p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
