import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-12 h-12 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0) {
        const userRole = user.role?.toLowerCase();
        const isAllowed = allowedRoles.some(role => role.toLowerCase() === userRole);

        if (!isAllowed) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-800 mb-4">403</h1>
                        <p className="text-gray-600">Access Denied. Insufficient permissions.</p>
                    </div>
                </div>
            );
        }
    }

    return children;
};

export default ProtectedRoute;
