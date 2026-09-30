import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Target,
  Bell,
  CheckCheck,
  Plus,
  Edit3,
  Trash2,
  GraduationCap,
  MapPin,
  Clock,
  Camera,
  Lock,
  Shield,
  UserX,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ProgressItem,
  LearningGoalItem,
  NotificationItemData,
} from '../types.ts';
import {
  Avatar,
  SkillBadge,
  RatingStars,
  Modal,
  EmptyState,
  LoadingSkeleton,
  GlassCard,
  GlassButton,
  GlassProgress,
  DeveloperCodeBackdrop,
} from '../components/ui/CommonUI.tsx';
import { BattleStatsSection } from './SkillBattlePages.tsx';

// ============================================================================
// 1. LEARNING PROGRESS PAGE (/progress) - LIQUID GLASS
// ============================================================================
export const ProgressPage: React.FC = () => {
  const { profile, catalogSkills, apiFetch, refreshProfile, showToast } = useAuth();
  const [editingItem, setEditingItem] = useState<ProgressItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Add form state
  const [skillId, setSkillId] = useState<number>(catalogSkills[0]?.id || 0);
  const [startingLevel, setStartingLevel] = useState('Beginner');
  const [currentLevel, setCurrentLevel] = useState('Beginner');
  const [progressPercentage, setProgressPercentage] = useState(25);
  const [sessionsCompleted, setSessionsCompleted] = useState(1);
  const [topicsCompleted, setTopicsCompleted] = useState('Variables, Functions, Loops');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/progress/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingItem),
      });
      showToast('Learning progress updated!', 'success');
      setEditingItem(null);
      await refreshProfile();
    } catch (err: any) {
      showToast(err.message || 'Failed to update progress.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillId) return;
    setSubmitting(true);
    try {
      await apiFetch('/api/progress', {
        method: 'POST',
        body: JSON.stringify({
          skillId,
          startingLevel,
          currentLevel,
          progressPercentage,
          sessionsCompleted,
          topicsCompleted,
          notes,
        }),
      });
      showToast('Skill progress tracker saved!', 'success');
      setAddOpen(false);
      await refreshProfile();
    } catch (err: any) {
      showToast(err.message || 'Failed to save progress.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const items = profile?.progress || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-300">
            Mastery Analytics
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-0.5">
            Learning Progress Tracker
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Monitor your skill mastery, completed sessions, and topics learned.
          </p>
        </div>
        <GlassButton
          type="button"
          variant="primary"
          onClick={() => {
            setSkillId(catalogSkills[0]?.id || 0);
            setAddOpen(true);
          }}
          className="self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Track Skill Progress</span>
        </GlassButton>
      </div>

      {/* Overall Learning Progress Banner */}
      <GlassCard level={2} className="relative overflow-hidden p-6 space-y-4">
        <DeveloperCodeBackdrop />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500/25 to-cyan-500/20 border border-white/15 text-cyan-300 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Overall Learning Progress
              </h2>
              <p className="text-xs text-white/55">
                Across {items.length} tracked learning {items.length === 1 ? 'skill' : 'skills'}
              </p>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-cyan-300 font-mono">
            {profile?.overallProgress || 0}%
          </span>
        </div>
        <div className="relative z-10">
          <GlassProgress value={profile?.overallProgress || 0} accent="indigo" />
        </div>
      </GlassCard>

      {/* Individual Skill Progress Cards */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item) => (
            <GlassCard
              key={item.id}
              level={2}
              interactive
              className="p-6 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-cyan-300">
                      {item.categoryName}
                    </span>
                    <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                      {item.skillName}
                    </h3>
                    <p className="text-xs font-mono text-white/60 mt-0.5">
                      {item.startingLevel} →{' '}
                      <span className="text-violet-300 font-semibold">{item.currentLevel}</span>
                    </p>
                  </div>
                  <GlassButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingItem(item)}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Update</span>
                  </GlassButton>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-white/65">Mastery Progress</span>
                    <span className="text-cyan-300 font-mono font-bold">
                      {item.progressPercentage}%
                    </span>
                  </div>
                  <GlassProgress value={item.progressPercentage} accent="indigo" />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl glass-level-1">
                    <span className="text-white/45 font-mono uppercase block text-[10px]">
                      Sessions Completed
                    </span>
                    <span className="text-base font-bold font-mono text-white mt-0.5 block">
                      {item.sessionsCompleted}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl glass-level-1">
                    <span className="text-white/45 font-mono uppercase block text-[10px]">
                      Last Session
                    </span>
                    <span className="text-xs font-mono font-semibold text-white mt-1 block">
                      {item.lastSessionDate || 'Recent'}
                    </span>
                  </div>
                </div>

                {item.topicsCompleted && (
                  <div>
                    <p className="text-[11px] font-mono uppercase text-white/45 mb-1.5">
                      Topics Completed
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.topicsCompleted
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .map((topic, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 text-xs font-medium"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>{topic}</span>
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {item.notes && (
                  <p className="text-xs text-white/70 glass-level-1 p-3 rounded-xl">
                    <strong className="text-white">Notes:</strong> {item.notes}
                  </p>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No skill progress tracked yet."
          description="Add a skill to track your progression from Beginner to Advanced."
          actionLabel="Track Skill Progress"
          onAction={() => setAddOpen(true)}
        />
      )}

      {/* Edit Progress Modal */}
      <Modal
        open={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        title={`Update Progress: ${editingItem?.skillName || ''}`}
      >
        {editingItem && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/75 mb-1">
                  Starting Level
                </label>
                <select
                  value={editingItem.startingLevel}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, startingLevel: e.target.value })
                  }
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/75 mb-1">
                  Current Level
                </label>
                <select
                  value={editingItem.currentLevel}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, currentLevel: e.target.value })
                  }
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/75 mb-1">
                Progress Percentage ({editingItem.progressPercentage}%)
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={editingItem.progressPercentage}
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    progressPercentage: Number(e.target.value),
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/75 mb-1">
                  Sessions Completed
                </label>
                <input
                  type="number"
                  min={0}
                  value={editingItem.sessionsCompleted}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      sessionsCompleted: Number(e.target.value),
                    })
                  }
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/75 mb-1">
                  Last Session Date
                </label>
                <input
                  type="date"
                  value={editingItem.lastSessionDate || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, lastSessionDate: e.target.value })
                  }
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/75 mb-1">
                Topics Completed (comma-separated)
              </label>
              <input
                type="text"
                value={editingItem.topicsCompleted}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, topicsCompleted: e.target.value })
                }
                placeholder="Variables, Functions, Loops, OOP"
                className="glass-input w-full px-3.5 py-2 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/75 mb-1">
                Personal Notes
              </label>
              <textarea
                rows={3}
                value={editingItem.notes}
                onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                className="glass-input w-full px-3.5 py-2 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2">
              <GlassButton
                type="button"
                variant="secondary"
                onClick={() => setEditingItem(null)}
              >
                Cancel
              </GlassButton>
              <GlassButton type="submit" variant="primary" disabled={submitting}>
                Save Progress
              </GlassButton>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Progress Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Skill Progress Tracker"
      >
        <form onSubmit={handleCreateProgress} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/75 mb-1">Skill</label>
            <select
              value={skillId}
              onChange={(e) => setSkillId(Number(e.target.value))}
              className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
            >
              {catalogSkills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.categoryName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/75 mb-1">
                Starting Level
              </label>
              <select
                value={startingLevel}
                onChange={(e) => setStartingLevel(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/75 mb-1">
                Current Level
              </label>
              <select
                value={currentLevel}
                onChange={(e) => setCurrentLevel(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/75 mb-1">
              Progress Percentage ({progressPercentage}%)
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={progressPercentage}
              onChange={(e) => setProgressPercentage(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/75 mb-1">
              Topics Completed (comma-separated)
            </label>
            <input
              type="text"
              value={topicsCompleted}
              onChange={(e) => setTopicsCompleted(e.target.value)}
              placeholder="Variables, Functions, Loops, OOP"
              className="glass-input w-full px-3.5 py-2 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/75 mb-1">
              Personal Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="glass-input w-full px-3.5 py-2 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end gap-2">
            <GlassButton
              type="button"
              variant="secondary"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" disabled={submitting}>
              Save Tracker
            </GlassButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ============================================================================
// 2. LEARNING GOALS PAGE (/goals) - LIQUID GLASS
// ============================================================================
export const GoalsPage: React.FC = () => {
  const { catalogSkills, apiFetch, showToast } = useAuth();
  const [goals, setGoals] = useState<LearningGoalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillId, setSkillId] = useState<number>(0);
  const [targetDate, setTargetDate] = useState('2026-11-30');
  const [progressPercentage, setProgressPercentage] = useState(60);
  const [status, setStatus] = useState<'Not Started' | 'In Progress' | 'Completed'>('In Progress');
  const [submitting, setSubmitting] = useState(false);

  const loadGoals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ goals: LearningGoalItem[] }>('/api/goals');
      setGoals(data.goals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetDate) {
      showToast('Goal title and target date are required.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          skillId: skillId || null,
          targetDate,
          progressPercentage,
          status,
        }),
      });
      showToast('Learning goal created!', 'success');
      setModalOpen(false);
      setTitle('');
      setDescription('');
      await loadGoals();
    } catch (err: any) {
      showToast(err.message || 'Failed to create goal.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGoal = async (
    goal: LearningGoalItem,
    nextPct: number,
    nextStatus: string
  ) => {
    try {
      await apiFetch(`/api/goals/${goal.id}`, {
        method: 'PUT',
        body: JSON.stringify({ progressPercentage: nextPct, status: nextStatus }),
      });
      showToast('Goal updated.', 'success');
      await loadGoals();
    } catch (err: any) {
      showToast(err.message || 'Failed to update goal.', 'error');
    }
  };

  const handleDeleteGoal = async (id: number) => {
    try {
      await apiFetch(`/api/goals/${id}`, { method: 'DELETE' });
      showToast('Goal removed.', 'info');
      await loadGoals();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete goal.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-violet-300">
            Semester Milestones
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-0.5">
            Learning Goals
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Set structured milestones and target dates for your peer-learning journey.
          </p>
        </div>
        <GlassButton
          type="button"
          variant="primary"
          onClick={() => setModalOpen(true)}
          className="self-start"
        >
          <Plus className="w-4 h-4" />
          <span>New Learning Goal</span>
        </GlassButton>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} height="h-44" />
      ) : goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {goals.map((g) => (
            <GlassCard key={g.id} level={2} interactive className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-cyan-400 shrink-0" />
                    <h3 className="text-base font-bold text-white tracking-tight">{g.title}</h3>
                  </div>
                  <p className="text-xs text-white/55 mt-1 font-mono">
                    Target Date: <strong className="text-white">{g.targetDate}</strong>
                    {g.skillName ? ` • Skill: ${g.skillName}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-semibold border ${
                      g.status === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/35'
                        : g.status === 'In Progress'
                        ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/35'
                        : 'bg-white/[0.06] text-white/60 border-white/15'
                    }`}
                  >
                    {g.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteGoal(g.id)}
                    className="p-1.5 rounded-lg text-white/45 hover:text-rose-400 hover:bg-rose-500/15 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {g.description && <p className="text-xs text-white/65">{g.description}</p>}

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-white/65">Milestone Completion</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {g.progressPercentage}%
                  </span>
                </div>
                <GlassProgress value={g.progressPercentage} accent="purple" />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={g.progressPercentage}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const nextStatus =
                      val === 100 ? 'Completed' : val > 0 ? 'In Progress' : 'Not Started';
                    handleUpdateGoal(g, val, nextStatus);
                  }}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No learning goals created yet."
          description='Create a goal such as "Learn React fundamentals" with a target completion date.'
          actionLabel="Create First Goal"
          onAction={() => setModalOpen(true)}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Learning Goal">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/75 mb-1">Goal Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Learn React fundamentals"
              className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/75 mb-1">Target Date</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/75 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/75 mb-1">
              Initial Progress ({progressPercentage}%)
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={progressPercentage}
              onChange={(e) => setProgressPercentage(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/75 mb-1">
              Related Skill (Optional)
            </label>
            <select
              value={skillId}
              onChange={(e) => setSkillId(Number(e.target.value))}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs"
            >
              <option value={0}>-- General Goal --</option>
              {catalogSkills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/75 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input w-full px-3.5 py-2 rounded-xl text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <GlassButton
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" disabled={submitting}>
              Create Goal
            </GlassButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ============================================================================
// 3. NOTIFICATIONS PAGE (/notifications) - LIQUID GLASS
// ============================================================================
export const NotificationsPage: React.FC = () => {
  const { apiFetch, refreshProfile, showToast } = useAuth();
  const [list, setList] = useState<NotificationItemData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ notifications: NotificationItemData[] }>('/api/notifications');
      setList(data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (id: number) => {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    await loadNotifications();
    await refreshProfile();
  };

  const handleMarkAllRead = async () => {
    await apiFetch('/api/notifications/read-all', { method: 'PUT' });
    showToast('All notifications marked as read.', 'info');
    await loadNotifications();
    await refreshProfile();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-300">
            Activity Stream
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-0.5">
            Notifications
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Alerts for learning requests, session schedules, peer messages, and reviews.
          </p>
        </div>

        {list.some((n) => !n.isRead) && (
          <GlassButton type="button" variant="secondary" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4 text-cyan-300" />
            <span>Mark all as read</span>
          </GlassButton>
        )}
      </div>

      {loading ? (
        <LoadingSkeleton count={4} height="h-20" />
      ) : list.length > 0 ? (
        <div className="space-y-3">
          {list.map((n) => (
            <GlassCard
              key={n.id}
              level={n.isRead ? 1 : 2}
              className={`p-4 flex items-start justify-between gap-4 transition-all ${
                !n.isRead ? 'border-indigo-400/35' : ''
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    n.isRead
                      ? 'bg-white/[0.05] border-white/10 text-white/45'
                      : 'bg-gradient-to-br from-violet-500/30 to-cyan-500/25 border-white/20 text-cyan-300'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{n.title}</h4>
                  <p className="text-xs text-white/70 mt-0.5">{n.message}</p>
                  <span className="text-[11px] font-mono text-white/40 mt-1 block">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <GlassButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleMarkRead(n.id)}
                  className="shrink-0"
                >
                  Mark read
                </GlassButton>
              )}
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState title="No notifications yet." description="You are all caught up!" />
      )}
    </div>
  );
};

// ============================================================================
// 4. STUDENT PROFILE PAGE (/profile) - PREMIUM LIQUID GLASS PROFILE
// ============================================================================
export const ProfilePage: React.FC = () => {
  const { profile, apiFetch, refreshProfile, showToast } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [location, setLocation] = useState('');
  const [availability, setAvailability] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setBio(profile.bio || '');
      setCollege(profile.college || '');
      setCourse(profile.course || '');
      setYear(profile.year || '');
      setLocation(profile.location || '');
      setAvailability(profile.availability || 'Weekdays & Weekends');
      setAvatarUrl(profile.avatarUrl || '');
    }
  }, [profile]);

  if (!profile) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP).', 'error');
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      showToast('Profile image must be under 1.5 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Full name is required.', 'error');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: fullName.trim(),
          bio,
          college,
          course,
          year,
          location,
          availability,
          avatarUrl,
        }),
      });
      showToast('Profile updated successfully.', 'success');
      setEditOpen(false);
      await refreshProfile();
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Large Liquid Glass Profile Header Card */}
      <GlassCard level={2} className="relative overflow-hidden p-6 sm:p-8">
        <DeveloperCodeBackdrop variant="hero" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <Avatar name={profile.fullName} src={profile.avatarUrl} size="xl" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {profile.fullName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-lg bg-violet-500/20 text-violet-200 border border-violet-400/30 text-xs font-mono font-bold">
                  {profile.role}
                </span>
              </div>
              <p className="text-xs text-white/50 font-mono mt-0.5">{profile.email}</p>
              <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-white/70">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  {profile.college || 'University Campus'} • {profile.course || 'BCA'}{' '}
                  {profile.year ? `(${profile.year})` : ''}
                </span>
                {profile.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    {profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  {profile.availability || 'Weekdays & Weekends'}
                </span>
              </div>
            </div>
          </div>

          <GlassButton
            type="button"
            variant="primary"
            onClick={() => setEditOpen(true)}
            className="self-start"
          >
            Edit Student Profile
          </GlassButton>
        </div>

        {/* Summary Metrics */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-b border-white/10">
          <div className="p-3.5 rounded-2xl glass-level-1">
            <span className="text-[11px] text-white/45 font-mono uppercase block">
              Average Rating
            </span>
            <div className="mt-1.5">
              <RatingStars rating={profile.averageRating} count={profile.reviewCount} />
            </div>
          </div>
          <div className="p-3.5 rounded-2xl glass-level-1">
            <span className="text-[11px] text-white/45 font-mono uppercase block">
              Completed Sessions
            </span>
            <p className="text-xl font-bold font-mono text-white mt-1">
              {profile.completedSessionsCount}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl glass-level-1">
            <span className="text-[11px] text-white/45 font-mono uppercase block">
              Skills Taught
            </span>
            <p className="text-xl font-bold font-mono text-white mt-1">
              {profile.teachingSkills.length}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl glass-level-1">
            <span className="text-[11px] text-white/45 font-mono uppercase block">
              Learning Progress
            </span>
            <p className="text-xl font-bold font-mono text-cyan-300 mt-1">
              {profile.overallProgress}%
            </p>
          </div>
        </div>

        {/* Bio */}
        <div className="relative z-10 pt-5">
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-white/45 mb-1.5">
            Student Bio
          </h3>
          <p className="text-sm text-white/80 leading-relaxed">
            {profile.bio ||
              'No bio added yet. Click "Edit Student Profile" to tell peers about your academic interests and skills!'}
          </p>
        </div>
      </GlassCard>

      {/* Skills Taught & Skills Learning */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard level={2} className="p-6 space-y-3.5">
          <h3 className="text-xs font-mono uppercase tracking-wider text-violet-300">
            Skills I Can Teach ({profile.teachingSkills.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.teachingSkills.length > 0 ? (
              profile.teachingSkills.map((sk) => (
                <SkillBadge key={sk.id} name={sk.name} level={sk.level} variant="teach" />
              ))
            ) : (
              <span className="text-xs text-white/40 italic">None added yet</span>
            )}
          </div>
        </GlassCard>

        <GlassCard level={2} className="p-6 space-y-3.5">
          <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-300">
            Skills I Want To Learn ({profile.learningSkills.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.learningSkills.length > 0 ? (
              profile.learningSkills.map((sk) => (
                <SkillBadge key={sk.id} name={sk.name} level={sk.level} variant="learn" />
              ))
            ) : (
              <span className="text-xs text-white/40 italic">None added yet</span>
            )}
          </div>
        </GlassCard>
      </div>

      {/* 1 vs 1 Skill Battle Statistics */}
      <BattleStatsSection />

      {/* Recent Reviews on Profile */}
      <GlassCard level={2} className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white tracking-tight">
            Student Reviews &amp; Feedback
          </h3>
          <span className="text-xs font-mono text-white/55">
            {profile.averageRating > 0
              ? `${profile.averageRating.toFixed(1)} ★ based on ${profile.reviewCount} reviews`
              : 'No reviews yet'}
          </span>
        </div>

        {profile.recentReviews && profile.recentReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.recentReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl glass-level-1 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{rev.reviewerName}</span>
                  <RatingStars rating={rev.rating} />
                </div>
                <p className="text-xs text-white/70">&ldquo;{rev.comment}&rdquo;</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/45 italic">
            Complete learning sessions with peers to receive ratings and reviews on your profile.
          </p>
        )}
      </GlassCard>

      {/* Edit Profile Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Student Profile"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={fullName} src={avatarUrl} size="lg" />
            <div className="flex-1">
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl btn-liquid-secondary text-xs font-semibold cursor-pointer">
                <Camera className="w-3.5 h-3.5 text-cyan-300" />
                <span>Upload Profile Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-white/45 mt-1">
                PNG, JPG or WebP (max 1.5 MB)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/75 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/75 mb-1">
                College / University
              </label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g., Delhi Technological University"
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/75 mb-1">Course</label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g., BCA"
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/75 mb-1">Year</label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g., 3rd Year (Final)"
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/75 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., New Delhi"
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/75 mb-1">Availability</label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs"
            >
              <option value="Weekdays & Weekends">Weekdays &amp; Weekends</option>
              <option value="Weekdays">Weekdays Only</option>
              <option value="Weekends">Weekends Only</option>
              <option value="Evenings">Evenings (5 PM – 10 PM)</option>
              <option value="Flexible">Flexible</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/75 mb-1">Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share your academic projects, teaching style, and learning goals..."
              className="glass-input w-full px-3 py-2 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <GlassButton
              type="button"
              variant="secondary"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </GlassButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ============================================================================
// 5. SETTINGS PAGE (/settings) - LIQUID GLASS
// ============================================================================
export const SettingsPage: React.FC = () => {
  const { profile, apiFetch, refreshProfile, showToast } = useAuth();

  const [notifyRequests, setNotifyRequests] = useState(profile?.notifyRequests ?? true);
  const [notifyMessages, setNotifyMessages] = useState(profile?.notifyMessages ?? true);
  const [notifySessions, setNotifySessions] = useState(profile?.notifySessions ?? true);
  const [notifyReviews, setNotifyReviews] = useState(profile?.notifyReviews ?? true);
  const [profileVisibility, setProfileVisibility] = useState(
    profile?.profileVisibility || 'PUBLIC'
  );

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [blockedList, setBlockedList] = useState<any[]>([]);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const loadBlocked = useCallback(async () => {
    try {
      const data = await apiFetch<{ blockedUsers: any[] }>('/api/blocked');
      setBlockedList(data.blockedUsers || []);
    } catch (err) {
      console.error(err);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadBlocked();
  }, [loadBlocked]);

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          notifyRequests,
          notifyMessages,
          notifySessions,
          notifyReviews,
          profileVisibility,
        }),
      });
      showToast('Notification and privacy preferences saved.', 'success');
      await refreshProfile();
    } catch (err: any) {
      showToast(err.message || 'Failed to save preferences.', 'error');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    setSavingPass(true);
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ newPassword }),
      });
      showToast('Password updated successfully.', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to update password.', 'error');
    } finally {
      setSavingPass(false);
    }
  };

  const handleUnblock = async (blockedUserId: string) => {
    try {
      await apiFetch(`/api/blocked/${blockedUserId}`, { method: 'DELETE' });
      showToast('User unblocked.', 'info');
      await loadBlocked();
    } catch (err: any) {
      showToast(err.message || 'Failed to unblock user.', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <span className="text-xs font-mono uppercase tracking-wider text-violet-300">
          Security &amp; Preferences
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-0.5">
          Account Settings
        </h1>
        <p className="text-sm text-white/60 mt-1">
          Manage your notification preferences, privacy controls, security, and blocked users.
        </p>
      </div>

      {/* Notification & Privacy Preferences */}
      <GlassCard level={2} className="p-6 space-y-6">
        <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Notification &amp; Privacy Preferences
          </h2>
        </div>

        <div className="space-y-3 text-sm">
          {[
            {
              label: 'Learning Requests',
              desc: 'Receive notifications when a student sends or responds to a learning request',
              val: notifyRequests,
              set: setNotifyRequests,
            },
            {
              label: 'Peer Messages',
              desc: 'Get notified when connected peers send you a direct message',
              val: notifyMessages,
              set: setNotifyMessages,
            },
            {
              label: 'Learning Sessions',
              desc: 'Alerts for newly scheduled, updated, or cancelled study sessions',
              val: notifySessions,
              set: setNotifySessions,
            },
            {
              label: 'Ratings & Reviews',
              desc: 'Notifications when a learner rates your completed teaching session',
              val: notifyReviews,
              set: setNotifyReviews,
            },
          ].map((item, idx) => (
            <label
              key={idx}
              className="flex items-center justify-between p-4 rounded-2xl glass-level-1 cursor-pointer hover:border-white/20 transition-colors"
            >
              <div>
                <p className="font-bold text-white text-xs">{item.label}</p>
                <p className="text-xs text-white/55 mt-0.5">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={item.val}
                onChange={(e) => item.set(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-500"
              />
            </label>
          ))}
        </div>

        <div>
          <label className="block text-xs font-medium text-white/75 mb-1.5">
            Profile Visibility
          </label>
          <select
            value={profileVisibility}
            onChange={(e) => setProfileVisibility(e.target.value)}
            className="glass-input w-full sm:w-72 px-3.5 py-2.5 rounded-xl text-xs"
          >
            <option value="PUBLIC">Public to All Verified Students</option>
            <option value="CONNECTIONS_ONLY">Connections Only</option>
          </select>
        </div>

        <GlassButton
          type="button"
          variant="primary"
          disabled={savingPrefs}
          onClick={handleSavePreferences}
        >
          {savingPrefs ? 'Saving...' : 'Save Preferences'}
        </GlassButton>
      </GlassCard>

      {/* Password Change */}
      <GlassCard level={2} className="p-6 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
          <Lock className="w-5 h-5 text-violet-400" />
          <h2 className="text-base font-bold text-white tracking-tight">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/75 mb-1.5">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
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
              placeholder="Re-enter password"
              className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs"
            />
          </div>
          <div className="sm:col-span-2">
            <GlassButton type="submit" variant="secondary" disabled={savingPass}>
              {savingPass ? 'Updating...' : 'Update Password'}
            </GlassButton>
          </div>
        </form>
      </GlassCard>

      {/* Blocked Users */}
      <GlassCard level={2} className="p-6 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
          <UserX className="w-5 h-5 text-rose-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Blocked Users ({blockedList.length})
          </h2>
        </div>

        {blockedList.length > 0 ? (
          <div className="space-y-2.5">
            {blockedList.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-2xl glass-level-1 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={b.fullName} src={b.avatarUrl} size="sm" />
                  <div>
                    <p className="text-xs font-bold text-white">{b.fullName}</p>
                    <p className="text-[11px] text-white/50">{b.college || b.email}</p>
                  </div>
                </div>
                <GlassButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUnblock(b.blockedUserId)}
                >
                  Unblock
                </GlassButton>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/45 italic">
            You have not blocked any users. Blocked users cannot send you learning requests,
            messages, or appear in your recommendations.
          </p>
        )}
      </GlassCard>
    </div>
  );
};
