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
							<Dashboard />
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
					<ProtectedRoute requiredPermission="bills.view">
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
