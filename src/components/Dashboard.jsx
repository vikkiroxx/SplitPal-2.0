import { useAuth } from './AuthProvider';
import { LogOut, Trash2, Edit2, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [balance, setBalance] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifHistory, setNotifHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('splitpal_notifs');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    const handleNotifSync = () => {
      try {
        const saved = localStorage.getItem('splitpal_notifs');
        if (saved) setNotifHistory(JSON.parse(saved));
      } catch(e) {}
    };
    window.addEventListener('splitpal_notif_sync', handleNotifSync);
    return () => window.removeEventListener('splitpal_notif_sync', handleNotifSync);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // 1. Fetch recent activity mathematically correctly globally
      const { data: myCreated } = await supabase.from('expenses').select('*').eq('creator_id', user.id);
      const { data: myInvolved } = await supabase.from('expenses').select('*, expense_splits!inner(user_id)').eq('expense_splits.user_id', user.id);
      
      const allExp = [...(myCreated || []), ...(myInvolved || [])];
      const uniqueExpMap = new Map();
      allExp.forEach(e => uniqueExpMap.set(e.id, { id: e.id, description: e.description, total_amount: e.total_amount, created_at: e.created_at, creator_id: e.creator_id }));
      const sortedExp = Array.from(uniqueExpMap.values()).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      
      setExpenses(sortedExp);

      // 2. Fetch Balance (What others owe you)
      const { data: othersOweMe } = await supabase
        .from('expense_splits')
        .select('amount_owed, has_paid, user_id, expenses!inner(creator_id)')
        .eq('expenses.creator_id', user.id)
        .neq('user_id', user.id)
        .eq('has_paid', false);

      // 3. Fetch Balance (What you owe others)
      const { data: iOweOthers } = await supabase
        .from('expense_splits')
        .select('amount_owed, has_paid, user_id, expenses!inner(creator_id)')
        .eq('user_id', user.id)
        .neq('expenses.creator_id', user.id)
        .eq('has_paid', false);

      const totalOwedToMe = othersOweMe?.reduce((sum, split) => sum + Number(split.amount_owed), 0) || 0;
      const totalIOwe = iOweOthers?.reduce((sum, split) => sum + Number(split.amount_owed), 0) || 0;
      
      setBalance(totalOwedToMe - totalIOwe);
    };
    fetchData();
  }, [user, refreshTrigger]);
  
  useEffect(() => {
    if (!user) return;
    
    // Listen for mathematically destructive updates from the Global Synchronizer
    const handleDbUpdate = () => {
       setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('splitpal_db_update', handleDbUpdate);
    return () => window.removeEventListener('splitpal_db_update', handleDbUpdate);
  }, [user]);

  const handleDelete = async (expenseId) => {
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this expense? This will also wipe the split debts from your friends' balances.");
    if (!confirmDelete) return;

    // Fetch explicitly mapped involved users mechanically for Activity Tracking
    const { data: exp } = await supabase.from('expenses').select('*, expense_splits(user_id)').eq('id', expenseId).single();
    if (exp) {
       const inv = exp.expense_splits.map(s => s.user_id);
       await supabase.from('activity_logs').insert([{
         user_id: user.id,
         involved_users: inv,
         action_type: 'DELETED',
         description: `${user?.user_metadata?.full_name || 'Someone'} deleted "${exp.description}"`
       }]);
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (!error) {
       setRefreshTrigger(prev => prev + 1); // Auto-refreshes the dashboard mathematically
    } else {
       alert("Failed to delete expense.");
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem' }}>
      
      {showNotifModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ background: 'var(--color-bg-dark)', padding: '2rem', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', minHeight: '50vh', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Notifications</h2>
              <button className="pill-button" onClick={() => setShowNotifModal(false)} style={{ background: 'var(--color-card-dark)', color: 'var(--color-text-primary)', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Close</button>
            </header>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem' }}>
              {notifHistory.length === 0 ? (
                 <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: '3rem' }}>No notifications yet.</p>
              ) : (
                notifHistory.map(n => (
                  <div key={n.id} style={{ background: 'var(--color-card-dark)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', borderLeft: '4px solid var(--color-accent-green)' }}>
                    <div style={{ fontSize: '1.05rem', color: 'var(--color-text-primary)', marginBottom: '0.3rem' }}>{n.msg}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{new Date(n.time).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
            {notifHistory.length > 0 && (
               <button onClick={() => { setNotifHistory([]); localStorage.removeItem('splitpal_notifs'); }} style={{ background: 'transparent', color: 'var(--color-accent-orange)', padding: '1rem', marginTop: 'auto', fontWeight: 600 }}>
                 Clear History
               </button>
            )}
          </div>
        </div>
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', marginBottom: '2rem' }}>
         <div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', fontWeight: 500, margin: '0 0 0.2rem 0' }}>Hi there,</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, lineHeight: 1 }}>{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Friend'}</h1>
              <span style={{ background: 'var(--color-card-dark)', color: 'var(--color-text-secondary)', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '10px', fontWeight: 700 }}>v2.3</span>
            </div>
         </div>
         <div style={{ display: 'flex', gap: '1rem' }}>
           <button onClick={() => navigate('/activity')} style={{ background: 'var(--color-card-dark)', color: 'var(--color-text-primary)', padding: '0.75rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Activity size={20} />
           </button>
           <button onClick={signOut} style={{ background: 'var(--color-card-dark)', color: 'white', padding: '0.75rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <LogOut size={20} />
           </button>
         </div>
      </header>

      <div className="card-glass" style={{ marginBottom: '2rem', padding: '2rem 1.5rem' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', margin: '0 0 0.5rem 0', fontWeight: 500 }}>Your Balance is</p>
        <h2 style={{ fontSize: '3.5rem', fontWeight: 700, margin: '0 0 1.5rem 0', letterSpacing: '-1px', color: balance < 0 ? 'var(--color-accent-orange)' : 'var(--color-text-primary)' }}>
          {balance < 0 ? '-' : ''}₹{Math.abs(balance).toFixed(2)}
        </h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate('/settle')} className="pill-button" style={{ backgroundColor: 'var(--color-accent-green)', flex: 1, color: 'var(--color-text-primary)' }}>
            Settle Up
          </button>
          <button onClick={() => navigate('/add-expense')} className="pill-button" style={{ backgroundColor: 'var(--color-accent-yellow)', flex: 1, color: 'var(--color-text-primary)' }}>
            + Add Expense
          </button>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem' }}>Recent Activity</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {expenses.length === 0 ? (
            <div style={{ background: 'var(--color-input-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius-md)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No recent transactions.
            </div>
          ) : (
            expenses.map(exp => (
              <div key={exp.id} className="card-glass" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-card-dark)', color: 'var(--color-text-light)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1.1rem', fontWeight: 500 }}>{exp.description}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{new Date(exp.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    ₹{exp.total_amount}
                  </div>
                  <button onClick={() => navigate('/add-expense', { state: { editExpense: exp } })} style={{ background: 'transparent', padding: '0.4rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Edit2 size={20} />
                  </button>
                  <button onClick={() => handleDelete(exp.id)} style={{ background: 'transparent', padding: '0.4rem', color: 'var(--color-accent-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
