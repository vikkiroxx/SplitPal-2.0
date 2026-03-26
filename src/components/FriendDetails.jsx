import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthProvider';
import { ChevronLeft } from 'lucide-react';

const FriendDetails = () => {
  const { id: friendId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [friend, setFriend] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!user || !friendId) return;

    const fetchDetails = async () => {
      // Fetch friend profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', friendId)
        .single();
      if (profile) setFriend(profile);
      
      // Fetch split records involving me and this friend
      const { data } = await supabase
        .from('expense_splits')
        .select('id, amount_owed, has_paid, user_id, expenses(id, description, total_amount, creator_id, created_at)')
        .or(`user_id.eq.${user.id},user_id.eq.${friendId}`);
      
      if (data) {
        // Filter strictly for transactions between the current user and this specific friend
        const relevantSplits = data.filter(s => {
          const exp = s.expenses;
          if (!exp) return false;
          return (exp.creator_id === user.id && s.user_id === friendId) || 
                 (exp.creator_id === friendId && s.user_id === user.id);
        });

        relevantSplits.sort((a, b) => new Date(b.expenses.created_at) - new Date(a.expenses.created_at));
        setTransactions(relevantSplits);

        let owedToMe = 0;
        let iOwe = 0;
        relevantSplits.forEach(s => {
          if (!s.has_paid) {
            if (s.expenses.creator_id === user.id) owedToMe += Number(s.amount_owed);
            if (s.expenses.creator_id === friendId) iOwe += Number(s.amount_owed);
          }
        });
        setBalance(owedToMe - iOwe);
      }
    };
    
    fetchDetails();
  }, [user, friendId]);

  const handleSettleUp = async () => {
    if (balance === 0) {
      alert("You are already settled up!");
      return;
    }
    
    // Check if deep-link UPI payload should apply
    if (balance < 0 && friend?.upi_id) {
       const upiLink = `upi://pay?pa=${friend.upi_id}&pn=${encodeURIComponent(friend.full_name)}&am=${Math.abs(balance).toFixed(2)}&cu=INR`;
       window.location.href = upiLink;
       
       const confirmSet = window.confirm("Did the UPI payment succeed?");
       if (!confirmSet) return;
    }

    const splitIdsToUpdate = transactions
      .filter(s => !s.has_paid)
      .map(s => s.id);

    if (splitIdsToUpdate.length > 0) {
      await supabase
        .from('expense_splits')
        .update({ has_paid: true })
        .in('id', splitIdsToUpdate);
        
      setBalance(0);
      setTransactions(prev => prev.map(t => ({ ...t, has_paid: true })));
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-bg-dark)' }}>
      <header style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-text-light)' }}>
        <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', color: 'var(--color-text-light)' }}>
          <ChevronLeft size={28} />
        </button>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>{friend?.full_name || 'Loading...'}</h2>
        <div style={{ width: 44 }}></div>
      </header>

      <div style={{ padding: '0 2rem 2rem 2rem', flex: 1, color: 'var(--color-text-light)', display: 'flex', flexDirection: 'column' }}>
        <div className="card-glass" style={{ marginBottom: '2rem', padding: '2.5rem 1.5rem', textAlign: 'center', background: 'var(--color-card-dark)' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', margin: '0 0 0.5rem 0', fontWeight: 500 }}>
            {balance > 0 ? `${friend?.full_name} owes you` : balance < 0 ? `You owe ${friend?.full_name}` : 'You are settled up'}
          </p>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 700, margin: '0 0 2rem 0', letterSpacing: '-1px', color: balance < 0 ? 'var(--color-accent-orange)' : 'var(--color-text-primary)' }}>
            ₹{Math.abs(balance).toFixed(2)}
          </h2>
          <button 
            onClick={handleSettleUp}
            disabled={balance === 0}
            className="pill-button" 
            style={{ 
              backgroundColor: balance === 0 ? 'var(--color-input-bg)' : 'var(--color-accent-green)', 
              width: '100%', 
              color: balance === 0 ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
              opacity: balance === 0 ? 0.7 : 1,
              padding: '1.2rem',
              fontSize: '1.1rem'
            }}
          >
            {balance < 0 && friend?.upi_id ? `Pay ₹${Math.abs(balance).toFixed(2)} via UPI` : 'Settle Up'}
          </button>
        </div>

        <h3 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Shared Transactions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--border-radius-md)' }}>
              No transactions yet.
            </div>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--border-radius-md)' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1.1rem', fontWeight: 500 }}>{tx.expenses.description}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {tx.expenses.creator_id === user.id ? 'You paid' : `${friend?.full_name} paid`} • {new Date(tx.expenses.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 600, color: tx.has_paid ? 'var(--color-text-secondary)' : (tx.expenses.creator_id === user.id ? 'var(--color-text-primary)' : 'var(--color-accent-orange)') }}>
                    {tx.expenses.creator_id === user.id ? '+' : '-'}₹{tx.amount_owed}
                  </span>
                  {tx.has_paid && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Settled</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendDetails;
