import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }) {
	const location = useLocation();
	const navigate = useNavigate();
	const { user, logout, hasPermission } = useAuth();
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	const isActive = (path) => location.pathname === path;

	const handleLogout = async () => {
		await logout();
		navigate('/login');
	};

	const handleNavClick = () => {
		setIsDrawerOpen(false);
	};

	const allNavItems = [
		{ path: '/', label: 'Dashboard', icon: '📊', permission: 'bills.view' },
		{ path: '/bills/create', label: 'Bill cầu', icon: '➕', permission: 'bills.create' },
		{ path: '/party-bills', label: 'Bill tiệc', icon: '🍽️', permission: 'bills.view' },
		{ path: '/players', label: 'Người chơi', icon: '👥', permission: 'users.view' },
		{ path: '/tournament-brackets', label: 'Xếp bảng thi đấu', icon: '🏆', permission: null },
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
						<div className="flex items-center">
							{/* Mobile Menu Button */}
							<button
								onClick={() => setIsDrawerOpen(true)}
								className="sm:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
								<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							</button>
							{/* Desktop Navigation */}
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
									<div className="hidden sm:block text-sm text-gray-700">
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

			{/* Mobile Drawer */}
			{isDrawerOpen && (
				<>
					{/* Backdrop */}
					<div
						className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
						onClick={() => setIsDrawerOpen(false)}
					/>
					{/* Drawer */}
					<div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out sm:hidden">
						<div className="flex flex-col h-full">
							{/* Drawer Header */}
							<div className="flex items-center justify-between p-4 border-b border-gray-200">
								<h2 className="text-lg font-semibold text-gray-900">Menu</h2>
								<button
									onClick={() => setIsDrawerOpen(false)}
									className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100">
									<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
							{/* Drawer Content */}
							<div className="flex-1 overflow-y-auto">
								<nav className="p-4 space-y-1">
									{navItems.map((item) => (
										<Link
											key={item.path}
											to={item.path}
											onClick={handleNavClick}
											className={`flex items-center px-4 py-3 rounded-md text-base font-medium transition-colors ${
												isActive(item.path)
													? "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
													: "text-gray-700 hover:bg-gray-100"
											}`}>
											<span className="mr-3 text-xl">{item.icon}</span>
											{item.label}
										</Link>
									))}
								</nav>
							</div>
							{/* Drawer Footer */}
							{user && (
								<div className="p-4 border-t border-gray-200">
									<div className="text-sm text-gray-700 mb-2">
										<div className="font-medium">{user.name}</div>
										<div className="text-xs text-gray-500">
											{user.roles?.map((r) => r.display_name).join(', ') || 'Chưa có quyền'}
										</div>
									</div>
									<button
										onClick={handleLogout}
										className="w-full px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50">
										Đăng xuất
									</button>
								</div>
							)}
						</div>
					</div>
				</>
			)}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

