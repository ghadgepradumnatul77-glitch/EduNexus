import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AttendancePage from './pages/AttendancePage';
import MarksPage from './pages/MarksPage';
import UsersPage from './pages/UsersPage';
import AdminDashboard from './pages/AdminDashboard';
import BetaFeedbackPage from './pages/BetaFeedbackPage';
import NoticeBoardPage from './pages/NoticeBoardPage';
import AcademicHubPage from './pages/AcademicHubPage';
import SkillExchangePage from './pages/SkillExchangePage';
import LostFoundPage from './pages/LostFoundPage';

import AppLayout from './components/layout/AppLayout';
import InfraLayout from './pages/infra/InfraLayout';
import InfraLogin from './pages/infra/InfraLogin';
import InfraDashboard from './pages/infra/InfraDashboard';

import ErrorBoundary from './components/ui/ErrorBoundary';

function App() {
    return (
        <AuthProvider>
            <ErrorBoundary>
                <BrowserRouter>
                    <Routes>
                        <Route path="/infra/login" element={<InfraLogin />} />
                        <Route path="/infra" element={<InfraLayout />}>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<InfraDashboard />} />
                            <Route path="tenants" element={<InfraDashboard />} />
                        </Route>

                        <Route path="/login" element={<Login />} />

                        <Route path="/app" element={<AppLayout />}>
                            <Route index element={<Navigate to="student-dashboard" replace />} />

                            {/* Role-Specific Dashboards */}
                            <Route path="student-dashboard" element={<ProtectedRoute allowedRoles={['Student']}><StudentDashboard /></ProtectedRoute>} />
                            <Route path="faculty-dashboard" element={<ProtectedRoute allowedRoles={['Faculty']}><FacultyDashboard /></ProtectedRoute>} />
                            <Route path="admin-dashboard" element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><AdminDashboard /></ProtectedRoute>} />

                            {/* Shared Academic & Campus Modules */}
                            <Route path="attendance" element={<ProtectedRoute allowedRoles={['Student', 'Faculty', 'Admin']}><AttendancePage /></ProtectedRoute>} />
                            <Route path="marks" element={<ProtectedRoute allowedRoles={['Student', 'Faculty', 'Admin']}><MarksPage /></ProtectedRoute>} />
                            <Route path="notice-board" element={<ProtectedRoute allowedRoles={['Student', 'Faculty', 'Admin']}><NoticeBoardPage /></ProtectedRoute>} />
                            <Route path="academic-hub" element={<ProtectedRoute allowedRoles={['Student', 'Faculty', 'Admin']}><AcademicHubPage /></ProtectedRoute>} />
                            <Route path="skills" element={<ProtectedRoute allowedRoles={['Student', 'Faculty', 'Admin']}><SkillExchangePage /></ProtectedRoute>} />
                            <Route path="lost-found" element={<ProtectedRoute allowedRoles={['Student', 'Faculty', 'Admin']}><LostFoundPage /></ProtectedRoute>} />

                            {/* Administration Modules */}
                            <Route path="users" element={<ProtectedRoute allowedRoles={['Admin']}><UsersPage /></ProtectedRoute>} />
                            <Route path="settings" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
                            <Route path="beta-feedback" element={<ProtectedRoute allowedRoles={['Admin']}><BetaFeedbackPage /></ProtectedRoute>} />
                            <Route path="beta-feedback" element={<ProtectedRoute allowedRoles={['Admin']}><BetaFeedbackPage /></ProtectedRoute>} />
                        </Route>

                        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
                        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
                    </Routes>
                </BrowserRouter>
            </ErrorBoundary>
        </AuthProvider>
    );
}

export default App;
