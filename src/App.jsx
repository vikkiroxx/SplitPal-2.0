import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();
  if (loading) return (
    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Loading SplitPal...</div>
    </div>
  );
  if (!session) return <Navigate to="/login" replace />;
  return children;
};

import AddExpense from './components/AddExpense';
import Layout from './components/Layout';

import SplitMath from './components/SplitMath';
import FriendsList from './components/FriendsList';
import FriendDetails from './components/FriendDetails';
import SettleUp from './components/SettleUp';
import GroupsList from './components/GroupsList';
import GroupDetails from './components/GroupDetails';
import Settings from './components/Settings';
import GlobalLiveSync from './components/GlobalLiveSync';
import ActivityLog from './components/ActivityLog';

const AppRoutes = () => {
  const { session } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Layout><GlobalLiveSync /><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      {/* Settle doesn't have Layout, so we drop the global sync explicitly inside its ProtectedRoute! */}
      <Route path="/add-expense" element={<ProtectedRoute><GlobalLiveSync /><AddExpense /></ProtectedRoute>} />
      <Route path="/split" element={<ProtectedRoute><GlobalLiveSync /><SplitMath /></ProtectedRoute>} />
      <Route path="/settle" element={<ProtectedRoute><GlobalLiveSync /><SettleUp /></ProtectedRoute>} />
      {/* Navigation routes */}
      <Route path="/friends" element={<ProtectedRoute><Layout><GlobalLiveSync /><FriendsList /></Layout></ProtectedRoute>} />
      <Route path="/friend/:id" element={<ProtectedRoute><GlobalLiveSync /><FriendDetails /></ProtectedRoute>} />
      <Route path="/groups" element={<ProtectedRoute><Layout><GlobalLiveSync /><GroupsList /></Layout></ProtectedRoute>} />
      <Route path="/group/:id" element={<ProtectedRoute><GlobalLiveSync /><GroupDetails /></ProtectedRoute>} />
      <Route path="/activity" element={<ProtectedRoute><GlobalLiveSync /><ActivityLog /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><GlobalLiveSync /><Settings /></Layout></ProtectedRoute>} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
