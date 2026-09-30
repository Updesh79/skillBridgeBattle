import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  BookOpen,
  Calendar,
  Flag,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Avatar,
  RatingStars,
  Modal,
  ConfirmDialog,
  SearchBar,
  LoadingSkeleton,
  EmptyState,
  GlassCard,
  GlassButton,
  GlassStatCard,
} from '../components/ui/CommonUI.tsx';

// ============================================================================
// 1. ADMIN DASHBOARD (/admin) - LIQUID GLASS
// ============================================================================
export const AdminDashboardPage: React.FC = () => {
  const { apiFetch, showToast } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/overview');
      setData(res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load admin statistics.', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, showToast]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  if (loading || !data) {
    return <LoadingSkeleton count={4} height="h-36" />;
  }

  const { stats, popularSkills, sessionBreakdown, userGrowth } = data;
  const maxSkillCount = Math.max(
    1,
    ...(popularSkills || []).map((s: any) => s.total || 1)
  );

  const statItems = [
    { label: 'Total Users', value: stats.totalUsers, sub: `${stats.verifiedUsers} Verified`, icon: Users, accent: 'purple' as const },
    { label: 'Verified Users', value: stats.verifiedUsers, sub: 'Email verified', icon: CheckCircle2, accent: 'emerald' as const },
    { label: 'Total Skills', value: stats.totalSkills, sub: `${stats.totalCategories} Categories`, icon: BookOpen, accent: 'cyan' as const },
    { label: 'Total Connections', value: stats.totalConnections, sub: 'Active pairs', icon: ShieldCheck, accent: 'purple' as const },
    { label: 'Total Sessions', value: stats.totalSessions, sub: 'Scheduled & past', icon: Calendar, accent: 'cyan' as const },
    { label: 'Completed Sessions', value: stats.completedSessions, sub: 'Verified exchanges', icon: CheckCircle2, accent: 'emerald' as const },
    { label: 'Pending Requests', value: stats.pendingRequests, sub: 'Awaiting response', icon: AlertTriangle, accent: 'amber' as const },
    { label: 'Reported Users', value: stats.reportedUsers, sub: `${stats.pendingReports} Pending`, icon: Flag, accent: 'magenta' as const },
  ];

  return (
    <div className="space-y-8">
      <GlassCard level={2} className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-300">
            Platform Administration Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            SkillBridge Admin Dashboard
          </h1>
          <p className="text-sm text-white/65 mt-1">
            Real-time database metrics, skill popularity, session completion, and moderation status.
          </p>
        </div>

        <GlassButton
          variant="secondary"
          size="md"
          onClick={loadOverview}
          className="self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </GlassButton>
      </GlassCard>

      {/* 8 Admin KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statItems.map((item, idx) => (
          <GlassStatCard
            key={idx}
            label={item.label}
            value={item.value}
            subtext={item.sub}
            icon={item.icon}
            accent={item.accent}
          />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Popular Skills Chart */}
        <GlassCard level={2} className="lg:col-span-7 p-6 space-y-5">
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Popular Academic Skills (Teaching vs. Learning Demand)
            </h3>
            <p className="text-xs text-white/55 mt-0.5">
              Distribution of skills offered and requested across student profiles
            </p>
          </div>

          <div className="space-y-3.5">
            {(popularSkills || []).map((sk: any, i: number) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white/90">{sk.name}</span>
                  <span className="text-white/55 font-mono">
                    {sk.teachingCount} teaching · {sk.learningCount} learning
                  </span>
                </div>
                <div className="w-full h-2.5 bg-white/[0.06] border border-white/10 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                    style={{ width: `${(sk.teachingCount / maxSkillCount) * 100}%` }}
                    title={`Teaching: ${sk.teachingCount}`}
                  />
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                    style={{ width: `${(sk.learningCount / maxSkillCount) * 100}%` }}
                    title={`Learning: ${sk.learningCount}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Users Growth & Sessions Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard level={2} className="p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Sessions Status Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-indigo-500/15 border border-indigo-400/25">
                <span className="text-xl font-extrabold text-indigo-300 font-mono">
                  {sessionBreakdown?.Scheduled || 0}
                </span>
                <span className="block text-[11px] font-bold text-indigo-200/80 mt-1">
                  Scheduled
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/25">
                <span className="text-xl font-extrabold text-emerald-300 font-mono">
                  {sessionBreakdown?.Completed || 0}
                </span>
                <span className="block text-[11px] font-bold text-emerald-200/80 mt-1">
                  Completed
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/12">
                <span className="text-xl font-extrabold text-white/75 font-mono">
                  {sessionBreakdown?.Cancelled || 0}
                </span>
                <span className="block text-[11px] font-bold text-white/55 mt-1">
                  Cancelled
                </span>
              </div>
            </div>
          </GlassCard>

          <GlassCard level={2} className="p-6 space-y-4">
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Platform Growth (Users &amp; Completed Sessions)
            </h3>
            <div className="grid grid-cols-4 gap-3 items-end h-40 pt-4 px-3 bg-white/[0.03] rounded-2xl border border-white/10">
              {(userGrowth || []).map((g: any, i: number) => {
                const heightPct = Math.max(
                  25,
                  Math.min(100, (g.users / Math.max(1, stats.totalUsers)) * 100)
                );
                return (
                  <div key={i} className="flex flex-col items-center justify-end h-full gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-cyan-300">
                      {g.users}u / {g.sessions}s
                    </span>
                    <div
                      className="w-full max-w-[36px] bg-gradient-to-t from-indigo-600 via-purple-500 to-cyan-400 rounded-t-lg transition-all shadow-[0_0_16px_rgba(99,102,241,0.35)]"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] font-mono text-white/55 pb-1">{g.label}</span>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. ADMIN USER MANAGEMENT (/admin/users) - LIQUID GLASS
// ============================================================================
export const AdminUsersPage: React.FC = () => {
  const { apiFetch, showToast } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ users: any[] }>('/api/admin/users');
      setUsers(data.users || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load users.', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleActive = async (user: any) => {
    try {
      const res = await apiFetch<{ message: string }>(`/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      showToast(res.message, 'info');
      await loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user status.', 'error');
    }
  };

  const filtered = users.filter((u) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.college || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    if (roleFilter && u.role !== roleFilter) return false;
    if (statusFilter === 'active' && !u.isActive) return false;
    if (statusFilter === 'inactive' && u.isActive) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <GlassCard level={2} className="p-6">
        <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-300">
          Directory &amp; Access Control
        </span>
        <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
          User Management
        </h1>
        <p className="text-sm text-white/65 mt-1">
          View, search, filter, deactivate, or reactivate student accounts. Passwords are encrypted
          and never exposed.
        </p>
      </GlassCard>

      <GlassCard level={2} className="p-4 flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search users by name, email, or college..."
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl text-xs"
        >
          <option value="">All Roles</option>
          <option value="STUDENT">STUDENT</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl text-xs"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Deactivated</option>
        </select>
      </GlassCard>

      {loading ? (
        <LoadingSkeleton count={4} height="h-20" />
      ) : (
        <GlassCard level={2} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/[0.04] border-b border-white/10 text-white/55 font-mono uppercase">
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Verified</th>
                  <th className="py-3.5 px-4">Sessions</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.fullName} src={u.avatarUrl} size="sm" />
                        <div>
                          <p className="font-bold text-white">{u.fullName}</p>
                          <p className="text-white/50">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono font-bold text-[11px] border ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-500/20 text-purple-200 border-purple-400/35'
                            : 'bg-white/[0.06] text-white/75 border-white/12'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.emailVerified ? (
                        <span className="text-emerald-300 font-bold">Verified ✓</span>
                      ) : (
                        <span className="text-amber-300 font-bold">Pending</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white/85">
                      {u.completedSessionsCount}
                    </td>
                    <td className="py-3.5 px-4">
                      <RatingStars rating={u.averageRating} count={u.reviewCount} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-md font-mono font-bold text-[11px] border ${
                          u.isActive
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-400/30'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedUser(u)}
                      >
                        Details
                      </GlassButton>
                      <GlassButton
                        variant={u.isActive ? 'danger' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleActive(u)}
                      >
                        {u.isActive ? 'Deactivate' : 'Reactivate'}
                      </GlassButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      <Modal
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title="User Account Details"
      >
        {selectedUser && (
          <div className="space-y-3 text-xs text-white/80">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <Avatar name={selectedUser.fullName} src={selectedUser.avatarUrl} size="lg" />
              <div>
                <h3 className="text-base font-bold text-white">{selectedUser.fullName}</h3>
                <p className="text-white/55">{selectedUser.email}</p>
              </div>
            </div>
            <p>
              <strong className="text-white">Role:</strong> {selectedUser.role}
            </p>
            <p>
              <strong className="text-white">College:</strong>{' '}
              {selectedUser.college || 'Not specified'}
            </p>
            <p>
              <strong className="text-white">Course &amp; Year:</strong> {selectedUser.course}{' '}
              {selectedUser.year}
            </p>
            <p>
              <strong className="text-white">Joined Date:</strong>{' '}
              {new Date(selectedUser.createdAt).toLocaleString()}
            </p>
            <p>
              <strong className="text-white">Bio:</strong> {selectedUser.bio || 'No bio'}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ============================================================================
// 3. ADMIN SKILL MANAGEMENT (/admin/skills) - LIQUID GLASS
// ============================================================================
export const AdminSkillsPage: React.FC = () => {
  const { catalogSkills, categories, apiFetch, refreshCatalog, showToast } = useAuth();

  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [description, setDescription] = useState('');
  const [editingSkill, setEditingSkill] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ skill: any; msg: string } | null>(null);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await apiFetch('/api/admin/skills', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          categoryId: categoryId || categories[0]?.id,
          description: description.trim(),
        }),
      });
      showToast('Skill added to catalog!', 'success');
      setName('');
      setDescription('');
      await refreshCatalog();
    } catch (err: any) {
      showToast(err.message || 'Failed to add skill.', 'error');
    }
  };

  const handleUpdateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkill) return;
    try {
      await apiFetch(`/api/admin/skills/${editingSkill.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingSkill),
      });
      showToast('Skill updated!', 'success');
      setEditingSkill(null);
      await refreshCatalog();
    } catch (err: any) {
      showToast(err.message || 'Failed to update skill.', 'error');
    }
  };

  const handleDeleteSkill = async (skill: any, force = false) => {
    try {
      await apiFetch(`/api/admin/skills/${skill.id}${force ? '?force=true' : ''}`, {
        method: 'DELETE',
      });
      showToast('Skill deleted.', 'info');
      setConfirmDelete(null);
      await refreshCatalog();
    } catch (err: any) {
      if (err.status === 409 && err.data?.requiresConfirmation) {
        setConfirmDelete({ skill, msg: err.message });
      } else {
        showToast(err.message || 'Failed to delete skill.', 'error');
      }
    }
  };

  const filtered = catalogSkills.filter(
    (s) =>
      !search.trim() ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.categoryName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <GlassCard level={2} className="p-6">
        <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300">
          Relational Skill Catalog
        </span>
        <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
          Manage Platform Skills
        </h1>
        <p className="text-sm text-white/65 mt-1">
          Add, edit, or safely remove canonical skills in the relational database.
        </p>
      </GlassCard>

      {/* Add Skill Form */}
      <GlassCard level={2} className="p-5">
        <form onSubmit={handleAddSkill} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New skill name (e.g., TypeScript)"
            className="sm:col-span-4 px-3.5 py-2.5 rounded-xl text-xs"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            className="sm:col-span-3 px-3 py-2.5 rounded-xl text-xs"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description..."
            className="sm:col-span-3 px-3.5 py-2.5 rounded-xl text-xs"
          />
          <GlassButton type="submit" variant="primary" className="sm:col-span-2">
            <Plus className="w-4 h-4" />
            <span>Add Skill</span>
          </GlassButton>
        </form>
      </GlassCard>

      <SearchBar value={search} onChange={setSearch} placeholder="Filter skills..." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((sk) => (
          <GlassCard
            key={sk.id}
            level={2}
            interactive
            className="p-4 flex items-start justify-between gap-3"
          >
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300">
                {sk.categoryName}
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">{sk.name}</h3>
              <p className="text-xs text-white/55 mt-1">{sk.description}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setEditingSkill(sk)}
                className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSkill(sk, false)}
                className="p-1.5 rounded-lg text-white/45 hover:text-rose-300 hover:bg-rose-500/15 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      <Modal
        open={Boolean(editingSkill)}
        onClose={() => setEditingSkill(null)}
        title="Edit Skill"
      >
        {editingSkill && (
          <form onSubmit={handleUpdateSkill} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/75 mb-1">Skill Name</label>
              <input
                type="text"
                required
                value={editingSkill.name}
                onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/75 mb-1">Category</label>
              <select
                value={editingSkill.categoryId}
                onChange={(e) =>
                  setEditingSkill({ ...editingSkill, categoryId: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 rounded-xl text-xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/75 mb-1">Description</label>
              <textarea
                rows={2}
                value={editingSkill.description}
                onChange={(e) =>
                  setEditingSkill({ ...editingSkill, description: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <GlassButton
                type="button"
                variant="secondary"
                onClick={() => setEditingSkill(null)}
              >
                Cancel
              </GlassButton>
              <GlassButton type="submit" variant="primary">
                Save Skill
              </GlassButton>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Active Skill References Detected"
        message={confirmDelete?.msg || ''}
        confirmLabel="Confirm Cascade Delete"
        danger
        onConfirm={() => confirmDelete && handleDeleteSkill(confirmDelete.skill, true)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

// ============================================================================
// 4. ADMIN CATEGORIES MANAGEMENT (/admin/categories) - LIQUID GLASS
// ============================================================================
export const AdminCategoriesPage: React.FC = () => {
  const { categories, apiFetch, refreshCatalog, showToast } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingCat, setEditingCat] = useState<any | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await apiFetch('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      showToast('Category created!', 'success');
      setName('');
      setDescription('');
      await refreshCatalog();
    } catch (err: any) {
      showToast(err.message || 'Failed to create category.', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;
    try {
      await apiFetch(`/api/admin/categories/${editingCat.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingCat),
      });
      showToast('Category updated!', 'success');
      setEditingCat(null);
      await refreshCatalog();
    } catch (err: any) {
      showToast(err.message || 'Failed to update category.', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      showToast('Category deleted.', 'info');
      await refreshCatalog();
    } catch (err: any) {
      showToast(err.message || 'Cannot delete category with linked skills.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard level={2} className="p-6">
        <span className="text-[11px] font-mono uppercase tracking-widest text-purple-300">
          Domain Taxonomy
        </span>
        <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
          Skill Categories
        </h1>
        <p className="text-sm text-white/65 mt-1">
          Organize skills into academic and practical taxonomy categories.
        </p>
      </GlassCard>

      <GlassCard level={2} className="p-5">
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category Name (e.g., Cloud Computing)"
            className="sm:col-span-4 px-3.5 py-2.5 rounded-xl text-xs"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description..."
            className="sm:col-span-6 px-3.5 py-2.5 rounded-xl text-xs"
          />
          <GlassButton type="submit" variant="primary" className="sm:col-span-2">
            Add Category
          </GlassButton>
        </form>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <GlassCard
            key={cat.id}
            level={2}
            interactive
            className="p-4 flex items-start justify-between gap-3"
          >
            <div>
              <h3 className="text-sm font-bold text-white">{cat.name}</h3>
              <p className="text-xs text-white/55 mt-1">{cat.description}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setEditingCat(cat)}
                className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(cat.id)}
                className="p-1.5 rounded-lg text-white/45 hover:text-rose-300 hover:bg-rose-500/15 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      <Modal
        open={Boolean(editingCat)}
        onClose={() => setEditingCat(null)}
        title="Edit Category"
      >
        {editingCat && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <input
              type="text"
              required
              value={editingCat.name}
              onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs"
            />
            <textarea
              rows={2}
              value={editingCat.description}
              onChange={(e) => setEditingCat({ ...editingCat, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs"
            />
            <div className="flex justify-end gap-2">
              <GlassButton
                type="button"
                variant="secondary"
                onClick={() => setEditingCat(null)}
              >
                Cancel
              </GlassButton>
              <GlassButton type="submit" variant="primary">
                Save
              </GlassButton>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

// ============================================================================
// 5. ADMIN SESSIONS MONITORING (/admin/sessions) - LIQUID GLASS
// ============================================================================
export const AdminSessionsPage: React.FC = () => {
  const { apiFetch } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ sessions: any[] }>('/api/admin/sessions')
      .then((d) => setSessions(d.sessions || []))
      .finally(() => setLoading(false));
  }, [apiFetch]);

  return (
    <div className="space-y-6">
      <GlassCard level={2} className="p-6">
        <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300">
          Session Ledger
        </span>
        <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
          Platform Learning Sessions
        </h1>
        <p className="text-sm text-white/65 mt-1">
          Audit scheduled, completed, and rated learning sessions across all students.
        </p>
      </GlassCard>

      {loading ? (
        <LoadingSkeleton count={4} height="h-24" />
      ) : (
        <GlassCard level={2} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/[0.04] border-b border-white/10 text-white/55 font-mono uppercase">
                  <th className="py-3.5 px-4">Skill</th>
                  <th className="py-3.5 px-4">Teacher</th>
                  <th className="py-3.5 px-4">Learner</th>
                  <th className="py-3.5 px-4">Date &amp; Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{s.skillName}</td>
                    <td className="py-3.5 px-4 text-white/75">{s.teacherName}</td>
                    <td className="py-3.5 px-4 text-white/75">{s.learnerName}</td>
                    <td className="py-3.5 px-4 font-mono text-white/65">
                      {s.scheduledDate} · {s.startTime} ({s.duration}m)
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-md bg-white/[0.06] border border-white/12 font-mono font-bold text-white/85">
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-white/65">
                      {s.review ? <RatingStars rating={s.review.rating} /> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

// ============================================================================
// 6. ADMIN REPORTS MODERATION (/admin/reports) - LIQUID GLASS
// ============================================================================
export const AdminReportsPage: React.FC = () => {
  const { apiFetch, showToast } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ reports: any[] }>('/api/admin/reports');
      setReports(data.reports || []);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleResolveReport = async (
    reportId: number,
    status: string,
    deactivateReportedUser = false
  ) => {
    try {
      const res = await apiFetch<{ message: string }>(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        body: JSON.stringify({ status, deactivateReportedUser }),
      });
      showToast(res.message, 'success');
      await loadReports();
    } catch (err: any) {
      showToast(err.message || 'Failed to update report.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard level={2} className="p-6">
        <span className="text-[11px] font-mono uppercase tracking-widest text-rose-300">
          Trust &amp; Safety
        </span>
        <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
          User Reports &amp; Moderation
        </h1>
        <p className="text-sm text-white/65 mt-1">
          Review student misconduct reports and take appropriate account actions.
        </p>
      </GlassCard>

      {loading ? (
        <LoadingSkeleton count={3} height="h-32" />
      ) : reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((r) => (
            <GlassCard
              key={r.id}
              level={2}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="px-2.5 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-400/30 font-bold">
                    Reason: {r.reason}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-white/[0.06] text-white/75 border border-white/12 font-bold">
                    Status: {r.status}
                  </span>
                </div>
                <p className="text-sm font-bold text-white pt-1">
                  Reported User: {r.reportedName} ({r.reportedEmail})
                </p>
                <p className="text-white/50">
                  Reported by: {r.reporterName} · {new Date(r.createdAt).toLocaleString()}
                </p>
                {r.description && (
                  <p className="text-white/75 pt-1">&ldquo;{r.description}&rdquo;</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <GlassButton
                  variant="secondary"
                  size="sm"
                  onClick={() => handleResolveReport(r.id, 'Reviewed', false)}
                >
                  Mark Reviewed
                </GlassButton>
                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={() => handleResolveReport(r.id, 'Resolved', false)}
                >
                  Resolve
                </GlassButton>
                <GlassButton
                  variant="danger"
                  size="sm"
                  onClick={() => handleResolveReport(r.id, 'Resolved', true)}
                >
                  Resolve &amp; Deactivate User
                </GlassButton>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No user reports submitted."
          description="All student interactions are currently in good standing."
        />
      )}
    </div>
  );
};

// ============================================================================
// 7. ADMIN SETTINGS & BCA VIVA DOCUMENTATION (/admin/settings) - LIQUID GLASS
// ============================================================================
export const AdminSettingsPage: React.FC = () => {
  const { apiFetch, showToast, refreshCatalog } = useAuth();
  const [seeding, setSeeding] = useState(false);

  const handleReseed = async () => {
    setSeeding(true);
    try {
      const res = await apiFetch<{ message: string }>('/api/admin/seed', { method: 'POST' });
      showToast(res.message, 'success');
      await refreshCatalog();
    } catch (err: any) {
      showToast(err.message || 'Failed to seed data.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <GlassCard level={2} className="p-6">
        <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-300">
          System Configuration &amp; Academic Documentation
        </span>
        <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
          Platform Configuration &amp; BCA Project Viva Guide
        </h1>
        <p className="text-sm text-white/65 mt-1">
          Architecture overview, rule-based matching documentation, and database management.
        </p>
      </GlassCard>

      {/* Demo Data Seeder */}
      <GlassCard level={2} className="p-6 space-y-4">
        <h2 className="text-base font-bold text-white">Demo Campus Data Management</h2>
        <p className="text-xs text-white/65 leading-relaxed">
          SkillBridge separates real authenticated student accounts (
          <code className="text-cyan-300">is_demo = false</code>) from sample campus peers (Rahul
          Sharma, Priya Patel, Aman Verma, Neha Gupta, Arjun Nair marked with{' '}
          <code className="text-cyan-300">is_demo = true</code>).
        </p>
        <GlassButton
          variant="primary"
          disabled={seeding}
          onClick={handleReseed}
        >
          {seeding ? 'Verifying Demo Data...' : 'Verify / Restore Sample Campus Peers & Catalog'}
        </GlassButton>
      </GlassCard>

      {/* Rule-Based Matching Viva Explanation */}
      <GlassCard level={2} className="p-6 space-y-4">
        <h2 className="text-base font-bold text-white">
          Rule-Based Peer Matching Algorithm (BCA Viva Explanation)
        </h2>
        <p className="text-xs text-white/65 leading-relaxed">
          Unlike black-box machine learning models, SkillBridge uses a deterministic, explainable
          <strong className="text-white"> Rule-Based Compatibility Scoring Engine</strong> over
          relational PostgreSQL tables (<code className="text-cyan-300">user_teaching_skills</code>{' '}
          and <code className="text-cyan-300">user_learning_skills</code>):
        </p>
        <ul className="list-disc pl-5 text-xs text-white/75 space-y-2">
          <li>
            <strong className="text-indigo-300">+50 Points (Direct Learning Match):</strong> Awarded
            if Peer B can teach at least one skill that Student A wants to learn.
          </li>
          <li>
            <strong className="text-emerald-300">+30 Points (Mutual Exchange Match):</strong>{' '}
            Awarded if Student A can also teach at least one skill that Peer B wants to learn
            (creating a two-way barter of knowledge).
          </li>
          <li>
            <strong className="text-cyan-300">+10 Points (Category Affinity):</strong> Awarded if
            both students share skills within the same academic domain category.
          </li>
          <li>
            <strong className="text-amber-300">
              +10 Points (Schedule Availability Overlap):
            </strong>{' '}
            Awarded if both students have compatible study windows (e.g., Weekdays, Weekends,
            Evenings).
          </li>
        </ul>
      </GlassCard>

      {/* Creating Admin Account Securely */}
      <GlassCard level={2} className="p-6 space-y-3">
        <h2 className="text-base font-bold text-white">
          How to Create / Promote an Admin Account Securely
        </h2>
        <p className="text-xs text-white/65 leading-relaxed">
          For security, all public registrations default to{' '}
          <code className="text-cyan-300">role = &apos;STUDENT&apos;</code> and no frontend endpoint
          permits self-promotion to <code className="text-purple-300">ADMIN</code>. To promote a
          verified user to Administrator at the database level, execute:
        </p>
        <pre className="p-4 rounded-xl bg-[#07070B]/90 border border-white/12 text-emerald-300 text-xs font-mono overflow-x-auto">
          {`UPDATE profiles SET role = 'ADMIN' WHERE email = 'admin@university.edu';`}
        </pre>
      </GlassCard>
    </div>
  );
};
