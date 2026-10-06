import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  Clock,
  Code2,
  FileCheck2,
  HelpCircle,
  Lock,
  Play,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Download,
  Eye,
  ShieldCheck,
  Search,
  Sparkles,
  RefreshCw,
  XCircle,
  Printer,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  SkillTestAttempt,
  SkillTestQuestionItem,
  CertificateItem,
} from '../types.ts';
import {
  GlassCard,
  GlassButton,
  GlassProgress,
  GlassStatCard,
  Modal,
  LoadingSkeleton,
  EmptyState,
  LiquidBackground,
} from '../components/ui/CommonUI.tsx';
import { SkillBridgeLogoIcon } from '../components/layout/AppLayout.tsx';

const CANONICAL_TECHNICAL_SKILLS = [
  'JavaScript',
  'Python',
  'Java',
  'C++',
  'C',
  'React',
  'Node.js',
  'HTML/CSS',
  'SQL',
  'MongoDB',
  'Flutter',
  'UI/UX Design',
];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function formatTimerClock(seconds: number): string {
  const s = Math.max(0, seconds);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Helper to download a high-resolution PNG certificate via HTML5 Canvas
export function downloadCertificateAsPng(cert: CertificateItem) {
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 960;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Dark obsidian background with subtle gradient
  const grad = ctx.createLinearGradient(0, 0, 1400, 960);
  grad.addColorStop(0, '#090912');
  grad.addColorStop(0.5, '#111122');
  grad.addColorStop(1, '#08121E');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1400, 960);

  // Outer border
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.55)';
  ctx.lineWidth = 6;
  ctx.strokeRect(40, 40, 1320, 880);

  // Inner border
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(58, 58, 1284, 844);

  // Header brand
  ctx.fillStyle = '#22D3EE';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SKILLBRIDGE • MICRO-SKILL EXCHANGE & PEER LEARNING PLATFORM', 700, 145);

  // Main title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 52px sans-serif';
  ctx.fillText('CERTIFICATE OF ACHIEVEMENT', 700, 225);

  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '22px sans-serif';
  ctx.fillText('This official academic credential is proudly presented to', 700, 305);

  // Recipient Name
  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText(cert.recipientName, 700, 390);

  // Divider line
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(350, 420);
  ctx.lineTo(1050, 420);
  ctx.stroke();

  // Certificate Title & Skill
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '24px sans-serif';
  ctx.fillText('for successfully demonstrating verified proficiency in', 700, 480);

  ctx.fillStyle = '#C084FC';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText(cert.skillName, 700, 545);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = '24px sans-serif';
  ctx.fillText(cert.title, 700, 600);

  // Metadata footer boxes
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '18px monospace';
  ctx.fillText('CERTIFICATE ID', 130, 750);
  ctx.fillStyle = '#34D399';
  ctx.font = 'bold 24px monospace';
  ctx.fillText(cert.certificateId, 130, 785);

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '18px monospace';
  ctx.fillText('VERIFICATION STATUS', 700, 750);
  ctx.fillStyle = '#34D399';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`✓ ${cert.verificationStatus.toUpperCase()}`, 700, 785);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '18px monospace';
  ctx.fillText('ISSUE DATE', 1270, 750);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px monospace';
  ctx.fillText(cert.issueDate, 1270, 785);

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Issued by ${cert.issuedBy} • Verify online at SkillBridge`, 700, 860);

  const link = document.createElement('a');
  link.download = `${cert.certificateId}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ============================================================================
// 5. MENTOR SKILL VERIFICATION TEST SETUP PAGE (/mentor/verify-skills)
// ============================================================================
export const MentorVerifySkillsPage: React.FC = () => {
  const { profile, catalogSkills, apiFetch, showToast } = useAuth();
  const navigate = useNavigate();

  const [activeTest, setActiveTest] = useState<SkillTestAttempt | null>(null);
  const [attempts, setAttempts] = useState<SkillTestAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);

  // Filter skills relevant to the mentor's selected teaching skills
  const mentorTeachingNames = (profile?.teachingSkills || []).map((s) => s.name);
  const relevantSkills =
    mentorTeachingNames.length > 0 && !showAllSkills
      ? mentorTeachingNames
      : Array.from(
          new Set([
            ...mentorTeachingNames,
            ...CANONICAL_TECHNICAL_SKILLS,
            ...catalogSkills.map((s) => s.name),
          ])
        );

  const [selectedSkill, setSelectedSkill] = useState<string>(
    mentorTeachingNames[0] || 'JavaScript'
  );
  const [difficulty, setDifficulty] = useState<string>('Intermediate');

  useEffect(() => {
    if (mentorTeachingNames.length > 0 && !relevantSkills.includes(selectedSkill)) {
      setSelectedSkill(mentorTeachingNames[0]);
    }
  }, [mentorTeachingNames, relevantSkills, selectedSkill]);

  const loadMyTests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{
        activeTest: SkillTestAttempt | null;
        attempts: SkillTestAttempt[];
      }>('/api/skill-tests/my');
      setActiveTest(data.activeTest);
      setAttempts(data.attempts || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load skill verification status.', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, showToast]);

  useEffect(() => {
    loadMyTests();
  }, [loadMyTests]);

  const handleStartTest = async () => {
    if (!selectedSkill) {
      showToast('Please select a skill to verify.', 'error');
      return;
    }
    setStarting(true);
    try {
      const res = await apiFetch<{ testId: string; resumed: boolean }>('/api/skill-tests/start', {
        method: 'POST',
        body: JSON.stringify({
          skill: selectedSkill,
          difficulty,
        }),
      });
      showToast(
        res.resumed ? 'Resuming your active skill test...' : `Starting ${selectedSkill} verification test!`,
        'info'
      );
      navigate(`/mentor/test/${res.testId}`);
    } catch (err: any) {
      showToast(err.message || 'Could not start skill test.', 'error');
    } finally {
      setStarting(false);
    }
  };

  const verificationStatus = profile?.mentorVerificationStatus || 'Not Submitted';

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <GlassCard level={2} className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-violet-300">
              <Award className="w-3.5 h-3.5 text-cyan-300" />
              <span>Mentor Qualification &amp; Badge Pipeline</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              Verify Your Skills
            </h1>
            <p className="text-sm text-white/65 mt-1 max-w-2xl">
              Pass a timed technical Skill Verification Test (MCQ + Code Writing). After you complete
              the test, an administrator will review your profile and test performance to award your{' '}
              <strong className="text-emerald-300">Verified Mentor</strong> badge.
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-white/45">
              Current Mentor Status
            </span>
            <span
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border inline-flex items-center gap-2 ${
                profile?.isVerifiedMentor && verificationStatus === 'Approved'
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                  : verificationStatus === 'Rejected'
                  ? 'bg-rose-500/20 border-rose-400/40 text-rose-200'
                  : verificationStatus === 'Pending Review' || verificationStatus === 'Under Review'
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                  : 'bg-white/[0.06] border-white/15 text-white/75'
              }`}
            >
              {profile?.isVerifiedMentor && verificationStatus === 'Approved' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Approved • Verified Mentor</span>
                </>
              ) : (
                <span>{verificationStatus}</span>
              )}
            </span>
          </div>
        </div>

        {/* 5-Stage Verification Pipeline Visual */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-white/10">
          {[
            { step: '1. Registration', done: true },
            { step: '2. Skill Test', done: attempts.length > 0 },
            { step: '3. Test Result', done: attempts.some((a) => a.status !== 'IN_PROGRESS') },
            {
              step: '4. Admin Review',
              done:
                verificationStatus === 'Under Review' ||
                verificationStatus === 'Approved' ||
                verificationStatus === 'Rejected',
            },
            {
              step: '5. Verified Badge',
              done: Boolean(profile?.isVerifiedMentor && verificationStatus === 'Approved'),
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                item.done
                  ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-200'
                  : 'bg-white/[0.03] border-white/10 text-white/50'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  item.done ? 'text-emerald-400' : 'text-white/25'
                }`}
              />
              <span className="truncate">{item.step}</span>
            </div>
          ))}
        </div>

        {/* Admin Review Note if Rejected or Approved */}
        {profile?.mentorReviewNote && (
          <div
            className={`p-4 rounded-2xl border text-xs space-y-1 ${
              verificationStatus === 'Rejected'
                ? 'bg-rose-500/15 border-rose-400/35 text-rose-100'
                : 'bg-cyan-500/15 border-cyan-400/35 text-cyan-100'
            }`}
          >
            <p className="font-mono uppercase tracking-wider text-[10px] font-bold">
              Administrator Review Feedback
            </p>
            <p className="leading-relaxed">{profile.mentorReviewNote}</p>
          </div>
        )}
      </GlassCard>

      {/* Active In-Progress Test Banner */}
      {activeTest && (
        <GlassCard
          level={2}
          className="p-6 border-amber-400/40 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">
              Active Test Attempt in Progress
            </span>
            <h3 className="text-lg font-bold text-white">
              {activeTest.skill} ({activeTest.difficulty}) — Attempt #{activeTest.id}
            </h3>
            <p className="text-xs text-white/70">
              Remaining Time: <strong className="font-mono text-amber-200">{formatTimerClock(activeTest.remainingSeconds || 0)}</strong> • Your answers and timer are preserved on the server.
            </p>
          </div>
          <GlassButton
            type="button"
            variant="primary"
            onClick={() => navigate(`/mentor/test/${activeTest.id}`)}
          >
            <Play className="w-4 h-4" />
            <span>Resume Active Test</span>
          </GlassButton>
        </GlassCard>
      )}

      {/* Skill Test Configuration Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <GlassCard level={2} className="lg:col-span-7 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Configure Skill Verification Test
              </h2>
              <p className="text-xs text-white/55 mt-0.5">
                {mentorTeachingNames.length > 0 && !showAllSkills
                  ? 'Showing skills matched to your selected teaching profile'
                  : 'Select a technical skill from the SkillBridge catalog'}
              </p>
            </div>
            {mentorTeachingNames.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAllSkills((prev) => !prev)}
                className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
              >
                {showAllSkills ? 'Show Only My Teaching Skills' : 'Show All Available Skills'}
              </button>
            )}
          </div>

          {/* Skill Selection Grid */}
          <div className="space-y-2.5">
            <label className="block text-xs font-medium text-white/75">
              1. Choose Programming / Technical Skill to Verify
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1">
              {relevantSkills.map((sk) => {
                const isSelected = selectedSkill === sk;
                return (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => setSelectedSkill(sk)}
                    className={`p-3 rounded-xl text-xs font-semibold text-left border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-gradient-to-r from-violet-600/35 to-cyan-500/25 border-cyan-400/50 text-white shadow-sm'
                        : 'glass-level-1 border-white/10 text-white/70 hover:text-white hover:border-white/25'
                    }`}
                  >
                    <span className="truncate">{sk}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="space-y-2.5">
            <label className="block text-xs font-medium text-white/75">
              2. Select Assessment Difficulty
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    difficulty === lvl
                      ? 'bg-violet-500/25 border-violet-400/50 text-violet-100'
                      : 'glass-level-1 border-white/10 text-white/65 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Test Specifications Summary */}
          <div className="p-4 rounded-xl glass-level-1 grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <p className="text-white/45 font-mono uppercase text-[10px]">Total Questions</p>
              <p className="text-base font-bold text-white mt-0.5">20 Questions</p>
              <p className="text-[11px] text-white/50">16 MCQ + 4 Code</p>
            </div>
            <div>
              <p className="text-white/45 font-mono uppercase text-[10px]">Time Limit</p>
              <p className="text-base font-bold text-cyan-300 mt-0.5">20 Minutes</p>
              <p className="text-[11px] text-white/50">Server-Synchronized</p>
            </div>
            <div>
              <p className="text-white/45 font-mono uppercase text-[10px]">Total Score</p>
              <p className="text-base font-bold text-emerald-300 mt-0.5">100 Points</p>
              <p className="text-[11px] text-white/50">Admin Reviewed</p>
            </div>
          </div>

          <GlassButton
            type="button"
            variant="primary"
            disabled={starting}
            onClick={handleStartTest}
            className="w-full py-3.5 text-sm"
          >
            <Play className="w-4 h-4" />
            <span>
              {starting
                ? 'Preparing Verification Test...'
                : `Start ${selectedSkill} Verification Test`}
            </span>
          </GlassButton>
        </GlassCard>

        {/* Past Test Attempts List */}
        <GlassCard level={2} className="lg:col-span-5 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-bold text-white tracking-tight">
              Your Skill Test Attempts
            </h3>
            <span className="text-xs font-mono text-white/50">{attempts.length} total</span>
          </div>

          {loading ? (
            <LoadingSkeleton count={2} height="h-24" />
          ) : attempts.length === 0 ? (
            <EmptyState
              icon={FileCheck2}
              title="No Test Attempts Yet"
              description="Select a skill on the left and click Start Test to complete your mentor skill verification."
            />
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {attempts.map((att) => (
                <div
                  key={att.id}
                  className="p-4 rounded-xl glass-level-1 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-300 uppercase">
                        {att.id}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">
                        {att.skill} ({att.difficulty})
                      </h4>
                      <p className="text-[11px] text-white/50 mt-0.5">
                        {new Date(att.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                        att.status === 'IN_PROGRESS'
                          ? 'bg-amber-500/20 border-amber-400/35 text-amber-200'
                          : att.passed
                          ? 'bg-emerald-500/20 border-emerald-400/35 text-emerald-200'
                          : 'bg-rose-500/20 border-rose-400/35 text-rose-200'
                      }`}
                    >
                      {att.status === 'IN_PROGRESS'
                        ? 'In Progress'
                        : `${att.score}/${att.maxScore} (${att.percentage}%)`}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                    {att.status === 'IN_PROGRESS' ? (
                      <GlassButton
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/mentor/test/${att.id}`)}
                      >
                        Resume Test
                      </GlassButton>
                    ) : (
                      <GlassButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/mentor/test-result/${att.id}`)}
                      >
                        View Test Result
                      </GlassButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

// ============================================================================
// 6 & 7. SKILL VERIFICATION TEST SCREEN (/mentor/test/:testId)
// ============================================================================
export const SkillVerificationTestScreen: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const { apiFetch, showToast, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [test, setTest] = useState<SkillTestAttempt | null>(null);
  const [questions, setQuestions] = useState<SkillTestQuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(1200);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState<boolean>(false);
  const [showReviewPanel, setShowReviewPanel] = useState<boolean>(false);

  const autoSubmittedRef = useRef<boolean>(false);

  const loadTestState = useCallback(async () => {
    if (!testId) return;
    setLoading(true);
    try {
      const data = await apiFetch<{
        test: SkillTestAttempt;
        questions: SkillTestQuestionItem[];
      }>(`/api/skill-tests/${testId}`);

      if (data.test.status !== 'IN_PROGRESS') {
        navigate(`/mentor/test-result/${testId}`, { replace: true });
        return;
      }

      setTest(data.test);
      setQuestions(data.questions || []);
      setCurrentIndex(
        Math.min(
          Math.max(0, data.test.currentQuestionIndex || 0),
          Math.max(0, (data.questions || []).length - 1)
        )
      );
      setRemainingSeconds(data.test.remainingSeconds ?? 1200);

      const initialMap: Record<number, string> = {};
      for (const q of data.questions || []) {
        initialMap[q.questionNumber] =
          q.userAnswer !== undefined && q.userAnswer !== ''
            ? q.userAnswer
            : q.questionType === 'CODE'
            ? q.starterCode
            : '';
      }
      setAnswers(initialMap);
    } catch (err: any) {
      showToast(err.message || 'Failed to load skill test.', 'error');
      navigate('/mentor/verify-skills');
    } finally {
      setLoading(false);
    }
  }, [testId, apiFetch, navigate, showToast]);

  useEffect(() => {
    loadTestState();
  }, [loadTestState]);

  const handleFinalSubmit = useCallback(
    async (isTimeout = false) => {
      if (!testId || submitting) return;
      setSubmitting(true);
      try {
        await apiFetch(`/api/skill-tests/${testId}/submit`, {
          method: 'POST',
          body: JSON.stringify({ answers }),
        });
        await refreshProfile();
        showToast(
          isTimeout
            ? 'Time reached 00:00 — Test automatically submitted!'
            : 'Test submitted and locked! Redirecting to your test results...',
          isTimeout ? 'info' : 'success'
        );
        navigate(`/mentor/test-result/${testId}`, { replace: true });
      } catch (err: any) {
        showToast(err.message || 'Failed to submit test.', 'error');
        setSubmitting(false);
      }
    },
    [testId, submitting, apiFetch, answers, refreshProfile, showToast, navigate]
  );

  // Reliable countdown timer synchronized with server expiration
  useEffect(() => {
    if (!test || test.status !== 'IN_PROGRESS') return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!autoSubmittedRef.current) {
            autoSubmittedRef.current = true;
            handleFinalSubmit(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [test, handleFinalSubmit]);

  const persistAnswerToServer = useCallback(
    async (questionNumber: number, value: string, nextQuestionIdx: number) => {
      if (!testId) return;
      setSaving(true);
      try {
        const res = await apiFetch<{
          saved?: boolean;
          expired?: boolean;
          remainingSeconds?: number;
        }>(`/api/skill-tests/${testId}/answer`, {
          method: 'PUT',
          body: JSON.stringify({
            questionNumber,
            userAnswer: value,
            currentQuestionIndex: nextQuestionIdx,
          }),
        });
        if (res.expired) {
          showToast('Time is up! Your test was automatically submitted.', 'info');
          navigate(`/mentor/test-result/${testId}`, { replace: true });
          return;
        }
        if (typeof res.remainingSeconds === 'number') {
          setRemainingSeconds(res.remainingSeconds);
        }
      } catch {
        // Ignore transient network save errors; state is preserved locally and sent on final submit
      } finally {
        setSaving(false);
      }
    },
    [testId, apiFetch, navigate, showToast]
  );

  if (loading || !test || questions.length === 0) {
    return <LoadingSkeleton count={3} height="h-44" />;
  }

  const currentQ = questions[currentIndex];
  const currentAnswer = answers[currentQ.questionNumber] ?? '';

  const isQuestionAnswered = (q: SkillTestQuestionItem): boolean => {
    const val = (answers[q.questionNumber] ?? '').trim();
    if (!val) return false;
    if (q.questionType === 'MCQ') return true;
    const normStarter = (q.starterCode || '').replace(/\s+/g, '');
    const normVal = val.replace(/\s+/g, '');
    return normVal !== normStarter && normVal.length > 10;
  };

  const answeredCount = questions.filter((q) => isQuestionAnswered(q)).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  const handleAnswerChange = (newValue: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.questionNumber]: newValue,
    }));
  };

  const handleGoToQuestion = async (targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    await persistAnswerToServer(currentQ.questionNumber, currentAnswer, targetIdx);
    setCurrentIndex(targetIdx);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Skill Info + Question Counter + Server Countdown Timer */}
      <GlassCard level={2} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-violet-500/20 border border-violet-400/35 text-violet-200 text-[11px] font-mono font-bold">
              {test.skill}
            </span>
            <span className="text-xs text-white/50 font-mono">Attempt #{test.id}</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white mt-1">
            Question {currentIndex + 1} of {questions.length}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Countdown Timer */}
          <div
            className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2.5 font-mono font-bold text-base ${
              remainingSeconds <= 120
                ? 'bg-rose-500/20 border-rose-400/45 text-rose-200 animate-pulse'
                : 'bg-cyan-500/15 border-cyan-400/35 text-cyan-200'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>{formatTimerClock(remainingSeconds)}</span>
          </div>

          <GlassButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowReviewPanel((prev) => !prev)}
          >
            <span>{showReviewPanel ? 'Hide Review Grid' : 'Review All Questions'}</span>
          </GlassButton>

          <GlassButton
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              persistAnswerToServer(currentQ.questionNumber, currentAnswer, currentIndex);
              setConfirmSubmitOpen(true);
            }}
          >
            <span>Submit Test</span>
          </GlassButton>
        </div>
      </GlassCard>

      {/* Progress Indicator */}
      <GlassCard level={1} className="p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/70 font-medium">
            Test Progress: <strong className="text-white">{answeredCount}</strong> of{' '}
            <strong className="text-white">{questions.length}</strong> questions answered
          </span>
          <span className="font-mono text-cyan-300">
            {saving ? 'Syncing answer...' : `${progressPercent}% Completed`}
          </span>
        </div>
        <GlassProgress value={progressPercent} />
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Question Card */}
        <GlassCard level={2} className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold border ${
                  currentQ.questionType === 'CODE'
                    ? 'bg-amber-500/20 border-amber-400/35 text-amber-200'
                    : 'bg-indigo-500/20 border-indigo-400/35 text-indigo-200'
                }`}
              >
                {currentQ.questionType === 'CODE' ? (
                  <>
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Code Writing Question</span>
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Multiple Choice Question (MCQ)</span>
                  </>
                )}
              </span>

              <span className="text-xs font-mono text-white/55">{currentQ.points} Points</span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">
              {currentQ.questionText}
            </h2>

            {/* MCQ Options */}
            {currentQ.questionType === 'MCQ' ? (
              <div className="space-y-3 pt-2">
                {currentQ.options.map((opt, idx) => {
                  const selected = currentAnswer === opt;
                  const optionLetter = String.fromCharCode(65 + idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        handleAnswerChange(opt);
                        persistAnswerToServer(currentQ.questionNumber, opt, currentIndex);
                      }}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                        selected
                          ? 'bg-gradient-to-r from-violet-600/30 via-indigo-600/25 to-cyan-500/20 border-cyan-400/60 text-white shadow-sm'
                          : 'glass-level-1 border-white/10 text-white/80 hover:text-white hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span
                          className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center border ${
                            selected
                              ? 'bg-cyan-400/25 border-cyan-300 text-cyan-200'
                              : 'bg-white/[0.05] border-white/15 text-white/60'
                          }`}
                        >
                          {optionLetter}
                        </span>
                        <span className="text-sm font-medium">{opt}</span>
                      </div>
                      {selected && <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Code Writing Editor Area */
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-white/55">
                  <span className="font-mono">
                    Code Editor • Your written code is automatically preserved when moving between questions
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAnswerChange(currentQ.starterCode)}
                    className="text-cyan-300 hover:text-cyan-200 font-medium"
                  >
                    Reset to Starter Code
                  </button>
                </div>
                <textarea
                  rows={10}
                  value={currentAnswer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  onBlur={() =>
                    persistAnswerToServer(currentQ.questionNumber, currentAnswer, currentIndex)
                  }
                  spellCheck={false}
                  placeholder="Write your code solution here..."
                  className="w-full p-4 rounded-2xl bg-[#07070C] border border-white/15 focus:border-cyan-400/50 text-emerald-300 font-mono text-xs sm:text-sm leading-relaxed focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Navigation Controls: Previous / Next / Submit Test */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <GlassButton
              type="button"
              variant="secondary"
              disabled={currentIndex === 0}
              onClick={() => handleGoToQuestion(currentIndex - 1)}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </GlassButton>

            <div className="flex items-center gap-2.5">
              {currentIndex < questions.length - 1 ? (
                <GlassButton
                  type="button"
                  variant="primary"
                  onClick={() => handleGoToQuestion(currentIndex + 1)}
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </GlassButton>
              ) : (
                <GlassButton
                  type="button"
                  variant="primary"
                  onClick={() => {
                    persistAnswerToServer(currentQ.questionNumber, currentAnswer, currentIndex);
                    setConfirmSubmitOpen(true);
                  }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Review &amp; Submit Test</span>
                </GlassButton>
              )}
            </div>
          </div>
        </GlassCard>

        {/* All Questions / Review Answers Sidebar */}
        <GlassCard level={2} className="lg:col-span-4 p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              All Questions / Review Answers
            </h3>
            <p className="text-xs text-white/55 mt-0.5">
              Click any question number to jump directly and modify your answer before submission.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const answered = isQuestionAnswered(q);
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleGoToQuestion(idx)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                    isCurrent
                      ? 'bg-cyan-500/25 border-cyan-400 text-white font-bold'
                      : answered
                      ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-200'
                      : 'bg-white/[0.03] border-white/10 text-white/55 hover:text-white'
                  }`}
                >
                  <span className="font-mono">
                    {q.questionNumber}. {answered ? 'Answered' : 'Not Answered'}
                  </span>
                  {q.questionType === 'CODE' && (
                    <Code2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>Answered: <strong className="text-emerald-300">{answeredCount}</strong></span>
              <span>
                Not Answered:{' '}
                <strong className="text-amber-300">{questions.length - answeredCount}</strong>
              </span>
            </div>

            <GlassButton
              type="button"
              variant="primary"
              className="w-full"
              onClick={() => {
                persistAnswerToServer(currentQ.questionNumber, currentAnswer, currentIndex);
                setConfirmSubmitOpen(true);
              }}
            >
              Submit Test
            </GlassButton>
          </div>
        </GlassCard>
      </div>

      {/* Confirmation Dialog Before Final Submission */}
      <Modal
        open={confirmSubmitOpen}
        onClose={() => setConfirmSubmitOpen(false)}
        title="Confirm Test Submission"
      >
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            <div className="text-xs text-white/85 space-y-1">
              <p className="font-bold text-sm text-white">
                Are you sure you want to submit the test?
              </p>
              <p>
                Once submitted, your test will be locked and you will not be able to modify your
                answers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 rounded-xl glass-level-1">
              <p className="text-white/50">Total Questions</p>
              <p className="text-base font-bold text-white mt-0.5">{questions.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30">
              <p className="text-emerald-200/75">Answered</p>
              <p className="text-base font-bold text-emerald-300 mt-0.5">{answeredCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/30">
              <p className="text-amber-200/75">Not Answered</p>
              <p className="text-base font-bold text-amber-300 mt-0.5">
                {questions.length - answeredCount}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <GlassButton
              type="button"
              variant="secondary"
              onClick={() => setConfirmSubmitOpen(false)}
            >
              Review Answers
            </GlassButton>
            <GlassButton
              type="button"
              variant="primary"
              disabled={submitting}
              onClick={() => handleFinalSubmit(false)}
            >
              {submitting ? 'Submitting & Locking...' : 'Yes, Submit Final Test'}
            </GlassButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ============================================================================
// 8. VIEW TEST RESULT PAGE (/mentor/test-result/:testId)
// ============================================================================
export const SkillTestResultPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const { profile, apiFetch, showToast } = useAuth();
  const navigate = useNavigate();

  const [test, setTest] = useState<SkillTestAttempt | null>(null);
  const [questions, setQuestions] = useState<SkillTestQuestionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!testId) return;
    setLoading(true);
    apiFetch<{ test: SkillTestAttempt; questions: SkillTestQuestionItem[] }>(
      `/api/skill-tests/${testId}`
    )
      .then((data) => {
        setTest(data.test);
        setQuestions(data.questions || []);
      })
      .catch((err: any) => {
        showToast(err.message || 'Could not load test result.', 'error');
      })
      .finally(() => setLoading(false));
  }, [testId, apiFetch, showToast]);

  if (loading || !test) {
    return <LoadingSkeleton count={3} height="h-40" />;
  }

  const verificationStatus = profile?.mentorVerificationStatus || 'Pending Review';
  const correctPct =
    test.totalQuestions > 0 ? Math.round((test.correctCount / test.totalQuestions) * 100) : 0;
  const incorrectPct =
    test.totalQuestions > 0 ? Math.round((test.incorrectCount / test.totalQuestions) * 100) : 0;
  const unansweredPct =
    test.totalQuestions > 0 ? Math.round((test.unansweredCount / test.totalQuestions) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <GlassCard level={2} className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-cyan-500/20 border border-cyan-400/35 text-cyan-200 text-xs font-mono font-bold">
              Attempt ID: {test.id}
            </span>
            <span className="px-3 py-1 rounded-xl bg-white/[0.06] border border-white/15 text-white/75 text-xs font-mono">
              Locked &amp; Verified
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Skill Verification Test Result — {test.skill}
          </h1>
          <p className="text-xs sm:text-sm text-white/60">
            Test Date: {new Date(test.submittedAt || test.createdAt).toLocaleString()} • Time Taken:{' '}
            <strong className="text-white font-mono">{formatDuration(test.timeTakenSeconds)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <GlassButton
            type="button"
            variant="secondary"
            onClick={() => navigate('/mentor/verify-skills')}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Verify Skills</span>
          </GlassButton>
          <GlassButton
            type="button"
            variant="primary"
            onClick={() => navigate('/certificates')}
          >
            <Award className="w-4 h-4" />
            <span>View Certificates</span>
          </GlassButton>
        </div>
      </GlassCard>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassStatCard
          label="Overall Score"
          value={`${test.score}/${test.maxScore}`}
          subtext={`Skill: ${test.skill}`}
          icon={Award}
          accent="purple"
        />
        <GlassStatCard
          label="Percentage"
          value={`${test.percentage}%`}
          subtext={test.passed ? 'Assessment Passed' : 'Below 60% Threshold'}
          icon={CheckCircle2}
          accent={test.passed ? 'emerald' : 'rose'}
        />
        <GlassStatCard
          label="Time Taken"
          value={formatDuration(test.timeTakenSeconds)}
          subtext={`Out of ${formatDuration(test.durationSeconds)}`}
          icon={Clock}
          accent="cyan"
        />
        <GlassStatCard
          label="Total Questions"
          value={test.totalQuestions}
          subtext={`${test.correctCount} Correct • ${test.incorrectCount} Incorrect`}
          icon={FileCheck2}
          accent="blue"
        />
      </div>

      {/* Overall Performance Section + Simple Visualization + Admin Review Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <GlassCard level={2} className="lg:col-span-7 p-6 space-y-5">
          <div className="border-b border-white/10 pb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-300">
              Performance Summary
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5">Overall Performance</h2>
          </div>

          <div className="p-4 rounded-2xl bg-[#090910] border border-white/10 font-mono text-xs sm:text-sm space-y-2">
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-white/65">Score:</span>
              <span className="font-bold text-white">
                {test.score}/{test.maxScore}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-white/65">Percentage:</span>
              <span className="font-bold text-cyan-300">{test.percentage}%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-white/65">Correct:</span>
              <span className="font-bold text-emerald-300">{test.correctCount}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-white/65">Incorrect:</span>
              <span className="font-bold text-rose-300">{test.incorrectCount}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-white/65">Unanswered:</span>
              <span className="font-bold text-amber-300">{test.unansweredCount}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-white/65">Skill Tested:</span>
              <span className="font-bold text-violet-300">{test.skill}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-white/65">Test Attempt ID:</span>
              <span className="font-bold text-white/90">{test.id}</span>
            </div>
          </div>

          {/* Simple Performance Visualization */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold text-white/80">
              Accuracy Distribution Visualization
            </p>
            <div className="w-full h-4 rounded-full bg-white/[0.06] border border-white/10 overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${correctPct}%` }}
                title={`Correct: ${test.correctCount}`}
              />
              <div
                className="h-full bg-rose-500 transition-all"
                style={{ width: `${incorrectPct}%` }}
                title={`Incorrect: ${test.incorrectCount}`}
              />
              <div
                className="h-full bg-amber-400/70 transition-all"
                style={{ width: `${unansweredPct}%` }}
                title={`Unanswered: ${test.unansweredCount}`}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/65">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Correct: {test.correctCount} ({correctPct}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Incorrect: {test.incorrectCount} ({incorrectPct}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Unanswered: {test.unansweredCount} ({unansweredPct}%)
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Admin Verification + Mentor Badge Status Card */}
        <GlassCard level={2} className="lg:col-span-5 p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-400/35 text-violet-300 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Admin Verification &amp; Mentor Badge
                </h3>
                <p className="text-xs text-white/55">
                  Official Mentor Verification Workflow
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl glass-level-1 space-y-2 text-xs text-white/75 leading-relaxed">
              <p>
                Passing the skill test does <strong className="text-white">not</strong> automatically
                grant a Verified Mentor badge. An administrator reviews your profile, qualification,
                experience, GitHub/LinkedIn links, and test performance before approval.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-white/55 font-mono uppercase">Current Review Status</p>
              <div
                className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
                  profile?.isVerifiedMentor && verificationStatus === 'Approved'
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                    : verificationStatus === 'Rejected'
                    ? 'bg-rose-500/20 border-rose-400/40 text-rose-200'
                    : 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                }`}
              >
                <span>Status: {verificationStatus}</span>
                {profile?.isVerifiedMentor && verificationStatus === 'Approved' && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-400/20 text-emerald-100">
                    ✓ Verified Mentor Badge Active
                  </span>
                )}
              </div>
            </div>

            {profile?.mentorReviewNote && (
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs space-y-1">
                <p className="font-mono text-[10px] uppercase text-cyan-300">Admin Review Note</p>
                <p className="text-white/80">{profile.mentorReviewNote}</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2">
            <GlassButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => navigate('/profile')}
            >
              Go to My Profile
            </GlassButton>
            <GlassButton
              type="button"
              variant="primary"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </GlassButton>
          </div>
        </GlassCard>
      </div>

      {/* Detailed Question Breakdown */}
      <GlassCard level={2} className="p-6 space-y-4">
        <h3 className="text-base font-bold text-white tracking-tight">
          Question-by-Question Breakdown ({questions.length} Questions)
        </h3>
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="p-4 rounded-xl glass-level-1 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-white/85">
                  Question {q.questionNumber} ({q.questionType})
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-md font-mono font-bold ${
                    !q.isAnswered
                      ? 'bg-amber-500/20 text-amber-200'
                      : q.isCorrect
                      ? 'bg-emerald-500/20 text-emerald-200'
                      : 'bg-rose-500/20 text-rose-200'
                  }`}
                >
                  {!q.isAnswered
                    ? 'Unanswered (0 pts)'
                    : q.isCorrect
                    ? `Correct (+${q.pointsEarned} pts)`
                    : 'Incorrect (0 pts)'}
                </span>
              </div>
              <p className="text-white font-medium">{q.questionText}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/10">
                  <span className="text-[10px] font-mono uppercase text-white/45 block">
                    Your Answer
                  </span>
                  <pre className="text-white/85 font-mono whitespace-pre-wrap mt-1">
                    {q.userAnswer || '(No answer submitted)'}
                  </pre>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-400/20">
                  <span className="text-[10px] font-mono uppercase text-emerald-300 block">
                    Reference Answer
                  </span>
                  <pre className="text-emerald-100 font-mono whitespace-pre-wrap mt-1">
                    {q.correctAnswer}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

// ============================================================================
// 10. CERTIFICATES PAGE (/certificates)
// ============================================================================
export const CertificatesPage: React.FC = () => {
  const { profile, catalogSkills, apiFetch, showToast } = useAuth();
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(
    profile?.learningSkills?.[0]?.name ||
      profile?.teachingSkills?.[0]?.name ||
      catalogSkills[0]?.name ||
      'Python'
  );
  const [claiming, setClaiming] = useState(false);

  const loadCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ certificates: CertificateItem[] }>('/api/certificates');
      setCertificates(data.certificates || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load certificates.', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, showToast]);

  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  const handleClaimCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaiming(true);
    try {
      const res = await apiFetch<{ certificate: CertificateItem; message: string }>(
        '/api/certificates/claim',
        {
          method: 'POST',
          body: JSON.stringify({
            skillName: selectedSkill,
            title: `Certificate of Skill Mastery – ${selectedSkill}`,
            certificateType: 'SKILL_COMPLETION',
          }),
        }
      );
      showToast(res.message || 'Certificate issued!', 'success');
      setClaimModalOpen(false);
      await loadCertificates();
      setSelectedCert(res.certificate);
    } catch (err: any) {
      showToast(err.message || 'Failed to issue certificate.', 'error');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <GlassCard level={2} className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-300">
            Verified Academic Credentials
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-0.5">
            My Certificates
          </h1>
          <p className="text-sm text-white/65 mt-1">
            View, verify, and download your earned SkillBridge certificates with unique Certificate IDs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <GlassButton
            type="button"
            variant="secondary"
            onClick={() => navigate('/verify-certificate')}
          >
            <ShieldCheck className="w-4 h-4 text-cyan-300" />
            <span>Verify Certificate ID</span>
          </GlassButton>
          <GlassButton
            type="button"
            variant="primary"
            onClick={() => setClaimModalOpen(true)}
          >
            <Award className="w-4 h-4" />
            <span>Generate Skill Certificate</span>
          </GlassButton>
        </div>
      </GlassCard>

      {loading ? (
        <LoadingSkeleton count={2} height="h-48" />
      ) : certificates.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No Certificates Earned Yet"
          description="Complete a skill learning track, pass a Mentor Skill Verification Test, or generate your first completed skill certificate."
          actionLabel="Generate Skill Certificate"
          onAction={() => setClaimModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <GlassCard
              key={cert.certificateId}
              level={2}
              interactive
              className="p-6 flex flex-col justify-between space-y-5 relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/35 text-emerald-200 text-xs font-mono font-bold inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{cert.verificationStatus}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-400/25 px-2.5 py-1 rounded-lg">
                    {cert.certificateId}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-violet-300">
                    {cert.skillName}
                  </p>
                  <h3 className="text-lg font-bold text-white mt-0.5 tracking-tight">
                    {cert.title}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-white/10">
                  <div>
                    <span className="text-white/45 block">Recipient Name</span>
                    <span className="font-semibold text-white">{cert.recipientName}</span>
                  </div>
                  <div>
                    <span className="text-white/45 block">Issue Date</span>
                    <span className="font-mono text-white">{cert.issueDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2.5 pt-4 border-t border-white/10">
                <GlassButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedCert(cert)}
                  className="flex-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Certificate</span>
                </GlassButton>
                <GlassButton
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => downloadCertificateAsPng(cert)}
                  className="flex-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Certificate</span>
                </GlassButton>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* View Certificate Modal */}
      <Modal
        open={Boolean(selectedCert)}
        onClose={() => setSelectedCert(null)}
        title="Official SkillBridge Certificate"
        maxWidth="max-w-3xl"
      >
        {selectedCert && (
          <div className="space-y-6">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-[#0B0B18] via-[#121226] to-[#091524] border-2 border-violet-400/45 shadow-2xl text-center space-y-5 relative overflow-hidden">
              <div className="flex items-center justify-center gap-2 text-cyan-300 font-mono text-xs uppercase tracking-widest">
                <SkillBridgeLogoIcon className="w-5 h-5" />
                <span>SkillBridge • Micro-Skill Exchange &amp; Peer Learning Platform</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                CERTIFICATE OF ACHIEVEMENT
              </h2>

              <p className="text-xs sm:text-sm text-white/60">
                This official academic credential is proudly presented to
              </p>

              <p className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-cyan-300 via-violet-300 to-indigo-200 bg-clip-text text-transparent py-1">
                {selectedCert.recipientName}
              </p>

              <p className="text-xs sm:text-sm text-white/75 max-w-lg mx-auto">
                for successfully demonstrating verified proficiency and mastery in
              </p>

              <div className="inline-block px-5 py-2 rounded-2xl bg-violet-500/20 border border-violet-400/40 text-violet-200 font-bold text-lg">
                {selectedCert.skillName}
              </div>

              <p className="text-sm font-semibold text-white/90">{selectedCert.title}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/15 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.04]">
                  <span className="text-white/45 font-mono uppercase text-[10px] block">
                    Certificate ID
                  </span>
                  <span className="font-mono font-bold text-emerald-300 mt-0.5 block">
                    {selectedCert.certificateId}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.04]">
                  <span className="text-white/45 font-mono uppercase text-[10px] block">
                    Verification Status
                  </span>
                  <span className="font-bold text-emerald-300 mt-0.5 block">
                    ✓ {selectedCert.verificationStatus}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.04]">
                  <span className="text-white/45 font-mono uppercase text-[10px] block">
                    Issue Date
                  </span>
                  <span className="font-mono font-bold text-white mt-0.5 block">
                    {selectedCert.issueDate}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <GlassButton
                type="button"
                variant="secondary"
                onClick={() =>
                  navigate(`/verify-certificate?id=${encodeURIComponent(selectedCert.certificateId)}`)
                }
              >
                <ShieldCheck className="w-4 h-4 text-cyan-300" />
                <span>Verify Certificate ID</span>
              </GlassButton>

              <div className="flex items-center gap-2.5">
                <GlassButton
                  type="button"
                  variant="secondary"
                  onClick={() => window.print()}
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </GlassButton>
                <GlassButton
                  type="button"
                  variant="primary"
                  onClick={() => downloadCertificateAsPng(selectedCert)}
                >
                  <Download className="w-4 h-4" />
                  <span>Download Certificate (PNG)</span>
                </GlassButton>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Claim / Issue Certificate Modal */}
      <Modal
        open={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        title="Generate Skill Completion Certificate"
      >
        <form onSubmit={handleClaimCertificate} className="space-y-4">
          <p className="text-xs text-white/65 leading-relaxed">
            Select a skill from your learning/teaching catalog to issue an official SkillBridge
            certificate with a unique <code className="text-cyan-300">SB-CERT-2026-XXXXXX</code> ID.
            Duplicate certificates for the same skill are automatically prevented.
          </p>

          <div>
            <label className="block text-xs font-medium text-white/75 mb-1.5">
              Select Skill / Course Name
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
            >
              {catalogSkills.map((sk) => (
                <option key={sk.id} value={sk.name} className="bg-[#12121A] text-white">
                  {sk.name} ({sk.categoryName})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <GlassButton
              type="button"
              variant="secondary"
              onClick={() => setClaimModalOpen(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" disabled={claiming}>
              {claiming ? 'Generating...' : 'Generate Certificate'}
            </GlassButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ============================================================================
// 11. PUBLIC / BUILT-IN CERTIFICATE VERIFICATION PAGE (/verify-certificate)
// ============================================================================
export const VerifyCertificatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [certIdInput, setCertIdInput] = useState(searchParams.get('id') || 'SB-CERT-2026-000101');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    certificate?: CertificateItem;
    message?: string;
  } | null>(null);

  const handleVerify = useCallback(async (idToVerify: string) => {
    const trimmed = idToVerify.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/certificates/verify/${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({
        valid: false,
        message: 'Error connecting to verification service.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialId = searchParams.get('id');
    if (initialId) {
      setCertIdInput(initialId);
      handleVerify(initialId);
    }
  }, [searchParams, handleVerify]);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <GlassCard level={2} className="p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/35 text-cyan-300 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-300">
              Credential Authenticity Registry
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Verify SkillBridge Certificate
            </h1>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-white/65 leading-relaxed">
          Enter a unique Certificate ID (for example:{' '}
          <button
            type="button"
            onClick={() => {
              setCertIdInput('SB-CERT-2026-000101');
              handleVerify('SB-CERT-2026-000101');
            }}
            className="font-mono text-cyan-300 underline hover:text-cyan-200"
          >
            SB-CERT-2026-000101
          </button>{' '}
          or{' '}
          <button
            type="button"
            onClick={() => {
              setCertIdInput('SB-CERT-2026-000102');
              handleVerify('SB-CERT-2026-000102');
            }}
            className="font-mono text-cyan-300 underline hover:text-cyan-200"
          >
            SB-CERT-2026-000102
          </button>
          ) to verify its authenticity in the database.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify(certIdInput);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              required
              value={certIdInput}
              onChange={(e) => setCertIdInput(e.target.value)}
              placeholder="e.g. SB-CERT-2026-000101"
              className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm font-mono uppercase"
            />
          </div>
          <GlassButton type="submit" variant="primary" disabled={loading}>
            <ShieldCheck className="w-4 h-4" />
            <span>{loading ? 'Verifying...' : 'Verify Certificate'}</span>
          </GlassButton>
        </form>
      </GlassCard>

      {result && (
        <GlassCard
          level={2}
          className={`p-6 sm:p-8 border ${
            result.valid && result.certificate
              ? 'border-emerald-400/40 bg-emerald-500/10'
              : 'border-rose-400/40 bg-rose-500/10'
          }`}
        >
          {result.valid && result.certificate ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Verified Authentic Certificate
                    </h3>
                    <p className="text-xs text-emerald-200">
                      This Certificate ID is registered and active in the SkillBridge database.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/25 border border-emerald-400/40 text-emerald-100 font-mono text-xs font-bold">
                  {result.certificate.certificateId}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl glass-level-1">
                  <span className="text-white/45 block">Recipient Name</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">
                    {result.certificate.recipientName}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl glass-level-1">
                  <span className="text-white/45 block">Skill / Course Name</span>
                  <span className="text-sm font-bold text-cyan-300 mt-0.5 block">
                    {result.certificate.skillName}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl glass-level-1">
                  <span className="text-white/45 block">Certificate Title</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">
                    {result.certificate.title}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl glass-level-1">
                  <span className="text-white/45 block">Issue Date &amp; Authority</span>
                  <span className="text-sm font-mono text-white mt-0.5 block">
                    {result.certificate.issueDate} • {result.certificate.issuedBy}
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <GlassButton
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => downloadCertificateAsPng(result.certificate!)}
                >
                  <Download className="w-4 h-4" />
                  <span>Download Verified Copy</span>
                </GlassButton>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-rose-200">
              <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-white">Invalid Certificate ID</h3>
                <p className="text-xs text-rose-200/85 mt-0.5">
                  {result.message || 'No verified certificate exists with this ID.'}
                </p>
              </div>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
};
