import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }) {
	const location = useLocation();
	const navigate = useNavigate();
	const { user, logout, hasPermission } = useAuth();

	const isActive = (path) => location.pathname === path;

	const handleLogout = async () => {
		await logout();
		navigate('/login');
	};

	const allNavItems = [
		{ path: '/', label: 'Dashboard', icon: '📊', permission: 'bills.view' },
		{ path: '/bills/create', label: 'Tạo Bill', icon: '➕', permission: 'bills.create' },
		{ path: '/players', label: 'Người chơi', icon: '👥', permission: 'users.view' },
		{ path: '/ratios', label: 'Mức tính', icon: '⚖️', permission: 'ratios.view' },
		{ path: '/menus', label: 'Menu nước', icon: '🥤', permission: 'menus.view' },
		{ path: '/shuttles', label: 'Loại cầu', icon: '🏸', permission: 'shuttles.view' },
		{ path: '/payment-accounts', label: 'TK nhận tiền', icon: '💳', permission: 'payment_accounts.view' },
		{ path: '/roles', label: 'Quyền', icon: '🔐', permission: 'roles.view' },
	];

	// Filter nav items based on permissions
	const navItems = allNavItems.filter((item) => !item.permission || hasPermission(item.permission));

	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16">
						<div className="flex">
							{/* <div className="flex-shrink-0 flex items-center">
								<h1 className="text-xl font-bold text-gray-900">Badminton Court Management</h1>
							</div> */}
							<div className="hidden sm:ml-6 sm:flex sm:space-x-8">
								{navItems.map((item) => (
									<Link
										key={item.path}
										to={item.path}
										className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
											isActive(item.path)
												? "border-blue-500 text-gray-900"
												: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
										}`}>
										<span className="mr-2">{item.icon}</span>
										{item.label}
									</Link>
								))}
							</div>
						</div>
						<div className="flex items-center space-x-4">
							{user && (
								<>
									<div className="text-sm text-gray-700">
										<div className="font-medium">{user.name}</div>
										<div className="text-xs text-gray-500">
											{user.roles?.map((r) => r.display_name).join(', ') || 'Chưa có quyền'}
										</div>
									</div>
									<button
										onClick={handleLogout}
										className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50">
										Đăng xuất
									</button>
								</>
							)}
						</div>
					</div>
				</div>
			</nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

