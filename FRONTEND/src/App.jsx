import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './screens/dashboard/Dashboard';
import PlayersManagement from './screens/players/PlayersManagement';
import RatiosManagement from './screens/ratios/RatiosManagement';
import MenusManagement from './screens/menus/MenusManagement';
import ShuttlesManagement from './screens/shuttles/ShuttlesManagement';
import CreateBill from './screens/bills/CreateBill';
import BillDetail from './screens/bills/BillDetail';
import PaymentAccountsManagement from './screens/payment-accounts/PaymentAccountsManagement';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/players" element={<PlayersManagement />} />
          <Route path="/ratios" element={<RatiosManagement />} />
          <Route path="/menus" element={<MenusManagement />} />
          <Route path="/shuttles" element={<ShuttlesManagement />} />
          <Route path="/bills/create" element={<CreateBill />} />
          <Route path="/bills/:id" element={<BillDetail />} />
          <Route path="/payment-accounts" element={<PaymentAccountsManagement />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
