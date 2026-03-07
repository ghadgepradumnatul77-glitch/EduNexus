import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AttendancePage from './pages/AttendancePage';
import MarksPage from './pages/MarksPage';
import UsersPage from './pages/UsersPage';
import AdminDashboard from './pages/AdminDashboard';
import BetaFeedbackPage from './pages/BetaFeedbackPage';
import PlatformLayout from './pages/platform/PlatformLayout';
import PlatformLogin from './pages/platform/PlatformLogin';
import PlatformDashboard from './pages/platform/PlatformDashboard';

import ErrorBoundary from './components/ui/ErrorBoundary';

function App() {
    return (
        <AuthProvider>
            <ErrorBoundary>
                <BrowserRouter>
                    <Routes>
                        {/* Platform Admin Control Plane */}
                        <Route path="/platform/login" element={<PlatformLogin />} />
                        <Route path="/platform" element={<PlatformLayout />}>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<PlatformDashboard />} />
                            <Route path="tenants" element={<PlatformDashboard />} /> {/* Reusing for now */}
                        </Route>

                        <Route path="/login" element={<Login />} />

                        <Route path="/dashboard" element={
                            <ProtectedRoute allowedRoles={['Student', 'Faculty', 'Admin']}><Dashboard /></ProtectedRoute>
                        } />

                        <Route path="/attendance" element={
                            <ProtectedRoute allowedRoles={['Student', 'Faculty', 'Admin']}><AttendancePage /></ProtectedRoute>
                        } />

                        <Route path="/marks" element={
                            <ProtectedRoute allowedRoles={['Student', 'Faculty', 'Admin']}><MarksPage /></ProtectedRoute>
                        } />

                        <Route path="/users" element={
                            <ProtectedRoute allowedRoles={['Admin', 'Super Admin']}>
                                <UsersPage />
                            </ProtectedRoute>
                        } />

                        <Route path="/admin" element={
                            <ProtectedRoute allowedRoles={['Super Admin']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        } />

                        <Route path="/beta-feedback" element={
                            <ProtectedRoute allowedRoles={['Admin', 'Super Admin']}>
                                <BetaFeedbackPage />
                            </ProtectedRoute>
                        } />

                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </BrowserRouter>
            </ErrorBoundary>
        </AuthProvider>
    );
}

export default App;
