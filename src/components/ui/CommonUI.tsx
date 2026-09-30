import React from 'react';
import {
  Star,
  X,
  Search,
  AlertCircle,
  Inbox,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  CheckCircle2,
  ArrowRightLeft,
  Clock,
  Terminal,
} from 'lucide-react';
import { PeerProfile, SkillEntry } from '../../types.ts';

// ============================================================================
// LIQUID GLASS BACKGROUND & DEVELOPER CODE VISUAL BACKDROP
// ============================================================================

export const LiquidBackground: React.FC = () => (
  <div
    className="fixed inset-0 pointer-events-none overflow-hidden z-0"
    aria-hidden="true"
  >
    {/* Deep Charcoal Base */}
    <div className="absolute inset-0 bg-[#07070B]" />

    {/* Blob 1: Deep Purple / Indigo */}
    <div
      className="liquid-blob-1 absolute -top-36 -left-36 w-[540px] h-[540px] rounded-full opacity-25 blur-[130px]"
      style={{
        background: 'radial-gradient(circle, #6D28D9 0%, #4F46E5 55%, transparent 75%)',
      }}
    />

    {/* Blob 2: Cyan / Electric Blue */}
    <div
      className="liquid-blob-2 absolute top-1/4 -right-44 w-[500px] h-[500px] rounded-full opacity-20 blur-[140px]"
      style={{
        background: 'radial-gradient(circle, #06B6D4 0%, #2563EB 60%, transparent 75%)',
      }}
    />

    {/* Blob 3: Magenta / Violet */}
    <div
      className="liquid-blob-1 absolute -bottom-48 left-1/3 w-[560px] h-[560px] rounded-full opacity-15 blur-[150px]"
      style={{
        background: 'radial-gradient(circle, #C026D3 0%, #6D28D9 60%, transparent 75%)',
      }}
    />

    {/* Subtle Developer Grid Overlay */}
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    />
  </div>
);

export const DeveloperCodeBackdrop: React.FC<{ variant?: 'hero' | 'panel' }> = ({
  variant = 'panel',
}) => (
  <div
    className={`pointer-events-none select-none overflow-hidden absolute inset-0 rounded-2xl ${
      variant === 'hero' ? 'opacity-[0.11]' : 'opacity-[0.065]'
    }`}
    aria-hidden="true"
  >
    <div className="absolute right-4 top-3 font-mono text-[10px] leading-relaxed text-cyan-300/80 space-y-0.5 text-right">
      <p>{`const match = computeExchange(studentA, peerB);`}</p>
      <p>{`// +50 teachMatch | +30 mutual | +10 category | +10 slot`}</p>
      <p>{`SELECT s.name, u.level FROM user_teaching_skills u`}</p>
      <p>{`INNER JOIN skills s ON s.id = u.skill_id;`}</p>
    </div>
  </div>
);

// ============================================================================
// CORE LIQUID GLASS DESIGN SYSTEM PRIMITIVES
// ============================================================================

export const GlassCard: React.FC<{
  level?: 1 | 2 | 3;
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ level = 2, interactive = false, className = '', children, onClick }) => {
  const levelClass =
    level === 1 ? 'glass-level-1' : level === 3 ? 'glass-level-3' : 'glass-level-2';
  const hoverClass = interactive ? 'glass-interactive' : '';

  return (
    <div
      onClick={onClick}
      className={`${levelClass} ${hoverClass} rounded-2xl ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const GlassPanel = GlassCard;

export const GlassButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
  }
> = ({ variant = 'primary', size = 'md', className = '', children, ...props }) => {
  const vClass =
    variant === 'secondary'
      ? 'btn-liquid-secondary'
      : variant === 'danger'
      ? 'btn-liquid-danger'
      : 'btn-liquid-primary';

  const sClass =
    size === 'sm'
      ? 'px-3 py-1.5 text-xs rounded-xl'
      : size === 'lg'
      ? 'px-6 py-3 text-sm rounded-2xl'
      : 'px-4 py-2.5 text-xs rounded-xl';

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold disabled:opacity-45 disabled:pointer-events-none ${vClass} ${sClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const GlassInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className = '',
  ...props
}) => (
  <input
    className={`glass-input w-full px-3.5 py-2.5 rounded-xl text-sm ${className}`}
    {...props}
  />
);

export const GlassProgress: React.FC<{
  value: number;
  size?: 'sm' | 'md';
  accent?: 'indigo' | 'cyan' | 'emerald' | 'purple';
}> = ({ value, size = 'md', accent = 'indigo' }) => {
  const clamped = Math.max(0, Math.min(100, value));
  const hClass = size === 'sm' ? 'h-1.5' : 'h-2.5';
  const gradMap = {
    indigo: 'from-violet-500 via-indigo-500 to-cyan-400',
    cyan: 'from-cyan-500 to-blue-500',
    emerald: 'from-emerald-500 to-teal-400',
    purple: 'from-purple-500 via-fuchsia-500 to-indigo-500',
  };

  return (
    <div
      className={`w-full ${hClass} rounded-full bg-white/[0.06] border border-white/[0.08] overflow-hidden`}
    >
      <div
        className={`h-full rounded-full bg-gradient-to-r ${gradMap[accent]} transition-all duration-500`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};

export const GlassStatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.FC<{ className?: string }>;
  accent?: 'blue' | 'purple' | 'cyan' | 'emerald' | 'amber' | 'rose';
  onClick?: () => void;
}> = ({ label, value, sub, icon: Icon, accent = 'purple', onClick }) => {
  const accentStyles = {
    blue: 'from-blue-500/20 to-indigo-500/5 text-blue-300 border-blue-400/25',
    purple: 'from-purple-500/20 to-indigo-500/5 text-purple-300 border-purple-400/25',
    cyan: 'from-cyan-500/20 to-blue-500/5 text-cyan-300 border-cyan-400/25',
    emerald: 'from-emerald-500/20 to-teal-500/5 text-emerald-300 border-emerald-400/25',
    amber: 'from-amber-500/20 to-orange-500/5 text-amber-300 border-amber-400/25',
    rose: 'from-rose-500/20 to-red-500/5 text-rose-300 border-rose-400/25',
  }[accent];

  return (
    <GlassCard
      level={2}
      interactive={Boolean(onClick)}
      onClick={onClick}
      className="p-4 sm:p-5 flex flex-col justify-between text-left"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-medium text-white/60 tracking-tight">{label}</span>
        {Icon && (
          <div
            className={`w-8 h-8 rounded-xl bg-gradient-to-br ${accentStyles} border flex items-center justify-center shrink-0`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white tracking-tight font-mono">{value}</p>
        {sub && <p className="text-[11px] text-white/45 mt-1">{sub}</p>}
      </div>
    </GlassCard>
  );
};

// ============================================================================
// REUSABLE APPLICATION COMPONENTS (LIQUID GLASS REDESIGN)
// ============================================================================

// 1. Avatar / GlassAvatar
export const Avatar: React.FC<{
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ name, src, size = 'md' }) => {
  const [imgError, setImgError] = React.useState(false);
  const initials = (name || 'Student')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const dims =
    size === 'sm'
      ? 'w-8 h-8 text-xs'
      : size === 'lg'
      ? 'w-14 h-14 text-base'
      : size === 'xl'
      ? 'w-20 h-20 text-xl'
      : 'w-10 h-10 text-xs';

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgError(true)}
        className={`${dims} rounded-full object-cover border border-white/20 shrink-0 bg-[#171722] shadow-sm`}
      />
    );
  }

  return (
    <div
      className={`${dims} rounded-full bg-gradient-to-br from-violet-600/80 via-indigo-600/80 to-cyan-600/80 text-white font-bold flex items-center justify-center shrink-0 border border-white/25 shadow-sm`}
    >
      {initials}
    </div>
  );
};

export const GlassAvatar = Avatar;

// 2. SkillBadge / GlassBadge
export const SkillBadge: React.FC<{
  name: string;
  level?: string;
  variant?: 'teach' | 'learn' | 'neutral' | 'match';
  onRemove?: () => void;
}> = ({ name, level, variant = 'neutral', onRemove }) => {
  const styleMap = {
    teach:
      'bg-violet-500/15 text-violet-200 border-violet-400/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
    learn:
      'bg-cyan-500/15 text-cyan-200 border-cyan-400/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
    match:
      'bg-emerald-500/20 text-emerald-200 border-emerald-400/35 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',
    neutral: 'bg-white/[0.06] text-white/80 border-white/12',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border backdrop-blur-md ${styleMap[variant]}`}
    >
      <span>{name}</span>
      {level && (
        <span className="text-[10px] font-mono opacity-75 border-l border-white/20 pl-1.5">
          {level}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 text-white/50 hover:text-rose-400 transition-colors"
          title="Remove skill"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

export const GlassBadge = SkillBadge;

// 3. Circular / Ring MatchScore Indicator
export const MatchScore: React.FC<{
  score: number;
  isMutual?: boolean;
  onClick?: () => void;
  showRing?: boolean;
}> = ({ score, isMutual, onClick, showRing = true }) => {
  const label =
    score >= 85
      ? 'Excellent Match'
      : score >= 60
      ? 'Strong Match'
      : score >= 40
      ? 'Compatible'
      : 'Potential';

  const strokeColor =
    score >= 80 ? '#34d399' : score >= 50 ? '#818cf8' : '#38bdf8';

  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl glass-level-1 border border-white/15 text-left transition-all ${
        onClick ? 'hover:border-white/30 cursor-pointer' : 'cursor-default'
      }`}
      title="Rule-based compatibility score"
    >
      {showRing ? (
        <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
          <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-[10px] font-mono font-bold text-white">{score}%</span>
        </div>
      ) : (
        <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
      )}

      <div className=" leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-white">{score}% Match</span>
          {isMutual && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-mono uppercase tracking-wider bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 px-1.5 py-0.5 rounded-md">
              <ArrowRightLeft className="w-2.5 h-2.5" /> Mutual
            </span>
          )}
        </div>
        <span className="text-[10px] text-white/55 block">{label}</span>
      </div>
    </button>
  );
};

// 4. RatingStars (Lucide Star Icons Only - Zero Emoji)
export const RatingStars: React.FC<{
  rating: number;
  count?: number;
  interactive?: boolean;
  onChange?: (val: number) => void;
  size?: 'sm' | 'md';
}> = ({ rating, count, interactive = false, onChange, size = 'sm' }) => {
  const iconSize = size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5';

  if (interactive) {
    return (
      <div className="inline-flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange && onChange(star)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
          >
            <Star
              className={`${iconSize} ${
                star <= rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-white/25 hover:text-amber-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-white/85">
      <Star className={`${iconSize} fill-amber-400 text-amber-400`} />
      <span className="font-mono font-semibold">
        {rating > 0 ? rating.toFixed(1) : 'New'}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-white/45 text-[11px]">
          ({count} {count === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
};

// 5. Modal / GlassModal (Glass Level 3)
export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ open, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-page-enter">
      <div
        className={`glass-level-3 rounded-3xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto text-white/85">{children}</div>
      </div>
    </div>
  );
};

export const GlassModal = Modal;

// 6. ConfirmDialog
export const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onCancel} title={title} maxWidth="max-w-md">
      <p className="text-sm text-white/70 mb-6 leading-relaxed">{message}</p>
      <div className="flex items-center justify-end gap-3">
        <GlassButton type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </GlassButton>
        <GlassButton
          type="button"
          variant={danger ? 'danger' : 'primary'}
          onClick={onConfirm}
        >
          {confirmLabel}
        </GlassButton>
      </div>
    </Modal>
  );
};

// 7. LoadingSkeleton
export const LoadingSkeleton: React.FC<{ count?: number; height?: string }> = ({
  count = 3,
  height = 'h-36',
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        className={`${height} rounded-2xl glass-level-1 animate-pulse`}
      />
    ))}
  </div>
);

// 8. EmptyState
export const EmptyState: React.FC<{
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => (
  <div className="glass-level-2 relative overflow-hidden rounded-2xl p-10 text-center flex flex-col items-center justify-center">
    <DeveloperCodeBackdrop />
    <div className="relative z-10 flex flex-col items-center">
      <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/15 text-indigo-300 flex items-center justify-center mb-3.5">
        <Inbox className="w-5 h-5" />
      </div>
      <h4 className="text-base font-bold text-white tracking-tight">{title}</h4>
      {description && (
        <p className="text-xs text-white/60 mt-1.5 max-w-md leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <GlassButton
          type="button"
          variant="primary"
          onClick={onAction}
          className="mt-5"
        >
          {actionLabel}
        </GlassButton>
      )}
    </div>
  </div>
);

// 9. ErrorState
export const ErrorState: React.FC<{
  message: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => (
  <div className="glass-level-2 border-rose-500/35 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
      <span className="text-xs font-medium text-rose-200">{message}</span>
    </div>
    {onRetry && (
      <GlassButton type="button" variant="danger" size="sm" onClick={onRetry}>
        Try Again
      </GlassButton>
    )}
  </div>
);

// 10. SearchBar
export const SearchBar: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = 'Search students, skills, or colleges...' }) => (
  <div className="relative flex-1">
    <Search className="w-4 h-4 text-white/45 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="glass-input w-full pl-11 pr-10 py-3 rounded-2xl text-sm"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/45 hover:text-white"
        aria-label="Clear search"
      >
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
);

// 11. Pagination
export const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2.5 mt-6">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="p-2 rounded-xl btn-liquid-secondary disabled:opacity-35"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-xs font-mono font-semibold text-white/75 px-3">
        Page {currentPage} of {totalPages}
      </span>
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="p-2 rounded-xl btn-liquid-secondary disabled:opacity-35"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// 12. PeerCard (Liquid Glass Student Discovery & Recommendation Card)
export const PeerCard: React.FC<{
  peer: PeerProfile;
  onViewProfile: (peer: PeerProfile) => void;
  onSendRequest: (peer: PeerProfile) => void;
}> = ({ peer, onViewProfile, onSendRequest }) => {
  const teachMeIds = new Set(peer.match?.peerCanTeachMe.map((s: SkillEntry) => s.skillId) || []);
  const learnFromMeIds = new Set(peer.match?.iCanTeachPeer.map((s: SkillEntry) => s.skillId) || []);

  return (
    <GlassCard
      level={2}
      interactive
      className="p-5 flex flex-col justify-between gap-4"
    >
      <div className="space-y-4">
        {/* Top Row: Avatar, Name, College + Match Ring */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={peer.fullName} src={peer.avatarUrl} size="lg" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight truncate">
                  {peer.fullName}
                </h3>
                {peer.isDemo && (
                  <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white/[0.07] text-white/65 border border-white/10 shrink-0">
                    Peer
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/55 mt-0.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">
                  {peer.college || 'University Campus'}{' '}
                  {peer.course ? `• ${peer.course}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <RatingStars rating={peer.averageRating} count={peer.reviewCount} />
                <span className="text-[11px] font-mono text-white/45">
                  {peer.completedSessionsCount} sessions
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Compatibility Ring & Availability */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <MatchScore
            score={peer.match?.score || 0}
            isMutual={peer.match?.isMutualExchange}
            onClick={() => onViewProfile(peer)}
          />
          <span className="inline-flex items-center gap-1 text-[11px] text-white/55 font-medium">
            <Clock className="w-3 h-3 text-cyan-400" />
            {peer.availability || 'Flexible'}
          </span>
        </div>

        {/* Rule-Based Match Explanation Lines */}
        {peer.match?.summaryLines && peer.match.summaryLines.length > 0 && (
          <div className="p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-400/20 space-y-1">
            {peer.match.summaryLines.map((line, i) => (
              <p
                key={i}
                className="text-xs font-medium text-emerald-200 flex items-start gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{line}</span>
              </p>
            ))}
          </div>
        )}

        {/* Skills They Teach */}
        <div>
          <p className="text-[11px] font-semibold text-white/45 mb-1.5 flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-violet-400" />
            <span>Skills Offered (Teaches)</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {peer.teachingSkills.length > 0 ? (
              peer.teachingSkills.map((sk) => (
                <SkillBadge
                  key={sk.id}
                  name={sk.name}
                  level={sk.level}
                  variant={teachMeIds.has(sk.skillId) ? 'match' : 'teach'}
                />
              ))
            ) : (
              <span className="text-xs text-white/35 italic">No teaching skills listed</span>
            )}
          </div>
        </div>

        {/* Skills They Want To Learn */}
        <div>
          <p className="text-[11px] font-semibold text-white/45 mb-1.5">
            Wants To Learn
          </p>
          <div className="flex flex-wrap gap-1.5">
            {peer.learningSkills.length > 0 ? (
              peer.learningSkills.map((sk) => (
                <SkillBadge
                  key={sk.id}
                  name={sk.name}
                  level={sk.level}
                  variant={learnFromMeIds.has(sk.skillId) ? 'match' : 'learn'}
                />
              ))
            ) : (
              <span className="text-xs text-white/35 italic">No learning skills listed</span>
            )}
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="pt-3.5 border-t border-white/10 flex items-center gap-2.5 relative z-10">
        <button
          type="button"
          onClick={() => onViewProfile(peer)}
          className="flex-1 py-2 px-3 rounded-xl btn-liquid-secondary text-xs font-semibold"
        >
          View Profile
        </button>
        {peer.isConnected ? (
          <span className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 text-xs font-semibold text-center">
            Connected
          </span>
        ) : peer.hasPendingRequest ? (
          <span className="flex-1 py-2 px-3 rounded-xl bg-amber-500/15 text-amber-200 border border-amber-400/30 text-xs font-semibold text-center">
            Request Sent
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onSendRequest(peer)}
            className="flex-1 py-2 px-3 rounded-xl btn-liquid-primary text-xs font-semibold"
          >
            Request Exchange
          </button>
        )}
      </div>
    </GlassCard>
  );
};
