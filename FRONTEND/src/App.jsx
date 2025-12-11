import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './screens/auth/Login';
import Dashboard from './screens/dashboard/Dashboard';
import PlayersManagement from './screens/players/PlayersManagement';
import RatiosManagement from './screens/ratios/RatiosManagement';
import MenusManagement from './screens/menus/MenusManagement';
import ShuttlesManagement from './screens/shuttles/ShuttlesManagement';
import CreateBill from './screens/bills/CreateBill';
import BillDetail from './screens/bills/BillDetail';
import PaymentAccountsManagement from './screens/payment-accounts/PaymentAccountsManagement';
import RolesManagement from './screens/roles/RolesManagement';
import PartyBills from './screens/party/PartyBills';
import TournamentBrackets from './screens/tournament/TournamentBrackets';

function HomeRedirect() {
	const { hasPermission } = useAuth();

	if (hasPermission('bills.view')) {
		return <Dashboard />;
	}

	if (hasPermission('tournament_brackets.view')) {
		return <TournamentBrackets />;
	}

	if (hasPermission('party_bills.view')) {
		return <PartyBills />;
	}

	// Fallback: no relevant permission
	return <div className="p-6 text-center text-gray-600">Bạn chưa được cấp quyền truy cập bất kỳ chức năng nào.</div>;
}

function LoginRoute() {
	const { user, loading } = useAuth();
	
	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-gray-600">Đang tải...</div>
			</div>
		);
	}
	
	if (user) {
		return <Navigate to="/" replace />;
	}
	
	return <Login />;
}

function AppRoutes() {
	return (
		<Routes>
			<Route path="/login" element={<LoginRoute />} />
			<Route
				path="/"
				element={
					<ProtectedRoute>
						<Layout>
							<HomeRedirect />
						</Layout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/players"
				element={
					<ProtectedRoute requiredPermission="users.view">
						<Layout>
							<PlayersManagement />
						</Layout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/ratios"
				element={
					<ProtectedRoute requiredPermission="ratios.view">
						<Layout>
							<RatiosManagement />
						</Layout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/menus"
				element={
					<ProtectedRoute requiredPermission="menus.view">
						<Layout>
							<MenusManagement />
						</Layout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/shuttles"
				element={
					<ProtectedRoute requiredPermission="shuttles.view">
						<Layout>
							<ShuttlesManagement />
						</Layout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/bills/create"
				element={
					<ProtectedRoute requiredPermission="bills.create">
						<Layout>
							<CreateBill />
						</Layout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/party-bills"
				element={
					<ProtectedRoute requiredPermission="party_bills.view">
						<Layout>
							<PartyBills />
						</Layout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/bills/:id"
				element={
					<ProtectedRoute requiredPermission="bills.view">
						<Layout>
							<BillDetail />
						</Layout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/payment-accounts"
				element={
					<ProtectedRoute requiredPermission="payment_accounts.view">
						<Layout>
							<PaymentAccountsManagement />
						</Layout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/roles"
				element={
					<ProtectedRoute requiredPermission="roles.view">
						<Layout>
							<RolesManagement />
						</Layout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/tournament-brackets"
				element={
					<ProtectedRoute requiredPermission="tournament_brackets.view">
						<Layout>
							<TournamentBrackets />
						</Layout>
					</ProtectedRoute>
				}
			/>
		</Routes>
	);
}

function App() {
	return (
		<Router>
			<AuthProvider>
				<AppRoutes />
			</AuthProvider>
		</Router>
	);
}

export default App;
