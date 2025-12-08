import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requiredPermission = null }) {
	const { user, loading, hasPermission } = useAuth();

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="text-gray-600">Đang tải...</div>
				</div>
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	if (requiredPermission && !hasPermission(requiredPermission)) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="text-red-600 text-xl font-semibold mb-2">Không có quyền truy cập</div>
					<div className="text-gray-600">Bạn không có quyền để truy cập trang này.</div>
				</div>
			</div>
		);
	}

	return children;
}

