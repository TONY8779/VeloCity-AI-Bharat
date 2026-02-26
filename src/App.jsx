import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { NotificationToast } from './components/common/NotificationToast';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { AppLayout } from './components/layout/AppLayout';
import { Zap } from 'lucide-react';

// Lazy-load heavy view components for code splitting
const Dashboard = lazy(() => import('./components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const RoadmapView = lazy(() => import('./components/roadmap/RoadmapView').then(m => ({ default: m.RoadmapView })));
const NotebookView = lazy(() => import('./components/notebook/NotebookView').then(m => ({ default: m.NotebookView })));
const StudioView = lazy(() => import('./components/studio/StudioView').then(m => ({ default: m.StudioView })));
const GrowthView = lazy(() => import('./components/growth/GrowthView').then(m => ({ default: m.GrowthView })));
const AssetManager = lazy(() => import('./components/assets/AssetManager').then(m => ({ default: m.AssetManager })));

// Phase 1 — Intelligence
const TrendHunterView = lazy(() => import('./components/trends/TrendHunterView').then(m => ({ default: m.TrendHunterView })));
const CompetitorView = lazy(() => import('./components/competitors/CompetitorView').then(m => ({ default: m.CompetitorView })));
const BriefingView = lazy(() => import('./components/briefing/BriefingView').then(m => ({ default: m.BriefingView })));

// Phase 2 — Creation
const ThumbMasterView = lazy(() => import('./components/thumbmaster/ThumbMasterView').then(m => ({ default: m.ThumbMasterView })));
const TitleCraftView = lazy(() => import('./components/titlecraft/TitleCraftView').then(m => ({ default: m.TitleCraftView })));
const EvergreenView = lazy(() => import('./components/evergreen/EvergreenView').then(m => ({ default: m.EvergreenView })));

// Phase 3 — Distribution
const CommentGeniusView = lazy(() => import('./components/commentgenius/CommentGeniusView').then(m => ({ default: m.CommentGeniusView })));

// Phase 4 — Platform
const SafeGuardView = lazy(() => import('./components/safeguard/SafeGuardView').then(m => ({ default: m.SafeGuardView })));

// Admin Panel
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminOverview = lazy(() => import('./components/admin/AdminOverview').then(m => ({ default: m.AdminOverview })));
const AdminUsers = lazy(() => import('./components/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminCompanies = lazy(() => import('./components/admin/AdminCompanies').then(m => ({ default: m.AdminCompanies })));
const AdminDatabase = lazy(() => import('./components/admin/AdminDatabase').then(m => ({ default: m.AdminDatabase })));
const AdminActivity = lazy(() => import('./components/admin/AdminActivity').then(m => ({ default: m.AdminActivity })));
const AdminExport = lazy(() => import('./components/admin/AdminExport').then(m => ({ default: m.AdminExport })));
const AdminSettings = lazy(() => import('./components/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center animate-pulse">
        <Zap size={20} className="text-[#050506]" />
      </div>
    </div>
  );
}

const L = ({ children }) => <Suspense fallback={<PageLoader />}>{children}</Suspense>;

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <NotificationToast />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<L><Dashboard /></L>} />
                <Route path="roadmap" element={<L><RoadmapView /></L>} />
                <Route path="notebook" element={<L><NotebookView /></L>} />
                <Route path="studio" element={<L><StudioView /></L>} />
                <Route path="growth" element={<L><GrowthView /></L>} />
                <Route path="assets" element={<L><AssetManager /></L>} />
                {/* Intelligence */}
                <Route path="trends" element={<L><TrendHunterView /></L>} />
                <Route path="competitors" element={<L><CompetitorView /></L>} />
                <Route path="briefing" element={<L><BriefingView /></L>} />
                {/* Creation */}
                <Route path="thumbmaster" element={<L><ThumbMasterView /></L>} />
                <Route path="titlecraft" element={<L><TitleCraftView /></L>} />
                <Route path="evergreen" element={<L><EvergreenView /></L>} />
                {/* Distribution */}
                <Route path="commentgenius" element={<L><CommentGeniusView /></L>} />
                {/* Platform */}
                <Route path="safeguard" element={<L><SafeGuardView /></L>} />
              </Route>
              {/* Admin Panel */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <L><AdminLayout /></L>
                  </ProtectedRoute>
                }
              >
                <Route index element={<L><AdminOverview /></L>} />
                <Route path="users" element={<L><AdminUsers /></L>} />
                <Route path="companies" element={<L><AdminCompanies /></L>} />
                <Route path="database" element={<L><AdminDatabase /></L>} />
                <Route path="activity" element={<L><AdminActivity /></L>} />
                <Route path="export" element={<L><AdminExport /></L>} />
                <Route path="settings" element={<L><AdminSettings /></L>} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

