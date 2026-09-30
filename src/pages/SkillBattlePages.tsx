import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  Swords,
  Trophy,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  History,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Users,
  AlertTriangle,
  RefreshCw,
  Award,
  Target,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Avatar,
  GlassCard,
  GlassButton,
  GlassStatCard,
  GlassProgress,
  LoadingSkeleton,
  EmptyState,
  ErrorState,
} from '../components/ui/CommonUI.tsx';

export interface UserBattleStats {
  userId: string;
  battleRating: number;
  battlesPlayed: number;
  battlesWon: number;
  battlesLost: number;
  draws: number;
  winRate: number;
  averageScore: number;
  averageAnswerTimeSec: number;
  accuracy: number;
  totalPoints: number;
  favoriteTechnology: string;
  bestTechnology: string;
}

// ============================================================================
// REUSABLE BATTLE STATISTICS SECTION (FOR PROFILE / DASHBOARD / STATS PAGE)
// ============================================================================
export const BattleStatsSection: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { apiFetch } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserBattleStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiFetch<{ stats: UserBattleStats }>('/api/battle/stats')
      .then((res) => {
        if (mounted && res?.stats) setStats(res.stats);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [apiFetch]);

  if (loading) {
    return <LoadingSkeleton count={1} height="h-36" />;
  }

  if (!stats) return null;

  return (
    <GlassCard level={2} className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/25 via-indigo-500/20 to-cyan-500/25 border border-white/15 flex items-center justify-center text-cyan-300">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-300 uppercase tracking-wider">
              <span>1 vs 1 Skill Battle</span>
              <span>·</span>
              <span>Rating {stats.battleRating}</span>
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              Battle Statistics &amp; Competitive Standing
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <GlassButton variant="secondary" size="sm" onClick={() => navigate('/battle/history')}>
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </GlassButton>
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={() => navigate('/battle/leaderboard')}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>Leaderboard</span>
          </GlassButton>
          <GlassButton variant="primary" size="sm" onClick={() => navigate('/battle')}>
            <Swords className="w-3.5 h-3.5" />
            <span>Enter Skill Battle</span>
          </GlassButton>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-white/[0.035] border border-white/10">
          <span className="text-[11px] text-white/50 block">Battle Rating</span>
          <span className="text-xl font-extrabold font-mono text-cyan-300 mt-0.5 block">
            {stats.battleRating}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/[0.035] border border-white/10">
          <span className="text-[11px] text-white/50 block">Battles Played</span>
          <span className="text-xl font-extrabold font-mono text-white mt-0.5 block">
            {stats.battlesPlayed}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/[0.035] border border-white/10">
          <span className="text-[11px] text-white/50 block">W / L / D</span>
          <span className="text-base font-extrabold font-mono text-emerald-300 mt-1 block">
            {stats.battlesWon}W · {stats.battlesLost}L · {stats.draws}D
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/[0.035] border border-white/10">
          <span className="text-[11px] text-white/50 block">Win Rate</span>
          <span className="text-xl font-extrabold font-mono text-indigo-300 mt-0.5 block">
            {stats.winRate}%
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/[0.035] border border-white/10 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-white/50 block">Avg Score / Time</span>
          <span className="text-base font-extrabold font-mono text-purple-300 mt-1 block">
            {stats.averageScore} pts · {stats.averageAnswerTimeSec}s
          </span>
        </div>
      </div>

      {!compact && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/8 flex items-center justify-between">
            <span className="text-white/55">Favorite Technology</span>
            <span className="font-mono font-bold text-white">{stats.favoriteTechnology}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/8 flex items-center justify-between">
            <span className="text-white/55">Best Technology</span>
            <span className="font-mono font-bold text-cyan-300">{stats.bestTechnology}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/8 flex items-center justify-between">
            <span className="text-white/55">Average Answer Time</span>
            <span className="font-mono font-bold text-emerald-300">
              {stats.averageAnswerTimeSec} sec
            </span>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

// ============================================================================
// 1. SKILL BATTLE LANDING / LOBBY PAGE (/battle)
// ============================================================================
export const SkillBattleLobbyPage: React.FC = () => {
  const { apiFetch, showToast } = useAuth();
  const navigate = useNavigate();

  const [technologies, setTechnologies] = useState<{ name: string; subtopics: string[] }[]>([
    { name: 'Python', subtopics: ['Variables', 'Functions', 'Lists', 'Dictionaries', 'OOP'] },
    { name: 'JavaScript', subtopics: ['ES6', 'Promises', 'Async/Await', 'Arrays', 'DOM'] },
    { name: 'React', subtopics: ['Components', 'Props', 'useState', 'useEffect', 'Hooks'] },
    { name: 'Flutter', subtopics: ['Widgets', 'StatefulWidget', 'setState', 'Layouts', 'Dart'] },
    { name: 'HTML/CSS', subtopics: ['Semantic HTML', 'Flexbox', 'CSS Grid', 'Responsive'] },
    { name: 'SQL', subtopics: ['SELECT', 'JOIN', 'GROUP BY', 'Aggregate Functions', 'Keys'] },
    { name: 'MongoDB', subtopics: ['Documents', 'CRUD', 'Aggregation', 'Indexing'] },
    { name: 'Java', subtopics: ['OOP', 'Collections', 'Interfaces', 'Exceptions'] },
    { name: 'C++', subtopics: ['Pointers', 'STL', 'Classes', 'Memory Management'] },
  ]);
  const [stats, setStats] = useState<UserBattleStats | null>(null);
  const [selectedSkill, setSelectedSkill] = useState('Python');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Adaptive'>('Medium');
  const [questionCount, setQuestionCount] = useState<5 | 10>(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiFetch<{
      technologies: { name: string; subtopics: string[] }[];
      stats: UserBattleStats;
    }>('/api/battle/lobby')
      .then((data) => {
        if (!mounted) return;
        if (data.technologies?.length) {
          setTechnologies(data.technologies);
        }
        if (data.stats) {
          setStats(data.stats);
        }
      })
      .catch((err) => {
        showToast(err.message || 'Could not load battle lobby details.', 'error');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [apiFetch, showToast]);

  const selectedTechObj = technologies.find((t) => t.name === selectedSkill) || technologies[0];
  const estimatedDuration = questionCount === 5 ? '~2.5 Minutes' : '~5 Minutes';

  const handleFindOpponent = () => {
    const params = new URLSearchParams({
      skill: selectedSkill,
      difficulty,
      questions: String(questionCount),
    });
    navigate(`/battle/matchmaking?${params.toString()}`);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <GlassCard level={2} className="p-6 sm:p-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-300">
              <Swords className="w-4 h-4 text-purple-400" />
              <span>Real-Time Competitive Arena · Server-Authoritative 1v1</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              1 vs 1 Skill Battle
            </h1>
            <p className="text-sm sm:text-base text-white/70">
              Challenge another learner. Solve faster. Score higher.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <GlassButton
              variant="secondary"
              size="md"
              onClick={() => navigate('/battle/history')}
            >
              <History className="w-4 h-4 text-indigo-300" />
              <span>Battle History</span>
            </GlassButton>
            <GlassButton
              variant="secondary"
              size="md"
              onClick={() => navigate('/battle/leaderboard')}
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Leaderboard</span>
            </GlassButton>
            <GlassButton
              variant="secondary"
              size="md"
              onClick={() => navigate('/battle/stats')}
            >
              <BarChart3 className="w-4 h-4 text-cyan-300" />
              <span>My Battle Stats</span>
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Player Quick Standing Row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassStatCard
            label="Current Battle Rating"
            value={stats.battleRating}
            subtext={`Best in ${stats.bestTechnology}`}
            icon={Award}
            accent="cyan"
          />
          <GlassStatCard
            label="Battles Played"
            value={stats.battlesPlayed}
            subtext={`${stats.battlesWon} Won · ${stats.battlesLost} Lost · ${stats.draws} Draw`}
            icon={Swords}
            accent="purple"
          />
          <GlassStatCard
            label="Win Rate"
            value={`${stats.winRate}%`}
            subtext={`Accuracy ${stats.accuracy}%`}
            icon={Trophy}
            accent="emerald"
          />
          <GlassStatCard
            label="Avg Answer Speed"
            value={`${stats.averageAnswerTimeSec}s`}
            subtext={`Avg Score: ${stats.averageScore} pts`}
            icon={Zap}
            accent="amber"
          />
        </div>
      )}

      {/* Battle Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Choose Technology & Subtopics */}
        <GlassCard level={2} className="lg:col-span-8 p-6 sm:p-7 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-300">
                Step 1 · Select Battle Domain
              </span>
              <h2 className="text-lg font-extrabold text-white mt-0.5">Choose Technology</h2>
            </div>
            <span className="text-xs font-mono text-white/55">
              {technologies.length} Available Skills
            </span>
          </div>

          {loading ? (
            <LoadingSkeleton count={3} height="h-14" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {technologies.map((tech) => {
                const isSelected = tech.name === selectedSkill;
                return (
                  <button
                    key={tech.name}
                    type="button"
                    onClick={() => setSelectedSkill(tech.name)}
                    className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-gradient-to-br from-purple-600/35 via-indigo-600/30 to-cyan-500/25 border-cyan-400/50 text-white shadow-[0_8px_28px_rgba(79,70,229,0.3)]'
                        : 'bg-white/[0.035] border-white/10 text-white/75 hover:text-white hover:bg-white/[0.07] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-bold tracking-tight">{tech.name}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-white/45 truncate">
                      {tech.subtopics.slice(0, 3).join(' · ')}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected Skill Subtopics Breakdown */}
          {selectedTechObj && (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono uppercase tracking-wider text-cyan-300">
                  AI Question Subtopics for {selectedTechObj.name}
                </span>
                <span className="text-white/50 font-mono">Validated Structured Output</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                {selectedTechObj.subtopics.join(' · ')}
              </p>
            </div>
          )}
        </GlassCard>

        {/* Right 4 Cols: Difficulty, Question Count, Summary & Find Opponent CTA */}
        <GlassCard level={2} className="lg:col-span-4 p-6 sm:p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-purple-300">
                Step 2 · Match Parameters
              </span>
              <h2 className="text-lg font-extrabold text-white mt-0.5">Battle Configuration</h2>
            </div>

            {/* Difficulty Selection */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-white/80">Difficulty</label>
              <div className="grid grid-cols-2 gap-2.5">
                {(['Easy', 'Medium', 'Hard', 'Adaptive'] as const).map((diff) => {
                  const active = difficulty === diff;
                  return (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        active
                          ? 'bg-gradient-to-r from-indigo-600/45 to-purple-600/45 border-indigo-400/50 text-white shadow-sm'
                          : 'bg-white/[0.04] border-white/10 text-white/65 hover:text-white hover:bg-white/[0.08]'
                      }`}
                    >
                      {diff === 'Adaptive' && <Sparkles className="w-3.5 h-3.5 text-cyan-300" />}
                      <span>{diff}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed">
                {difficulty === 'Adaptive'
                  ? 'Adaptive mode progressively scales question complexity while guaranteeing both players receive the exact same balanced question set.'
                  : `All questions will be generated and validated for ${selectedSkill} at ${difficulty} difficulty.`}
              </p>
            </div>

            {/* Number of Questions */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-white/80">
                Number of Questions
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {([5, 10] as const).map((cnt) => {
                  const active = questionCount === cnt;
                  return (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold border transition-all ${
                        active
                          ? 'bg-gradient-to-r from-cyan-500/35 to-blue-600/35 border-cyan-400/50 text-white'
                          : 'bg-white/[0.04] border-white/10 text-white/65 hover:text-white hover:bg-white/[0.08]'
                      }`}
                    >
                      {cnt} Questions
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Battle Summary Specs */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-white/55">Battle Type</span>
                <span className="font-mono font-bold text-white">1 vs 1 Real-Time</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/55">Selected Skill</span>
                <span className="font-mono font-bold text-cyan-300">{selectedSkill}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/55">Difficulty</span>
                <span className="font-mono font-bold text-indigo-300">{difficulty}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/55">Questions &amp; Timer</span>
                <span className="font-mono font-bold text-white">
                  {questionCount} Qs · 30s each
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/55">Estimated Duration</span>
                <span className="font-mono text-white/80">{estimatedDuration}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/55">Scoring System</span>
                <span className="font-mono text-emerald-300">100 Base + 50 Speed Bonus</span>
              </div>
            </div>
          </div>

          <GlassButton
            variant="primary"
            size="lg"
            onClick={handleFindOpponent}
            className="w-full py-3.5 text-sm"
          >
            <Swords className="w-4 h-4" />
            <span>Find Opponent</span>
          </GlassButton>
        </GlassCard>
      </div>
    </div>
  );
};

// ============================================================================
// 2. MATCHMAKING PAGE (/battle/matchmaking)
// ============================================================================
export const SkillBattleMatchmakingPage: React.FC = () => {
  const { profile, token, apiFetch, showToast } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const skill = searchParams.get('skill') || 'Python';
  const difficulty = searchParams.get('difficulty') || 'Medium';
  const questionCount = Number(searchParams.get('questions')) === 10 ? 10 : 5;

  const [elapsedSec, setElapsedSec] = useState(0);
  const [noOpponentYet, setNoOpponentYet] = useState(false);
  const [matchingPeer, setMatchingPeer] = useState(false);
  const [battleRating, setBattleRating] = useState(1200);
  const matchedRef = useRef(false);

  const handleBattleMatched = useCallback(
    (battleId: string) => {
      if (matchedRef.current) return;
      matchedRef.current = true;
      navigate(`/battle/room/${battleId}`, { replace: true });
    },
    [navigate]
  );

  // Join matchmaking queue on mount + listen via Socket.IO and polling fallback
  useEffect(() => {
    let active = true;
    let socket: Socket | null = null;

    const startQueue = async () => {
      try {
        const res = await apiFetch<{
          status: string;
          battleId: string | null;
          queue?: { battleRating: number };
        }>('/api/battle/matchmaking/join', {
          method: 'POST',
          body: JSON.stringify({ skill, difficulty, questionCount }),
        });

        if (!active) return;
        if (res.queue?.battleRating) {
          setBattleRating(res.queue.battleRating);
        }
        if (res.status === 'MATCHED' && res.battleId) {
          handleBattleMatched(res.battleId);
          return;
        }
      } catch (err: any) {
        if (active) {
          showToast(err.message || 'Failed to enter matchmaking queue.', 'error');
        }
      }
    };

    startQueue();

    if (token) {
      socket = io({
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      socket.on('battle:matched', (payload: { battleId: string }) => {
        if (payload?.battleId) {
          handleBattleMatched(payload.battleId);
        }
      });
    }

    const pollInterval = setInterval(async () => {
      if (!active || matchedRef.current) return;
      try {
        const statusRes = await apiFetch<{ status: string; battleId: string | null }>(
          '/api/battle/matchmaking/status'
        );
        if (statusRes.status === 'MATCHED' && statusRes.battleId) {
          handleBattleMatched(statusRes.battleId);
        }
      } catch {
        // ignore transient poll error
      }
    }, 1500);

    const timerInterval = setInterval(() => {
      setElapsedSec((prev) => {
        const next = prev + 1;
        if (next >= 12) {
          setNoOpponentYet(true);
        }
        return next;
      });
    }, 1000);

    return () => {
      active = false;
      clearInterval(pollInterval);
      clearInterval(timerInterval);
      if (socket) socket.disconnect();
    };
  }, [apiFetch, difficulty, handleBattleMatched, questionCount, showToast, skill, token]);

  const handleCancelSearch = async () => {
    try {
      await apiFetch('/api/battle/matchmaking/cancel', { method: 'POST' });
    } catch {
      // ignore
    }
    navigate('/battle');
  };

  const handleKeepSearching = async () => {
    setNoOpponentYet(false);
    setElapsedSec(0);
    try {
      const res = await apiFetch<{ status: string; battleId: string | null }>(
        '/api/battle/matchmaking/join',
        {
          method: 'POST',
          body: JSON.stringify({ skill, difficulty, questionCount }),
        }
      );
      if (res.status === 'MATCHED' && res.battleId) {
        handleBattleMatched(res.battleId);
      }
    } catch {
      // ignore
    }
  };

  const handleChallengeCampusPeer = async () => {
    setMatchingPeer(true);
    try {
      const res = await apiFetch<{ status: string; battleId: string }>(
        '/api/battle/matchmaking/campus-peer',
        {
          method: 'POST',
          body: JSON.stringify({ skill, difficulty, questionCount }),
        }
      );
      if (res.battleId) {
        handleBattleMatched(res.battleId);
      }
    } catch (err: any) {
      showToast(err.message || 'Could not match with campus challenger.', 'error');
      setMatchingPeer(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <GlassCard level={3} className="p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/35 via-indigo-600/30 to-cyan-500/35 border border-white/20 flex items-center justify-center mx-auto shadow-[0_0_32px_rgba(99,102,241,0.35)]">
          <Swords className="w-8 h-8 text-cyan-300 animate-pulse" />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-300">
            1 vs 1 Live Matchmaking Queue · {elapsedSec}s
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {noOpponentYet ? 'No opponent found yet.' : 'Finding an opponent...'}
          </h1>
          <p className="text-xs sm:text-sm text-white/65 max-w-md mx-auto">
            {noOpponentYet
              ? 'No other live student is currently queuing for this exact skill. You can keep searching for a live peer or start an immediate battle against an active Campus Challenger.'
              : 'Matching you with a compatible student based on selected skill, difficulty, and battle rating.'}
          </p>
        </div>

        {/* Selected Battle Summary */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
            <span className="text-white/45 block">Selected Skill</span>
            <span className="text-sm font-extrabold font-mono text-cyan-300 mt-0.5 block">
              {skill}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
            <span className="text-white/45 block">Difficulty</span>
            <span className="text-sm font-extrabold font-mono text-indigo-300 mt-0.5 block">
              {difficulty}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
            <span className="text-white/45 block">Questions</span>
            <span className="text-sm font-extrabold font-mono text-white mt-0.5 block">
              {questionCount} Questions
            </span>
          </div>
        </div>

        {/* Player Profile Card */}
        {profile && (
          <div className="p-4 rounded-2xl bg-white/[0.035] border border-white/12 flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <Avatar name={profile.fullName} src={profile.avatarUrl} size="md" />
              <div>
                <p className="text-sm font-bold text-white">{profile.fullName}</p>
                <p className="text-xs text-white/55">
                  {profile.college || 'University Student'} · Battle Rating: {battleRating}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-emerald-300">Ready to Match</span>
          </div>
        )}

        {/* Action Buttons */}
        {!noOpponentYet ? (
          <div className="pt-2">
            <GlassButton variant="danger" onClick={handleCancelSearch}>
              Cancel Search
            </GlassButton>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <GlassButton variant="secondary" onClick={handleKeepSearching}>
              <RefreshCw className="w-4 h-4" />
              <span>Keep Searching</span>
            </GlassButton>
            <GlassButton
              variant="primary"
              disabled={matchingPeer}
              onClick={handleChallengeCampusPeer}
            >
              <Swords className="w-4 h-4" />
              <span>
                {matchingPeer ? 'Preparing Battle Room...' : 'Battle Campus Challenger Now'}
              </span>
            </GlassButton>
            <GlassButton variant="danger" onClick={handleCancelSearch}>
              Cancel
            </GlassButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

// ============================================================================
// 3. PRIVATE 1 VS 1 BATTLE ROOM PAGE (/battle/room/:battleId)
// ============================================================================
export const SkillBattleRoomPage: React.FC = () => {
  const { battleId } = useParams<{ battleId: string }>();
  const { profile, token, apiFetch, showToast } = useAuth();
  const navigate = useNavigate();

  const [battleState, setBattleState] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [readying, setReadying] = useState(false);
  const [remainingSec, setRemainingSec] = useState<number>(30);
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [opponentDisconnectedMsg, setOpponentDisconnectedMsg] = useState<string>('');

  const serverClockOffsetRef = useRef<number>(0);
  const lastQuestionNumberRef = useRef<number>(0);

  const applyServerState = useCallback((state: any) => {
    if (!state) return;
    if (state.serverNow) {
      const srvMs = new Date(state.serverNow).getTime();
      serverClockOffsetRef.current = srvMs - Date.now();
    }

    if (state.currentQuestionNumber !== lastQuestionNumberRef.current) {
      lastQuestionNumberRef.current = state.currentQuestionNumber;
      setSelectedOption('');
      setSubmitting(false);
    }

    setBattleState(state);
    setLoading(false);
  }, []);

  // Connect Socket.IO room + fallback state sync
  useEffect(() => {
    if (!battleId) return;
    let active = true;
    let socket: Socket | null = null;

    const fetchInitial = async () => {
      try {
        const data = await apiFetch<any>(`/api/battle/room/${battleId}`);
        if (active) applyServerState(data);
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Could not load battle room.');
          setLoading(false);
        }
      }
    };

    fetchInitial();

    if (token) {
      socket = io({
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        socket?.emit('battle:join_room', { battleId });
      });

      socket.on('battle:state', (st) => {
        if (active) applyServerState(st);
      });

      socket.on('battle:ready', (st) => {
        if (active) applyServerState(st);
      });

      socket.on('battle:started', (st) => {
        if (active) applyServerState(st);
      });

      socket.on('question:started', (st) => {
        if (active) applyServerState(st);
      });

      socket.on('answer:submitted', (st) => {
        if (active) applyServerState(st);
      });

      socket.on('question:expired', (st) => {
        if (active) applyServerState(st);
      });

      socket.on('question:completed', (st) => {
        if (active) applyServerState(st);
      });

      socket.on('next_question', (st) => {
        if (active) applyServerState(st);
      });

      socket.on('battle:completed', (st) => {
        if (active) applyServerState(st);
      });

      socket.on('player:disconnected', (payload: { userId: string; message?: string }) => {
        if (active && payload.userId !== profile?.id) {
          setOpponentDisconnectedMsg(
            payload.message || 'Opponent disconnected. Waiting for reconnection...'
          );
        }
      });

      socket.on('player:reconnected', (payload: { userId: string }) => {
        if (active && payload.userId !== profile?.id) {
          setOpponentDisconnectedMsg('');
        }
      });
    }

    // Periodic server state reconciliation every 1.2s
    const syncTimer = setInterval(async () => {
      if (!active) return;
      try {
        const data = await apiFetch<any>(`/api/battle/room/${battleId}`);
        if (active) applyServerState(data);
      } catch {
        // ignore transient error
      }
    }, 1200);

    return () => {
      active = false;
      clearInterval(syncTimer);
      if (socket) socket.disconnect();
    };
  }, [apiFetch, applyServerState, battleId, profile?.id, token]);

  // Synchronized visual countdown & 30-second question timer driven by server timestamps
  useEffect(() => {
    if (!battleState) return;

    if (battleState.status === 'COMPLETED') {
      navigate(`/battle/result/${battleState.battleId}`, { replace: true });
      return;
    }

    const interval = setInterval(() => {
      const syncedNow = Date.now() + serverClockOffsetRef.current;

      if (battleState.status === 'COUNTDOWN' && battleState.countdownEndsAt) {
        const endMs = new Date(battleState.countdownEndsAt).getTime();
        const diffSec = Math.ceil((endMs - syncedNow) / 1000);
        setCountdownNum(Math.max(0, Math.min(3, diffSec)));
      }

      if (battleState.status === 'QUESTION_ACTIVE' && battleState.questionEndsAt) {
        const endMs = new Date(battleState.questionEndsAt).getTime();
        const leftSec = Math.max(0, Math.ceil((endMs - syncedNow) / 1000));
        setRemainingSec(Math.min(30, leftSec));
      }
    }, 150);

    return () => clearInterval(interval);
  }, [battleState, navigate]);

  const handleMarkReady = async () => {
    if (!battleId || readying) return;
    setReadying(true);
    try {
      const updated = await apiFetch<any>(`/api/battle/room/${battleId}/ready`, {
        method: 'POST',
      });
      applyServerState(updated);
    } catch (err: any) {
      showToast(err.message || 'Failed to mark ready.', 'error');
    } finally {
      setReadying(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!battleId || !selectedOption || submitting || !battleState?.activeQuestion) return;
    setSubmitting(true);
    try {
      const updated = await apiFetch<any>(`/api/battle/room/${battleId}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          questionNumber: battleState.currentQuestionNumber,
          selectedAnswer: selectedOption,
        }),
      });
      applyServerState(updated);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit answer.', 'error');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={3} height="h-36" />;
  }

  if (error || !battleState) {
    return (
      <ErrorState
        message={error || 'Battle room could not be found.'}
        onRetry={() => navigate('/battle')}
      />
    );
  }

  const mePlayer =
    battleState.players?.find((p: any) => p.userId === profile?.id) ||
    battleState.players?.[0];
  const oppPlayer =
    battleState.players?.find((p: any) => p.userId !== profile?.id) ||
    battleState.players?.[1];

  const activeQ = battleState.activeQuestion;
  const mySub = battleState.myCurrentSubmission;
  const isQuestionLockedForMe =
    Boolean(mySub) ||
    battleState.status === 'QUESTION_COMPLETED' ||
    battleState.status === 'NEXT_QUESTION' ||
    battleState.status === 'FINALIZING' ||
    remainingSec <= 0;

  const formattedTimer = `00:${String(remainingSec).padStart(2, '0')}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Battle Header Bar */}
      <GlassCard level={2} className="p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold text-cyan-300">{battleState.battleId}</span>
          <span className="text-white/30">·</span>
          <span className="text-xs font-bold text-white">{battleState.skill}</span>
          <span className="text-white/30">·</span>
          <span className="text-xs text-indigo-300 font-mono">{battleState.difficulty}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-white/65">
            Question {battleState.currentQuestionNumber} / {battleState.questionCount}
          </span>
          {battleState.status === 'QUESTION_ACTIVE' && (
            <div
              className={`px-3.5 py-1.5 rounded-xl font-mono text-sm font-extrabold border flex items-center gap-1.5 ${
                remainingSec <= 8
                  ? 'bg-rose-500/20 border-rose-400/40 text-rose-300 animate-pulse'
                  : 'bg-indigo-500/20 border-indigo-400/35 text-cyan-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Time: {formattedTimer}</span>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Disconnect Notification Banner */}
      {(opponentDisconnectedMsg || oppPlayer?.status === 'DISCONNECTED') && (
        <GlassCard
          level={2}
          className="p-4 border-amber-400/35 bg-amber-500/10 flex items-center justify-between gap-3 text-xs text-amber-200"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              {opponentDisconnectedMsg || 'Opponent disconnected. Waiting for reconnection...'}
            </span>
          </div>
          <span className="font-mono text-[11px]">Grace Period Active</span>
        </GlassCard>
      )}

      {/* Player A vs Player B Scoreboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
        {/* Player A (Current User) */}
        <GlassCard level={2} className="md:col-span-5 p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={mePlayer?.fullName || 'You'} src={mePlayer?.avatarUrl} size="md" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-white truncate">
                    {mePlayer?.fullName} (You)
                  </h3>
                </div>
                <p className="text-[11px] text-white/55 font-mono">
                  {mePlayer?.skillLevel || 'Intermediate'} · Rating {mePlayer?.battleRating || 1200}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono uppercase text-white/45 block">Score</span>
              <span className="text-2xl font-extrabold font-mono text-cyan-300">
                {mePlayer?.score || 0}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/10">
            <span className="text-white/55">
              Correct: <strong className="text-white">{mePlayer?.correctAnswers || 0}</strong>
            </span>
            {battleState.status === 'QUESTION_ACTIVE' ? (
              <span
                className={
                  mePlayer?.hasSubmittedCurrentQuestion
                    ? 'text-emerald-300 font-mono font-bold'
                    : 'text-amber-300 font-mono'
                }
              >
                {mePlayer?.hasSubmittedCurrentQuestion ? '✓ Answer Locked' : 'Answering...'}
              </span>
            ) : (
              <span className="text-emerald-300 font-mono font-bold">
                {mePlayer?.isReady ? '✓ Ready' : 'Waiting...'}
              </span>
            )}
          </div>
        </GlassCard>

        {/* VS Divider */}
        <div className="md:col-span-1 flex items-center justify-center">
          <div className="w-11 h-11 rounded-2xl glass-level-2 flex items-center justify-center font-mono text-xs font-extrabold text-purple-300 border border-purple-400/30">
            VS
          </div>
        </div>

        {/* Player B (Opponent) */}
        <GlassCard level={2} className="md:col-span-5 p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                name={oppPlayer?.fullName || 'Opponent'}
                src={oppPlayer?.avatarUrl}
                size="md"
              />
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-white truncate">
                  {oppPlayer?.fullName || 'Opponent'}
                </h3>
                <p className="text-[11px] text-white/55 font-mono">
                  {oppPlayer?.skillLevel || 'Intermediate'} · Rating{' '}
                  {oppPlayer?.battleRating || 1200}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono uppercase text-white/45 block">Score</span>
              <span className="text-2xl font-extrabold font-mono text-purple-300">
                {oppPlayer?.score || 0}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/10">
            <span className="text-white/55">
              Correct: <strong className="text-white">{oppPlayer?.correctAnswers || 0}</strong>
            </span>
            {battleState.status === 'QUESTION_ACTIVE' ? (
              <span
                className={
                  oppPlayer?.hasSubmittedCurrentQuestion
                    ? 'text-emerald-300 font-mono font-bold'
                    : 'text-white/55 font-mono'
                }
              >
                {oppPlayer?.hasSubmittedCurrentQuestion ? '✓ Submitted' : 'Thinking...'}
              </span>
            ) : (
              <span className="text-emerald-300 font-mono font-bold">
                {oppPlayer?.isReady ? '✓ Ready' : 'Waiting...'}
              </span>
            )}
          </div>
        </GlassCard>
      </div>

      {/* PHASE 1: READY SYSTEM (MATCHED / READY) */}
      {(battleState.status === 'MATCHED' || battleState.status === 'READY') && (
        <GlassCard level={3} className="p-8 text-center space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-300">
              Match Confirmed · {battleState.battleId}
            </span>
            <h2 className="text-2xl font-extrabold text-white">Opponent found!</h2>
            <p className="text-xs sm:text-sm text-white/65 max-w-md mx-auto">
              Both players must confirm readiness to start the synchronized 3-second battle
              countdown.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <div className="w-full p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs">
              <span className="font-bold text-white">{mePlayer?.fullName}</span>
              <span
                className={
                  mePlayer?.isReady
                    ? 'font-mono font-bold text-emerald-300'
                    : 'font-mono text-amber-300'
                }
              >
                {mePlayer?.isReady ? '✓ Ready' : 'Not Ready'}
              </span>
            </div>
            <div className="w-full p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs">
              <span className="font-bold text-white">{oppPlayer?.fullName}</span>
              <span
                className={
                  oppPlayer?.isReady
                    ? 'font-mono font-bold text-emerald-300'
                    : 'font-mono text-amber-300'
                }
              >
                {oppPlayer?.isReady ? '✓ Ready' : 'Waiting...'}
              </span>
            </div>
          </div>

          {!mePlayer?.isReady ? (
            <GlassButton
              variant="primary"
              size="lg"
              disabled={readying}
              onClick={handleMarkReady}
              className="px-8"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{readying ? 'Confirming...' : 'I Am Ready — Start Battle'}</span>
            </GlassButton>
          ) : (
            <p className="text-xs font-mono text-cyan-300 animate-pulse">
              Waiting for opponent to confirm ready...
            </p>
          )}
        </GlassCard>
      )}

      {/* PHASE 2: SYNCHRONIZED 3-2-1-GO COUNTDOWN */}
      {battleState.status === 'COUNTDOWN' && (
        <GlassCard level={3} className="p-12 text-center space-y-4">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-300">
            Synchronized Server Countdown
          </span>
          <div className="text-6xl sm:text-7xl font-extrabold font-mono text-white tracking-tight">
            {countdownNum > 0 ? countdownNum : 'GO!'}
          </div>
          <p className="text-xs text-white/60">
            Prepare for Question 1 of {battleState.questionCount} ({battleState.skill})
          </p>
        </GlassCard>
      )}

      {/* PHASE 3: QUESTION-BY-QUESTION BATTLE */}
      {(battleState.status === 'QUESTION_ACTIVE' ||
        battleState.status === 'QUESTION_COMPLETED' ||
        battleState.status === 'NEXT_QUESTION' ||
        battleState.status === 'FINALIZING') &&
        activeQ && (
          <GlassCard level={3} className="p-6 sm:p-8 space-y-6">
            {/* Progress & Topic Header */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-indigo-300">
                  <span>
                    Question {activeQ.questionNumber} / {battleState.questionCount}
                  </span>
                  <span>·</span>
                  <span>Topic: {activeQ.topic}</span>
                  <span>·</span>
                  <span className="uppercase">{activeQ.difficulty}</span>
                </div>
                <span className="text-white/55">
                  {battleState.status === 'QUESTION_COMPLETED' ||
                  battleState.status === 'NEXT_QUESTION'
                    ? 'Round Complete — Next Question Starting...'
                    : battleState.status === 'FINALIZING'
                    ? 'Finalizing Battle Results...'
                    : `${remainingSec}s remaining`}
                </span>
              </div>

              <GlassProgress
                value={Math.round((activeQ.questionNumber / battleState.questionCount) * 100)}
                size="sm"
              />
            </div>

            {/* Question Text */}
            <div className="p-5 rounded-2xl bg-white/[0.035] border border-white/12">
              <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {activeQ.questionText}
              </h2>
            </div>

            {/* Four Options (A, B, C, D) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(activeQ.options || []).map((optionText: string, idx: number) => {
                const letter = ['A', 'B', 'C', 'D'][idx] || String(idx + 1);
                const isSelected =
                  (mySub ? mySub.selectedAnswer : selectedOption) === optionText;
                const isCorrectOption =
                  activeQ.correctAnswer &&
                  optionText.toLowerCase() === activeQ.correctAnswer.toLowerCase();

                let optionStyle =
                  'bg-white/[0.035] border-white/12 text-white/85 hover:bg-white/[0.07] hover:border-white/25';

                if (isQuestionLockedForMe && activeQ.correctAnswer) {
                  if (isCorrectOption) {
                    optionStyle =
                      'bg-emerald-500/20 border-emerald-400/50 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.2)]';
                  } else if (isSelected && !isCorrectOption) {
                    optionStyle = 'bg-rose-500/20 border-rose-400/50 text-rose-200';
                  } else {
                    optionStyle = 'bg-white/[0.02] border-white/8 text-white/45';
                  }
                } else if (isSelected) {
                  optionStyle =
                    'bg-gradient-to-r from-purple-600/35 via-indigo-600/35 to-blue-600/35 border-cyan-400/60 text-white shadow-[0_6px_24px_rgba(79,70,229,0.3)]';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isQuestionLockedForMe}
                    onClick={() => setSelectedOption(optionText)}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${optionStyle}`}
                  >
                    <span className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center font-mono text-xs font-extrabold shrink-0 mt-0.5">
                      {letter}
                    </span>
                    <span className="text-xs sm:text-sm font-medium leading-relaxed">
                      {optionText}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Submit Button or Locked Answer Verification */}
            {!isQuestionLockedForMe ? (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-white/55">
                  {selectedOption
                    ? `Selected: ${selectedOption}`
                    : 'Select one of the four options above to submit.'}
                </span>
                <GlassButton
                  variant="primary"
                  size="lg"
                  disabled={!selectedOption || submitting}
                  onClick={handleSubmitAnswer}
                >
                  <Zap className="w-4 h-4" />
                  <span>{submitting ? 'Locking Answer...' : 'Submit Answer'}</span>
                </GlassButton>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/15 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {mySub?.isCorrect ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-emerald-300">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✓ Correct (+{mySub.points} points)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-rose-300">
                        <XCircle className="w-4 h-4" />
                        <span>
                          {mySub?.selectedAnswer === 'Time Out'
                            ? 'Time Out (0 points)'
                            : '✕ Incorrect (0 points)'}
                        </span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-cyan-300">
                    Answer Locked ·{' '}
                    {mySub ? `${(mySub.timeTakenMs / 1000).toFixed(1)}s` : '30.0s'}
                  </span>
                </div>

                {activeQ.correctAnswer && (
                  <p className="text-xs text-white/80">
                    <strong className="text-white">Correct Answer:</strong> {activeQ.correctAnswer}
                  </p>
                )}
                {activeQ.explanation && (
                  <p className="text-xs text-white/60 leading-relaxed">{activeQ.explanation}</p>
                )}
                {battleState.status === 'QUESTION_ACTIVE' &&
                  !oppPlayer?.hasSubmittedCurrentQuestion && (
                    <p className="text-[11px] font-mono text-amber-300 pt-1">
                      Waiting for {oppPlayer?.fullName || 'opponent'} to finish answering (
                      {remainingSec}s remaining)...
                    </p>
                  )}
              </div>
            )}
          </GlassCard>
        )}
    </div>
  );
};

// ============================================================================
// 4. FINAL RESULT SCREEN (/battle/result/:battleId)
// ============================================================================
export const SkillBattleResultPage: React.FC = () => {
  const { battleId } = useParams<{ battleId: string }>();
  const { profile, apiFetch } = useAuth();
  const navigate = useNavigate();

  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!battleId) return;
    let mounted = true;
    apiFetch<any>(`/api/battle/result/${battleId}`)
      .then((data) => {
        if (mounted) setResult(data);
      })
      .catch((err: any) => {
        if (mounted) setError(err.message || 'Could not load battle result.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [apiFetch, battleId]);

  if (loading) {
    return <LoadingSkeleton count={3} height="h-40" />;
  }

  if (error || !result) {
    return (
      <ErrorState
        message={error || 'Battle result not found.'}
        onRetry={() => navigate('/battle')}
      />
    );
  }

  const me =
    result.players?.find((p: any) => p.userId === profile?.id) || result.players?.[0];
  const opp =
    result.players?.find((p: any) => p.userId !== profile?.id) || result.players?.[1];

  const isDraw = Boolean(result.isDraw);
  const iWon = !isDraw && result.winnerId === me?.userId;
  const winnerPlayer = result.players?.find((p: any) => p.userId === result.winnerId);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Winner / Draw Hero Card */}
      <GlassCard level={3} className="p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/25 via-purple-500/25 to-cyan-500/25 border border-white/20 flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8 text-amber-300" />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-300">
            🏆 Battle Complete · {result.battleId} · {result.skill} ({result.difficulty})
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {isDraw
              ? 'Match Draw'
              : iWon
              ? 'Victory! You Won the Battle'
              : `Winner: ${winnerPlayer?.fullName || 'Opponent'}`}
          </h1>
          <p className="text-sm text-white/65">
            {isDraw
              ? 'Both players performed equally.'
              : iWon
              ? 'Outstanding speed and accuracy! Your Battle Rating has increased.'
              : `${winnerPlayer?.fullName || 'Opponent'} scored higher in this battle. Review the breakdown below and challenge again!`}
          </p>
        </div>

        {/* Player A VS Player B Final Score Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-11 gap-4 items-center max-w-3xl mx-auto pt-2">
          <div className="sm:col-span-5 p-5 rounded-2xl bg-white/[0.04] border border-white/15 space-y-2">
            <div className="flex items-center justify-center gap-2.5">
              <Avatar name={me?.fullName || 'Player A'} src={me?.avatarUrl} size="md" />
              <div className="text-left">
                <p className="text-sm font-extrabold text-white">{me?.fullName}</p>
                <p className="text-[11px] font-mono text-cyan-300">
                  Rating: {me?.ratingAfter}{' '}
                  {me?.ratingDelta >= 0 ? `(+${me?.ratingDelta})` : `(${me?.ratingDelta})`}
                </p>
              </div>
            </div>
            <p className="text-2xl font-extrabold font-mono text-white pt-1">
              Score: {me?.score || 0}
            </p>
          </div>

          <div className="sm:col-span-1 font-mono text-sm font-extrabold text-white/50">VS</div>

          <div className="sm:col-span-5 p-5 rounded-2xl bg-white/[0.04] border border-white/15 space-y-2">
            <div className="flex items-center justify-center gap-2.5">
              <Avatar name={opp?.fullName || 'Player B'} src={opp?.avatarUrl} size="md" />
              <div className="text-left">
                <p className="text-sm font-extrabold text-white">{opp?.fullName}</p>
                <p className="text-[11px] font-mono text-purple-300">
                  Rating: {opp?.ratingAfter}
                </p>
              </div>
            </div>
            <p className="text-2xl font-extrabold font-mono text-white pt-1">
              Score: {opp?.score || 0}
            </p>
          </div>
        </div>

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-xs">
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-white/50 block">Correct Answers</span>
            <span className="text-base font-extrabold font-mono text-emerald-300 mt-0.5 block">
              {me?.correctAnswers} / {result.questionCount}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-white/50 block">Total Points</span>
            <span className="text-base font-extrabold font-mono text-cyan-300 mt-0.5 block">
              {me?.score}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-white/50 block">Average Answer Time</span>
            <span className="text-base font-extrabold font-mono text-white mt-0.5 block">
              {me?.averageAnswerTimeSec} sec
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
            <span className="text-white/50 block">Opponent</span>
            <span className="text-base font-extrabold text-purple-300 mt-0.5 block truncate">
              {opp?.fullName}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <GlassButton
            variant="primary"
            size="lg"
            onClick={() =>
              navigate(
                `/battle/matchmaking?skill=${encodeURIComponent(
                  result.skill
                )}&difficulty=${encodeURIComponent(result.difficulty)}&questions=${
                  result.questionCount
                }`
              )
            }
          >
            <Swords className="w-4 h-4" />
            <span>Play Again</span>
          </GlassButton>
          <GlassButton variant="secondary" size="lg" onClick={() => navigate('/battle')}>
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Skill Battle</span>
          </GlassButton>
          <GlassButton variant="secondary" size="lg" onClick={() => navigate('/battle/history')}>
            <History className="w-4 h-4" />
            <span>View Battle History</span>
          </GlassButton>
        </div>
      </GlassCard>

      {/* Question-by-Question Breakdown */}
      <GlassCard level={2} className="p-6 sm:p-8 space-y-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-300">
            Server-Verified Audit
          </span>
          <h2 className="text-xl font-extrabold text-white mt-0.5">Question Breakdown</h2>
        </div>

        <div className="space-y-4">
          {(result.questionBreakdown || []).map((q: any) => (
            <div
              key={q.questionNumber}
              className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-extrabold text-white">
                    Question {q.questionNumber}
                  </span>
                  <span className="text-white/30">·</span>
                  {q.isCorrect ? (
                    <span className="text-xs font-mono font-bold text-emerald-300">
                      ✓ Correct
                    </span>
                  ) : (
                    <span className="text-xs font-mono font-bold text-rose-300">✕ Incorrect</span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className={q.points > 0 ? 'text-cyan-300 font-bold' : 'text-white/50'}>
                    {q.points > 0 ? `+${q.points} points` : '0 points'}
                  </span>
                  <span className="text-white/30">·</span>
                  <span className="text-white/70">{q.timeTakenSec} sec</span>
                </div>
              </div>

              <p className="text-sm font-bold text-white">{q.questionText}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <p className="text-white/70">
                  <strong className="text-white">Your Answer:</strong> {q.selectedAnswer}
                </p>
                <p className="text-emerald-300">
                  <strong className="text-white">Correct Answer:</strong> {q.correctAnswer}
                </p>
              </div>

              {q.explanation && (
                <p className="text-xs text-white/55 leading-relaxed pt-1">{q.explanation}</p>
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

// ============================================================================
// 5. BATTLE HISTORY PAGE (/battle/history)
// ============================================================================
export const SkillBattleHistoryPage: React.FC = () => {
  const { apiFetch } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiFetch<{ history: any[] }>('/api/battle/history')
      .then((res) => {
        if (mounted) setHistory(res.history || []);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [apiFetch]);

  return (
    <div className="space-y-6">
      <GlassCard level={2} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-300">
            Past 1v1 Matches
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
            Battle History
          </h1>
          <p className="text-sm text-white/65 mt-1">
            Complete record of your previous 1 vs 1 technology battles, scores, accuracy, and speed.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <GlassButton variant="secondary" onClick={() => navigate('/battle/leaderboard')}>
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>Leaderboard</span>
          </GlassButton>
          <GlassButton variant="primary" onClick={() => navigate('/battle')}>
            <Swords className="w-4 h-4" />
            <span>New Skill Battle</span>
          </GlassButton>
        </div>
      </GlassCard>

      {loading ? (
        <LoadingSkeleton count={4} height="h-24" />
      ) : history.length === 0 ? (
        <EmptyState
          title="No battles completed yet"
          description="Challenge another learner in a 1 vs 1 Skill Battle to build your match history."
          actionLabel="Start Your First Battle"
          onAction={() => navigate('/battle')}
        />
      ) : (
        <div className="space-y-3.5">
          {history.map((item) => {
            const resultColor =
              item.result === 'Won'
                ? 'text-emerald-300'
                : item.result === 'Draw'
                ? 'text-amber-300'
                : 'text-rose-300';

            return (
              <GlassCard
                key={item.battleId}
                level={2}
                interactive
                onClick={() => navigate(`/battle/result/${item.battleId}`)}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <Avatar
                    name={item.opponent?.fullName || 'Peer'}
                    src={item.opponent?.avatarUrl}
                    size="md"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="font-bold text-cyan-300">{item.skill}</span>
                      <span>·</span>
                      <span className={`font-extrabold ${resultColor}`}>{item.result}</span>
                      <span>·</span>
                      <span className="text-white/50">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">
                      vs {item.opponent?.fullName}
                    </h3>
                    <p className="text-xs text-white/55">
                      {item.questionCount} Questions · Accuracy {item.accuracy}% · Avg Time{' '}
                      {item.averageTimeSec}s
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
                  <div className="text-right">
                    <span className="text-[11px] text-white/45 block">Final Score</span>
                    <span className="text-lg font-extrabold font-mono text-white">
                      {item.myScore} - {item.opponentScore}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/45" />
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 6. BATTLE LEADERBOARD PAGE (/battle/leaderboard)
// ============================================================================
export const SkillBattleLeaderboardPage: React.FC = () => {
  const { profile, apiFetch } = useAuth();
  const navigate = useNavigate();

  const [skillFilter, setSkillFilter] = useState('All');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const filterTabs = [
    'All',
    'Python',
    'JavaScript',
    'React',
    'Flutter',
    'SQL',
    'HTML/CSS',
    'MongoDB',
    'Java',
    'C++',
  ];

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const query =
      skillFilter !== 'All' ? `?skill=${encodeURIComponent(skillFilter)}` : '';
    apiFetch<{ leaderboard: any[] }>(`/api/battle/leaderboard${query}`)
      .then((res) => {
        if (mounted) setRows(res.leaderboard || []);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [apiFetch, skillFilter]);

  return (
    <div className="space-y-6">
      <GlassCard level={2} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-300">
            Campus Competitive Rankings
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
            Skill Battle Leaderboard
          </h1>
          <p className="text-sm text-white/65 mt-1">
            Ranked by authoritative Battle Rating and cumulative battle points across technologies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <GlassButton variant="secondary" onClick={() => navigate('/battle/history')}>
            <History className="w-4 h-4" />
            <span>My History</span>
          </GlassButton>
          <GlassButton variant="primary" onClick={() => navigate('/battle')}>
            <Swords className="w-4 h-4" />
            <span>Back to Battle Lobby</span>
          </GlassButton>
        </div>
      </GlassCard>

      {/* Technology Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {filterTabs.map((tab) => {
          const active = skillFilter === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setSkillFilter(tab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 ${
                active
                  ? 'bg-gradient-to-r from-purple-600/40 via-indigo-600/40 to-cyan-500/35 border-cyan-400/50 text-white'
                  : 'bg-white/[0.035] border-white/10 text-white/65 hover:text-white hover:bg-white/[0.07]'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingSkeleton count={5} height="h-16" />
      ) : rows.length === 0 ? (
        <EmptyState
          title={`No leaderboard entries for ${skillFilter} yet`}
          description="Complete a 1 vs 1 battle in this technology to claim the #1 rank!"
          actionLabel="Start Battle"
          onAction={() => navigate('/battle')}
        />
      ) : (
        <GlassCard level={2} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/[0.04] border-b border-white/10 text-white/55 font-mono uppercase">
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Player</th>
                  <th className="py-3.5 px-4">Battle Rating</th>
                  <th className="py-3.5 px-4">Wins</th>
                  <th className="py-3.5 px-4">Battles</th>
                  <th className="py-3.5 px-4">Win Rate</th>
                  <th className="py-3.5 px-4 text-right">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {rows.map((r) => {
                  const isMe = r.userId === profile?.id;
                  return (
                    <tr
                      key={r.userId}
                      className={`transition-colors ${
                        isMe ? 'bg-indigo-500/15' : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-extrabold text-sm">
                        {r.rank === 1 ? (
                          <span className="text-amber-300">#1 🏆</span>
                        ) : r.rank === 2 ? (
                          <span className="text-slate-200">#2</span>
                        ) : r.rank === 3 ? (
                          <span className="text-amber-500">#3</span>
                        ) : (
                          <span className="text-white/60">#{r.rank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.fullName} src={r.avatarUrl} size="sm" />
                          <div>
                            <p className="font-bold text-white">
                              {r.fullName} {isMe && <span className="text-cyan-300">(You)</span>}
                            </p>
                            <p className="text-white/45">{r.college}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-cyan-300">
                        {r.battleRating}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-300">
                        {r.battlesWon}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-white/80">{r.battlesPlayed}</td>
                      <td className="py-3.5 px-4 font-mono text-indigo-300">{r.winRate}%</td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-white text-right">
                        {r.totalPoints.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

// ============================================================================
// 7. DEDICATED BATTLE STATS PAGE (/battle/stats)
// ============================================================================
export const SkillBattleStatsPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <GlassButton variant="secondary" size="sm" onClick={() => navigate('/battle')}>
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Skill Battle</span>
        </GlassButton>
      </div>
      <BattleStatsSection />
    </div>
  );
};
