import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import {
  AppLayout,
  ProtectedRoute,
  AdminRoute,
} from './components/layout/AppLayout.tsx';
import {
  LandingPage,
  LoginPage,
  RegisterPage,
  VerifyEmailPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ErrorPage,
} from './pages/PublicPages.tsx';
import {
  DashboardPage,
  DiscoverPeersPage,
  MySkillsPage,
} from './pages/StudentCorePages.tsx';
import {
  RequestsPage,
  ConnectionsPage,
  SessionsPage,
  MessagesPage,
} from './pages/StudentExchangePages.tsx';
import {
  ProgressPage,
  GoalsPage,
  NotificationsPage,
  ProfilePage,
  SettingsPage,
} from './pages/StudentGrowthPages.tsx';
import {
  AdminDashboardPage,
  AdminUsersPage,
  AdminSkillsPage,
  AdminCategoriesPage,
  AdminSessionsPage,
  AdminReportsPage,
  AdminSettingsPage,
} from './pages/AdminPages.tsx';
import { PrdPage } from './pages/PrdPage.tsx';
import {
  SkillBattleLobbyPage,
  SkillBattleMatchmakingPage,
  SkillBattleRoomPage,
  SkillBattleResultPage,
  SkillBattleHistoryPage,
  SkillBattleLeaderboardPage,
  SkillBattleStatsPage,
} from './pages/SkillBattlePages.tsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/prd" element={<PrdPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Student Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/discover"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DiscoverPeersPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/battle"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SkillBattleLobbyPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/battle/matchmaking"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SkillBattleMatchmakingPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/battle/room/:battleId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SkillBattleRoomPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/battle/result/:battleId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SkillBattleResultPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/battle/history"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SkillBattleHistoryPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/battle/leaderboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SkillBattleLeaderboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/battle/stats"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SkillBattleStatsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-skills"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MySkillsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <RequestsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/connections"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ConnectionsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SessionsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MessagesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProgressPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <GoalsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <NotificationsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SettingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AppLayout>
                    <AdminDashboardPage />
                  </AppLayout>
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AppLayout>
                    <AdminUsersPage />
                  </AppLayout>
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/skills"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AppLayout>
                    <AdminSkillsPage />
                  </AppLayout>
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AppLayout>
                    <AdminCategoriesPage />
                  </AppLayout>
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sessions"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AppLayout>
                    <AdminSessionsPage />
                  </AppLayout>
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AppLayout>
                    <AdminReportsPage />
                  </AppLayout>
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AppLayout>
                    <AdminSettingsPage />
                  </AppLayout>
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          {/* Error Routes */}
          <Route path="/403" element={<ErrorPage code="403" />} />
          <Route path="/500" element={<ErrorPage code="500" />} />
          <Route path="*" element={<ErrorPage code="404" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
