import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowRightLeft,
  Sparkles,
  Calendar,
  TrendingUp,
  Star,
  CheckCircle2,
  Mail,
  Lock,
  User,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  Terminal,
  GraduationCap,
  Award,
  Phone,
  Search,
  Briefcase,
  Globe,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  LiquidBackground,
  DeveloperCodeBackdrop,
  GlassCard,
  GlassButton,
} from '../components/ui/CommonUI.tsx';
import { SkillBridgeLogoIcon } from '../components/layout/AppLayout.tsx';

// 1. PUBLIC LANDING PAGE (DARK LIQUID GLASS)
export const LandingPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: ArrowRightLeft,
      title: 'Direct Micro-Skill Exchange',
      desc: 'Trade practical academic skills directly with fellow university peers—collaborative learning with zero tuition barriers.',
    },
    {
      icon: Sparkles,
      title: 'Rule-Based Peer Matching',
      desc: 'Deterministic compatibility engine (+50/+30/+10/+10) identifies ideal mutual skill exchange partners.',
    },
    {
      icon: Calendar,
      title: 'Structured Study Sessions',
      desc: 'Schedule 1-on-1 study sessions, record duration and session notes, and manage upcoming and completed classes.',
    },
    {
      icon: TrendingUp,
      title: 'Measurable Skill Progress',
      desc: 'Log completed topics, track proficiency progression from Beginner to Advanced, and complete learning goals.',
    },
    {
      icon: Star,
      title: 'Verified Peer Reviews',
      desc: 'Build a trusted campus mentoring portfolio with 5-star peer ratings and constructive session reviews.',
    },
    {
      icon: Terminal,
      title: 'Real-Time Peer Messaging',
      desc: 'Coordinate study plans, share code snippets, and prepare for sessions inside connected student chat rooms.',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Create your student profile',
      desc: 'Sign up with your university email, verify your account, and configure your academic department and availability.',
    },
    {
      num: '02',
      title: 'Add skills you can teach',
      desc: 'List programming, UI/UX design, data science, or academic skills you can mentor others in.',
    },
    {
      num: '03',
      title: 'Add skills you want to learn',
      desc: 'Select the practical skills and target proficiency levels you want to master this semester.',
    },
    {
      num: '04',
      title: 'Discover compatible peers',
      desc: 'Explore students ranked by our deterministic mutual exchange compatibility algorithm.',
    },
    {
      num: '05',
      title: 'Schedule learning sessions',
      desc: 'Connect with peers, coordinate in real-time chat, and book structured 1-on-1 study sessions.',
    },
    {
      num: '06',
      title: 'Track mastery & review',
      desc: 'Complete sessions, submit 5-star feedback, and watch your learning progress bars reach 100%.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#07070B] text-[#F5F5F7] flex flex-col relative overflow-x-hidden">
      <LiquidBackground />

      {/* Floating Glass Top Header */}
      <div className="sticky top-0 z-30 px-4 sm:px-8 pt-4">
        <header className="max-w-7xl mx-auto h-16 glass-level-2 rounded-2xl px-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600/40 via-indigo-600/35 to-cyan-500/35 border border-white/20 flex items-center justify-center">
              <SkillBridgeLogoIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">SkillBridge</span>
              <span className="hidden md:inline-block text-xs text-white/45 ml-2.5 pl-2.5 border-l border-white/15">
                Learn Together. Share Skills. Grow Together.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/prd"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-cyan-200 bg-cyan-500/10 border border-cyan-400/25 hover:bg-cyan-500/20 transition-colors"
            >
              Project PRD
            </Link>
            {profile ? (
              <GlassButton
                type="button"
                variant="primary"
                onClick={() => navigate('/dashboard')}
              >
                <span>Go to Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </GlassButton>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl btn-liquid-primary text-xs font-semibold"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </header>
      </div>

      {/* Hero + Visual Matching Architecture Split */}
      <section className="relative z-10 py-14 lg:py-22 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass-level-1 text-cyan-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Micro-Skill Exchange &amp; Peer Learning Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]">
              Exchange Skills.{' '}
              <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                Learn From Your Peers.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-white/65 max-w-2xl leading-relaxed">
              SkillBridge connects students who want to learn practical academic skills with peers
              who can teach them. Engineered for collaborative university learning, mutual skill
              exchange, and measurable mastery.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                to={profile ? '/dashboard' : '/register'}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl btn-liquid-primary text-sm font-semibold"
              >
                <span>Start Learning Exchange</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl btn-liquid-secondary text-sm font-semibold"
              >
                Sign In to Account
              </Link>
            </div>

            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-white/10 max-w-lg">
              <div>
                <p className="text-xl font-bold font-mono text-white">Rule-Based</p>
                <p className="text-xs text-white/50 mt-0.5">Compatibility Scoring</p>
              </div>
              <div>
                <p className="text-xl font-bold font-mono text-white">1-on-1</p>
                <p className="text-xs text-white/50 mt-0.5">Peer Study Sessions</p>
              </div>
              <div>
                <p className="text-xl font-bold font-mono text-cyan-300">100%</p>
                <p className="text-xs text-white/50 mt-0.5">Mutual Skill Exchange</p>
              </div>
            </div>
          </div>

          {/* Visual Explanation of Rule-Based Peer Matching */}
          <div className="lg:col-span-5">
            <GlassCard level={2} className="relative overflow-hidden p-6 space-y-5">
              <DeveloperCodeBackdrop variant="hero" />

              <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-300">
                    Rule-Based Matching Engine
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    Mutual Skill Exchange Matrix
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/35 text-emerald-200 text-xs font-mono font-bold">
                  90% Match
                </span>
              </div>

              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Student A */}
                <div className="p-3.5 rounded-xl glass-level-1 space-y-2.5">
                  <p className="text-xs font-bold text-white">Student A (You)</p>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-white/45 block">
                        Can Teach
                      </span>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-lg bg-violet-500/20 text-violet-200 border border-violet-400/30 font-medium">
                        UI/UX Design
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-white/45 block">
                        Wants To Learn
                      </span>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 font-medium">
                        Python
                      </span>
                    </div>
                  </div>
                </div>

                {/* Student B */}
                <div className="p-3.5 rounded-xl glass-level-1 space-y-2.5">
                  <p className="text-xs font-bold text-white">Rahul Sharma (Peer)</p>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-white/45 block">
                        Can Teach
                      </span>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-400/35 font-medium">
                        Python
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase text-white/45 block">
                        Wants To Learn
                      </span>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-400/35 font-medium">
                        UI/UX Design
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scoring Formula Breakdown */}
              <div className="relative z-10 p-4 rounded-xl bg-[#0B0B12]/90 border border-white/10 space-y-2 text-xs">
                <p className="font-mono text-white/50 uppercase tracking-wider text-[10px]">
                  Compatibility Score Calculation
                </p>
                <div className="flex justify-between">
                  <span className="text-white/75">Rahul teaches Python (you want to learn)</span>
                  <span className="font-mono font-bold text-emerald-400">+50 pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/75">You teach UI/UX (Rahul wants to learn)</span>
                  <span className="font-mono font-bold text-emerald-400">+30 pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/75">Overlapping Schedule Availability</span>
                  <span className="font-mono font-bold text-cyan-300">+10 pts</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between font-bold text-sm">
                  <span className="text-white">Total Mutual Exchange Score</span>
                  <span className="font-mono text-emerald-300">90% Match</span>
                </div>
              </div>

              <div className="relative z-10 p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/25 space-y-1 text-xs text-emerald-200">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>&ldquo;You can learn Python from Rahul.&rdquo;</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>&ldquo;Rahul can learn UI/UX from you.&rdquo;</span>
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Core Platform Capabilities */}
      <section className="relative z-10 py-14 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-2xl mb-10">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-300">
            Platform Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1 tracking-tight">
            Built Specifically for Peer Skill Exchange
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <GlassCard key={i} level={2} interactive className="p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/25 to-cyan-500/20 border border-white/15 text-cyan-300 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">{f.title}</h3>
                  <p className="text-xs sm:text-sm text-white/60 mt-2 leading-relaxed">{f.desc}</p>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* Step-by-Step Workflow */}
      <section className="relative z-10 py-14 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-2xl mb-10">
          <span className="text-xs font-mono uppercase tracking-wider text-violet-300">
            Step-by-Step Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1 tracking-tight">
            How SkillBridge Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {steps.map((s) => (
            <GlassCard key={s.num} level={1} interactive className="p-6">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white/[0.06] text-cyan-300 border border-white/12">
                Step {s.num}
              </span>
              <h3 className="text-base font-bold text-white mt-4 tracking-tight">{s.title}</h3>
              <p className="text-xs sm:text-sm text-white/60 mt-1.5 leading-relaxed">{s.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mt-auto border-t border-white/10 bg-[#07070B]/80 backdrop-blur-md py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <div className="flex items-center gap-2.5 text-white font-semibold">
            <SkillBridgeLogoIcon className="w-4 h-4" />
            <span>SkillBridge – Micro-Skill Exchange &amp; Peer Learning Platform</span>
          </div>
          <p>Academic Peer Learning Network • Learn Together. Share Skills. Grow Together.</p>
        </div>
      </footer>
    </div>
  );
};

// 2. LOGIN PAGE (LIQUID GLASS)
export const LoginPage: React.FC = () => {
  const { signInWithGoogle, loginWithEmail } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUnverifiedEmail(null);

    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await loginWithEmail(email.trim(), password);
      if (result.requiresVerification) {
        setUnverifiedEmail(result.email || email.trim());
        setError('Your email address has not been verified yet.');
      } else if (result.profile) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSubmitting(true);
    try {
      const prof = await signInWithGoogle();
      if (prof) navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070B] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <LiquidBackground />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600/40 to-cyan-500/40 border border-white/20 flex items-center justify-center">
            <SkillBridgeLogoIcon className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">SkillBridge</span>
        </Link>
        <h2 className="mt-4 text-center text-2xl font-bold text-white tracking-tight">
          Sign in to your student workspace
        </h2>
        <p className="mt-1 text-center text-xs text-white/55">
          Learn Together. Share Skills. Grow Together.
        </p>
      </div>

      <div className="relative z-10 mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <GlassCard level={2} className="py-8 px-6 sm:px-8 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-400/30 text-xs text-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              {unverifiedEmail && (
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-rose-200/80">Need to verify {unverifiedEmail}?</span>
                  <GlassButton
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => navigate('/verify-email')}
                  >
                    Verify Email Now
                  </GlassButton>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            disabled={submitting}
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 rounded-xl btn-liquid-secondary text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
              />
            </svg>
            <span>Continue with Google Account</span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-[#12121A] px-3 text-white/45 font-mono">
                Or sign in with email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/75 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-white/75">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-cyan-300 hover:text-cyan-200"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl btn-liquid-primary text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-white/55 pt-2 border-t border-white/10">
            Don&apos;t have an account yet?{' '}
            <Link to="/register" className="font-semibold text-cyan-300 hover:text-cyan-200">
              Create student account
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
};

// 3. REGISTER PAGE (LIQUID GLASS)
export const RegisterPage: React.FC = () => {
  const { registerWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await registerWithEmail(fullName.trim(), email.trim(), password);
      navigate('/verify-email');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setSubmitting(true);
    try {
      const prof = await signInWithGoogle();
      if (prof) navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070B] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <LiquidBackground />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600/40 to-cyan-500/40 border border-white/20 flex items-center justify-center">
            <SkillBridgeLogoIcon className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">SkillBridge</span>
        </Link>
        <h2 className="mt-4 text-center text-2xl font-bold text-white tracking-tight">
          Create your Student Account
        </h2>
        <p className="mt-1 text-center text-xs text-white/55">
          Join the campus micro-skill exchange network
        </p>
      </div>

      <div className="relative z-10 mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <GlassCard level={2} className="py-8 px-6 sm:px-8 space-y-6">
          {/* Role Selection Options: Sign Up as a Learner / Sign Up as a Mentor */}
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-cyan-300 text-center">
              Choose How You Want to Join SkillBridge
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => navigate('/register/learner')}
                className="group p-4 rounded-2xl glass-level-1 hover:border-cyan-400/50 border border-white/15 text-left transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/35 text-cyan-300 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-200">
                    Sign Up as a Learner
                  </h3>
                  <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
                    Select skills you want to learn, set your career goal, and connect with verified mentors.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/register/mentor')}
                className="group p-4 rounded-2xl glass-level-1 hover:border-violet-400/50 border border-white/15 text-left transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-400/35 text-violet-300 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-violet-300 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-violet-200">
                    Sign Up as a Mentor
                  </h3>
                  <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
                    Choose skills you teach, pass the Skill Verification Test, and earn a Verified Mentor badge.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/30 text-xs text-rose-200 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            disabled={submitting}
            onClick={handleGoogle}
            className="w-full py-2.5 px-4 rounded-xl btn-liquid-secondary text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5"
          >
            <span>Sign up with Google (Instant Verification)</span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-[#12121A] px-3 text-white/45 font-mono">
                Or register with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/75 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Aarav Mehta"
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/75 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/75 mb-1.5">
                Password (min. 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/75 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl btn-liquid-primary text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? 'Creating Account...' : 'Create Account & Verify Email'}
            </button>
          </form>

          <p className="text-center text-xs text-white/55 pt-2 border-t border-white/10">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">
              Sign In
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
};

// 4. VERIFY EMAIL PAGE (LIQUID GLASS)
export const VerifyEmailPage: React.FC = () => {
  const { pendingVerification, verifyEmailCode, resendVerificationCode } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(pendingVerification?.email || '');
  const [code, setCode] = useState(pendingVerification?.codePreview || '');
  const [previewCode, setPreviewCode] = useState(pendingVerification?.codePreview || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !code.trim()) {
      setError('Please enter your email and the 6-digit verification code.');
      return;
    }
    setSubmitting(true);
    try {
      await verifyEmailCode(email.trim(), code.trim());
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Please enter your email address first.');
      return;
    }
    setResending(true);
    setError('');
    try {
      const nextCode = await resendVerificationCode(email.trim());
      if (nextCode) {
        setPreviewCode(nextCode);
        setCode(nextCode);
      }
    } catch (err: any) {
      setError(err.message || 'Could not resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070B] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <LiquidBackground />
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <GlassCard level={2} className="py-8 px-6 sm:px-8 space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-400/30 text-violet-300 flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6" />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold text-white tracking-tight">Check your email</h2>
            <p className="text-xs text-white/55 mt-1 leading-relaxed">
              We sent a 6-digit email verification code to activate your SkillBridge account.
              Workspace access requires a verified student email.
            </p>
          </div>

          {previewCode && (
            <div className="p-3.5 rounded-xl bg-indigo-500/15 border border-indigo-400/30 text-xs text-indigo-100 space-y-1">
              <p className="font-mono text-cyan-300 uppercase tracking-wider text-[10px]">
                Academic Dispatch Preview (Verification Email)
              </p>
              <p>
                Your verification code for <strong>{email}</strong> is:{' '}
                <span className="font-mono font-bold text-sm bg-black/40 px-2 py-0.5 rounded-md border border-white/20 text-emerald-300">
                  {previewCode}
                </span>
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/30 text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/75 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/75 mb-1.5">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm font-mono tracking-widest text-center font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl btn-liquid-primary text-sm font-semibold"
            >
              {submitting ? 'Verifying...' : 'Verify Email & Enter SkillBridge'}
            </button>
          </form>

          <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
            <button
              type="button"
              disabled={resending}
              onClick={handleResend}
              className="inline-flex items-center gap-1.5 font-semibold text-cyan-300 hover:text-cyan-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>{resending ? 'Sending...' : 'Resend verification email'}</span>
            </button>
            <Link to="/login" className="text-white/50 hover:text-white font-medium">
              Back to Login
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

// 5. FORGOT PASSWORD PAGE (LIQUID GLASS)
export const ForgotPasswordPage: React.FC = () => {
  const { showToast } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [resetData, setResetData] = useState<{ email: string; code: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset email.');
      showToast('Password reset email sent!', 'info');
      setResetData({
        email: data.email,
        code: data.resetCodePreview || '',
      });
    } catch (err: any) {
      setError(err.message || 'Could not send reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070B] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <LiquidBackground />
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <GlassCard level={2} className="py-8 px-6 sm:px-8 space-y-5">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white tracking-tight">Forgot your password?</h2>
            <p className="text-xs text-white/55 mt-1">
              Enter your registered email address and we&apos;ll send you a password reset link.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/30 text-xs text-rose-200">
              {error}
            </div>
          )}

          {resetData ? (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password Reset Email Sent!</span>
              </div>
              <p className="text-white/75 leading-relaxed">
                We sent a password reset link to <strong className="text-white">{resetData.email}</strong>.
                Click the reset link below to create your new password:
              </p>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/reset-password?email=${encodeURIComponent(
                      resetData.email
                    )}&code=${encodeURIComponent(resetData.code)}`
                  )
                }
                className="w-full py-2.5 px-4 rounded-xl btn-liquid-primary text-xs font-semibold flex items-center justify-center gap-2"
              >
                <span>Open Password Reset Link</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/75 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl btn-liquid-primary text-sm font-semibold"
              >
                {submitting ? 'Sending...' : 'Send Reset Instructions'}
              </button>
            </form>
          )}

          <div className="text-center pt-2 border-t border-white/10">
            <Link to="/login" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
              Return to Sign In
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

// 6. RESET PASSWORD PAGE (LIQUID GLASS)
export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { showToast } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !code.trim() || !newPassword) {
      setError('All fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password.');
      showToast('Password updated! Please log in with your new password.', 'success');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070B] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <LiquidBackground />
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <GlassCard level={2} className="py-8 px-6 sm:px-8 space-y-5">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white tracking-tight">Reset Your Password</h2>
            <p className="text-xs text-white/55 mt-1">
              Enter your reset code and choose a new password.
            </p>
          </div>

          {searchParams.get('code') && (
            <div className="p-3 rounded-xl bg-indigo-500/15 border border-indigo-400/30 text-xs text-indigo-100">
              Reset Code Dispatched:{' '}
              <strong className="font-mono text-emerald-300">{searchParams.get('code')}</strong>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/30 text-xs text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/75 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/75 mb-1.5">Reset Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/75 mb-1.5">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/75 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl btn-liquid-primary text-sm font-semibold"
            >
              {submitting ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

// 7. FRIENDLY ERROR PAGES (404 / 403 / 500)
export const ErrorPage: React.FC<{ code?: '404' | '403' | '500' }> = ({ code = '404' }) => {
  const navigate = useNavigate();
  const details = {
    '404': {
      title: 'Page Not Found',
      desc: 'The page or academic resource you are looking for does not exist or has been moved.',
    },
    '403': {
      title: 'Access Denied',
      desc: 'You do not have permission to view this page.',
    },
    '500': {
      title: 'Server Error',
      desc: 'Something went wrong while processing your request. Please try again.',
    },
  }[code];

  return (
    <div className="min-h-screen bg-[#07070B] text-white flex items-center justify-center p-6 relative overflow-hidden">
      <LiquidBackground />
      <GlassCard level={3} className="relative z-10 p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-400/30 text-violet-300 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
          Error {code}
        </span>
        <h1 className="text-2xl font-bold text-white mt-1 tracking-tight">{details.title}</h1>
        <p className="text-sm text-white/60 mt-2">{details.desc}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <GlassButton
            type="button"
            variant="primary"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </GlassButton>
          <GlassButton
            type="button"
            variant="secondary"
            onClick={() => navigate('/')}
          >
            Home
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};

const QUALIFICATION_OPTIONS = [
  '10th',
  '12th',
  'Diploma',
  'Graduation',
  'Post Graduation',
  'PhD',
  'Other',
];

const CAREER_GOAL_OPTIONS = [
  'Web Developer',
  'Full Stack Developer',
  'Software Developer',
  'App Developer',
  'Data Analyst',
  'Data Scientist',
  'AI/ML Developer',
  'UI/UX Designer',
  'Cybersecurity',
  'Other',
];

// 8. SIGN UP AS LEARNER PAGE (/register/learner)
export const LearnerRegisterPage: React.FC = () => {
  const { registerWithEmail, catalogSkills } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qualification, setQualification] = useState('Graduation');
  const [careerGoal, setCareerGoal] = useState('Full Stack Developer');
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [projectsUrl, setProjectsUrl] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredSkills = catalogSkills.filter(
    (s) =>
      s.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
      s.categoryName.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const toggleSkill = (id: number) => {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleRegister = async (skipOptional = false) => {
    setError('');

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword || !phoneNumber.trim()) {
      setError('Full Name, Email, Password, Confirm Password, and Phone Number are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!qualification) {
      setError('Please select your qualification.');
      return;
    }
    if (selectedSkillIds.length === 0) {
      setError('Please select at least one skill you want to learn.');
      return;
    }
    if (!careerGoal) {
      setError('Please select your career goal.');
      return;
    }

    setSubmitting(true);
    try {
      await registerWithEmail(fullName.trim(), email.trim(), password, {
        accountType: 'LEARNER',
        phoneNumber: phoneNumber.trim(),
        qualification,
        careerGoal,
        learningSkillIds: selectedSkillIds,
        githubUrl: skipOptional ? '' : githubUrl.trim(),
        linkedinUrl: skipOptional ? '' : linkedinUrl.trim(),
        projectsUrl: skipOptional ? '' : projectsUrl.trim(),
        autoLogin: true,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Learner registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070B] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <LiquidBackground />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-2xl">
        <Link to="/" className="flex items-center justify-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600/40 to-cyan-500/40 border border-white/20 flex items-center justify-center">
            <SkillBridgeLogoIcon className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">SkillBridge</span>
        </Link>
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Learner Registration</span>
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Sign Up as a Learner
          </h2>
          <p className="mt-1 text-xs text-white/55">
            Configure your learning profile, select target skills, and define your career goal
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-6 sm:mx-auto sm:w-full sm:max-w-2xl">
        <GlassCard level={2} className="py-8 px-6 sm:px-8 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-400/30 text-xs text-rose-200 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRegister(false);
            }}
            className="space-y-6"
          >
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-300 border-b border-white/10 pb-2">
                1. Basic Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Aarav Mehta"
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1.5">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/75 mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="learner@university.edu"
                    className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Qualification & Career Goal */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-300 border-b border-white/10 pb-2">
                2. Qualification &amp; Career Goal
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1.5">
                    Qualification *
                  </label>
                  <select
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                  >
                    {QUALIFICATION_OPTIONS.map((q) => (
                      <option key={q} value={q} className="bg-[#12121A] text-white">
                        {q}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1.5">
                    What is your goal? *
                  </label>
                  <select
                    value={careerGoal}
                    onChange={(e) => setCareerGoal(e.target.value)}
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                  >
                    {CAREER_GOAL_OPTIONS.map((goal) => (
                      <option key={goal} value={goal} className="bg-[#12121A] text-white">
                        {goal}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Choose Skills You Want to Learn */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-300">
                  3. Choose Skills You Want to Learn *
                </h3>
                <span className="text-xs text-white/55 font-mono">
                  {selectedSkillIds.length} selected
                </span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  placeholder="Search skills (e.g. Python, React, SQL, UI/UX)..."
                  className="glass-input w-full pl-10 pr-4 py-2 rounded-xl text-xs"
                />
              </div>

              <div className="max-h-48 overflow-y-auto p-3 rounded-xl glass-level-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredSkills.map((sk) => {
                  const active = selectedSkillIds.includes(sk.id);
                  return (
                    <button
                      key={sk.id}
                      type="button"
                      onClick={() => toggleSkill(sk.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-all flex items-center justify-between gap-1.5 border ${
                        active
                          ? 'bg-cyan-500/25 border-cyan-400/50 text-cyan-100'
                          : 'bg-white/[0.03] border-white/10 text-white/70 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className="truncate">{sk.name}</span>
                      {active && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Professional Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-white/60">
                  4. Optional Professional Information (Can Skip)
                </h3>
                <span className="text-[11px] text-white/45">Optional</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    GitHub Profile
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    LinkedIn Profile
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Projects Link
                  </label>
                  <input
                    type="url"
                    value={projectsUrl}
                    onChange={(e) => setProjectsUrl(e.target.value)}
                    placeholder="https://portfolio.dev"
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl btn-liquid-primary text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? 'Creating Learner Profile...' : 'Complete Learner Registration'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleRegister(true)}
                className="w-full sm:w-auto py-3 px-4 rounded-xl btn-liquid-secondary text-xs font-semibold text-white/80 hover:text-white"
              >
                Skip Optional &amp; Register
              </button>
            </div>
          </form>

          <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-white/55">
            <Link to="/register" className="text-cyan-300 hover:text-cyan-200 font-medium">
              &larr; Back to Role Selection
            </Link>
            <Link to="/login" className="text-white/70 hover:text-white font-medium">
              Already have an account? Sign In
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

// 9. SIGN UP AS MENTOR PAGE (/register/mentor)
export const MentorRegisterPage: React.FC = () => {
  const { registerWithEmail, catalogSkills } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qualification, setQualification] = useState('Graduation');
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [experienceYears, setExperienceYears] = useState('2 Years');
  const [experienceDescription, setExperienceDescription] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [projectsUrl, setProjectsUrl] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredSkills = catalogSkills.filter(
    (s) =>
      s.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
      s.categoryName.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const toggleSkill = (id: number) => {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword || !phoneNumber.trim()) {
      setError('Full Name, Email, Password, Confirm Password, and Phone Number are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (selectedSkillIds.length === 0) {
      setError('Please choose at least one skill you want to teach.');
      return;
    }
    if (!experienceYears.trim() || !experienceDescription.trim()) {
      setError('Please provide your years of experience and a short description.');
      return;
    }
    if (!githubUrl.trim() || !linkedinUrl.trim() || !projectsUrl.trim()) {
      setError('GitHub Profile, LinkedIn Profile, and Projects/Portfolio links are required for Mentor verification.');
      return;
    }

    setSubmitting(true);
    try {
      await registerWithEmail(fullName.trim(), email.trim(), password, {
        accountType: 'MENTOR',
        phoneNumber: phoneNumber.trim(),
        qualification,
        teachingSkillIds: selectedSkillIds,
        experienceYears: experienceYears.trim(),
        experienceDescription: experienceDescription.trim(),
        githubUrl: githubUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        projectsUrl: projectsUrl.trim(),
        autoLogin: true,
      });
      navigate('/mentor/verify-skills');
    } catch (err: any) {
      setError(err.message || 'Mentor registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070B] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <LiquidBackground />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-2xl">
        <Link to="/" className="flex items-center justify-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600/40 to-cyan-500/40 border border-white/20 flex items-center justify-center">
            <SkillBridgeLogoIcon className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">SkillBridge</span>
        </Link>
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/35 text-violet-200 text-xs font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>Mentor Registration</span>
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Sign Up as a Mentor
          </h2>
          <p className="mt-1 text-xs text-white/55">
            Register your teaching skills, experience, and portfolio to proceed to Skill Verification
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-6 sm:mx-auto sm:w-full sm:max-w-2xl">
        <GlassCard level={2} className="py-8 px-6 sm:px-8 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-400/30 text-xs text-rose-200 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Basic Information */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-violet-300 border-b border-white/10 pb-2">
                1. Basic Information &amp; Qualification
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr.Vikram Rao / Riya Sen"
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1.5">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mentor@university.edu"
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1.5">
                    Qualification *
                  </label>
                  <select
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                  >
                    {QUALIFICATION_OPTIONS.map((q) => (
                      <option key={q} value={q} className="bg-[#12121A] text-white">
                        {q}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Choose Skills You Want to Teach */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-violet-300">
                  2. Choose Skills You Want to Teach *
                </h3>
                <span className="text-xs text-white/55 font-mono">
                  {selectedSkillIds.length} selected
                </span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  placeholder="Search teaching skills (e.g. JavaScript, Python, React, SQL)..."
                  className="glass-input w-full pl-10 pr-4 py-2 rounded-xl text-xs"
                />
              </div>

              <div className="max-h-48 overflow-y-auto p-3 rounded-xl glass-level-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredSkills.map((sk) => {
                  const active = selectedSkillIds.includes(sk.id);
                  return (
                    <button
                      key={sk.id}
                      type="button"
                      onClick={() => toggleSkill(sk.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-all flex items-center justify-between gap-1.5 border ${
                        active
                          ? 'bg-violet-500/25 border-violet-400/50 text-violet-100'
                          : 'bg-white/[0.03] border-white/10 text-white/70 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className="truncate">{sk.name}</span>
                      {active && <CheckCircle2 className="w-3.5 h-3.5 text-violet-300 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Experience */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-violet-300 border-b border-white/10 pb-2">
                3. Teaching &amp; Technical Experience *
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1.5">
                    Years of Experience *
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      placeholder="e.g. 2 Years"
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-white/75 mb-1.5">
                    Short Description of Experience *
                  </label>
                  <input
                    type="text"
                    required
                    value={experienceDescription}
                    onChange={(e) => setExperienceDescription(e.target.value)}
                    placeholder="e.g. Built full-stack web apps & mentored 30+ juniors in React and Python"
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 4. Professional Information */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-violet-300 border-b border-white/10 pb-2">
                4. Professional &amp; Portfolio Links *
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1">
                    GitHub Profile *
                  </label>
                  <div className="relative">
                    <Globe className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="url"
                      required
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username"
                      className="glass-input w-full pl-8 pr-3 py-2 rounded-xl text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1">
                    LinkedIn Profile *
                  </label>
                  <div className="relative">
                    <Globe className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="url"
                      required
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="glass-input w-full pl-8 pr-3 py-2 rounded-xl text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/75 mb-1">
                    Projects / Portfolio Link *
                  </label>
                  <div className="relative">
                    <Globe className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="url"
                      required
                      value={projectsUrl}
                      onChange={(e) => setProjectsUrl(e.target.value)}
                      placeholder="https://portfolio.dev"
                      className="glass-input w-full pl-8 pr-3 py-2 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-5 rounded-xl btn-liquid-primary text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>
                {submitting
                  ? 'Creating Mentor Profile...'
                  : 'Complete Mentor Registration & Proceed to Skill Test'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-white/55">
            <Link to="/register" className="text-cyan-300 hover:text-cyan-200 font-medium">
              &larr; Back to Role Selection
            </Link>
            <Link to="/login" className="text-white/70 hover:text-white font-medium">
              Already have an account? Sign In
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
