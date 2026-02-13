import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import Login from './pages/Login';
import Orders from './pages/Orders';
import Dashboard from './pages/Dashboard';
import Statistics from './pages/Statistics';
import Mine from './pages/Mine';
import OrderSearch from './pages/mine/OrderSearch';
import DataStats from './pages/mine/DataStats';
import CallbackRate from './pages/mine/CallbackRate';
import PlatformBind from './pages/mine/PlatformBind';
import DeliveryBind from './pages/mine/DeliveryBind';
import OrderSettings from './pages/mine/OrderSettings';
import DeliverySettings from './pages/mine/DeliverySettings';
import PlatformPerformance from './pages/mine/PlatformPerformance';
import Layout from './components/Layout';

function App() {
  const { token } = useAuthStore();

  if (!token) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/orders" replace />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/mine" element={<Mine />} />
        <Route path="/mine/order-search" element={<OrderSearch />} />
        <Route path="/mine/data-stats" element={<DataStats />} />
        <Route path="/mine/callback-rate" element={<CallbackRate />} />
        <Route path="/mine/platform-bind" element={<PlatformBind />} />
        <Route path="/mine/delivery-bind" element={<DeliveryBind />} />
        <Route path="/mine/order-settings" element={<OrderSettings />} />
        <Route path="/mine/delivery-settings" element={<DeliverySettings />} />
        <Route path="/mine/platform-performance" element={<PlatformPerformance />} />
      </Routes>
    </Layout>
  );
}

export default App;
