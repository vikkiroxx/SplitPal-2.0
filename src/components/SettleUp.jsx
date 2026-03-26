import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthProvider';
import { ChevronLeft, CheckSquare, Square } from 'lucide-react';

const SettleUp = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [balances, setBalances] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState({});
  const [isSettling, setIsSettling] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      const { data: othersOweMe } = await supabase
        .from('expense_splits')
        .select('id, amount_owed, user_id, profiles!expense_splits_user_id_fkey(full_name), expenses!inner(creator_id)')
        .eq('expenses.creator_id', user.id)
        .neq('user_id', user.id)
        .eq('has_paid', false);

      const { data: iOweOthers } = await supabase
        .from('expense_splits')
        .select('id, amount_owed, expenses!inner(creator_id)')
        .eq('user_id', user.id)
        .neq('expenses.creator_id', user.id)
        .eq('has_paid', false);

      const balancesByFriend = {}; 
      
      if (othersOweMe) {
        othersOweMe.forEach(split => {
          const fId = split.user_id;
          if (!balancesByFriend[fId]) balancesByFriend[fId] = { friendName: split.profiles?.full_name || 'Unknown', netBalance: 0, splitIds: [] };
          balancesByFriend[fId].netBalance += Number(split.amount_owed);
          balancesByFriend[fId].splitIds.push(split.id);
        });
      }

      if (iOweOthers) {
        const creatorIdsToFetch = [];
        iOweOthers.forEach(split => {
           const fId = split.expenses.creator_id;
           if (!balancesByFriend[fId]) {
             balancesByFriend[fId] = { friendName: 'Loading...', netBalance: 0, splitIds: [] };
             creatorIdsToFetch.push(fId);
           }
           balancesByFriend[fId].netBalance -= Number(split.amount_owed);
           balancesByFriend[fId].splitIds.push(split.id);
        });

        if (creatorIdsToFetch.length > 0) {
           const { data: creatorProfiles } = await supabase.from('profiles').select('id, full_name').in('id', creatorIdsToFetch);
           if (creatorProfiles) {
             creatorProfiles.forEach(p => {
               if (balancesByFriend[p.id]) balancesByFriend[p.id].friendName = p.full_name;
             });
           }
        }
      }

      const settlementOptions = Object.entries(balancesByFriend)
        .map(([id, data]) => ({ id, ...data }))
        .filter(f => Math.abs(f.netBalance) > 0.01); 

      setBalances(settlementOptions);
      
      const initialSelection = {};
      settlementOptions.forEach(opt => initialSelection[opt.id] = false);
      setSelectedFriends(initialSelection);
    };
    
    fetchData();
  }, [user]);

  const toggleSelection = (friendId) => {
    setSelectedFriends(prev => ({
      ...prev,
      [friendId]: !prev[friendId]
    }));
  };

  const selectAll = () => {
    const allSelected = {};
    balances.forEach(b => allSelected[b.id] = true);
    setSelectedFriends(allSelected);
  };

  const originalTotalBalance = balances.reduce((sum, b) => sum + b.netBalance, 0);
  const settledAmount = balances.filter(b => selectedFriends[b.id]).reduce((sum, b) => sum + b.netBalance, 0);
  const remainingBalance = originalTotalBalance - settledAmount;
  
  const hasSelections = Object.values(selectedFriends).some(Boolean);

  const confirmSettlements = async () => {
    if (!hasSelections) return;
    setIsSettling(true);
    
    const splitIdsToUpdate = [];
    balances.forEach(b => {
      if (selectedFriends[b.id]) {
        splitIdsToUpdate.push(...b.splitIds);
      }
    });

    if (splitIdsToUpdate.length > 0) {
      await supabase
        .from('expense_splits')
        .update({ has_paid: true })
        .in('id', splitIdsToUpdate);
    }
    
    navigate('/');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-text-light)' }}>
      <header style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', color: 'var(--color-text-light)' }}>
          <ChevronLeft size={28} />
        </button>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Settle Up</h2>
        <div style={{ width: 44 }}></div>
      </header>

      <div style={{ padding: '0 2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Balance Preview */}
        <div className="card-glass" style={{ background: 'var(--color-card-dark)', marginBottom: '2rem', padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-secondary)' }}>Remaining Balance After Settlement</p>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            margin: 0, 
            letterSpacing: '-1px',
            color: remainingBalance < -0.01 ? 'var(--color-accent-orange)' : (remainingBalance > 0.01 ? 'var(--color-accent-green)' : 'var(--color-text-light)')
          }}>
            {remainingBalance < -0.01 ? '-' : ''}₹{Math.abs(remainingBalance).toFixed(2)}
          </h2>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Select Balances</h3>
          <button onClick={selectAll} style={{ color: 'var(--color-accent-purple)', fontWeight: 600, fontSize: '0.9rem' }}>
            Select All
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingBottom: '2rem' }}>
          {balances.length === 0 ? (
             <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
               No outstanding balances to settle!
             </div>
          ) : (
            balances.map(b => (
              <div 
                key={b.id} 
                onClick={() => toggleSelection(b.id)}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '1.2rem', 
                  background: selectedFriends[b.id] ? 'rgba(46, 196, 182, 0.1)' : 'rgba(255,255,255,0.05)', 
                  border: selectedFriends[b.id] ? '1px solid var(--color-accent-green)' : '1px solid transparent',
                  borderRadius: 'var(--border-radius-md)',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {selectedFriends[b.id] ? (
                    <CheckSquare size={24} color="var(--color-accent-green)" />
                  ) : (
                    <Square size={24} color="var(--color-text-secondary)" />
                  )}
                  <div>
                    <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1.1rem', fontWeight: 500 }}>{b.friendName}</h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {b.netBalance > 0 ? 'Owes you' : 'You owe'}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: b.netBalance < 0 ? 'var(--color-accent-orange)' : 'var(--color-text-light)' }}>
                  ₹{Math.abs(b.netBalance).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ padding: '2rem', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        <button 
          onClick={confirmSettlements}
          disabled={!hasSelections || isSettling}
          className="pill-button"
          style={{ 
            backgroundColor: hasSelections ? 'var(--color-accent-green)' : 'var(--color-card-dark)', 
            width: '100%', 
            padding: '1.2rem', 
            fontSize: '1.2rem',
            color: hasSelections ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            opacity: hasSelections ? 1 : 0.7,
            cursor: hasSelections ? 'pointer' : 'not-allowed'
          }}
        >
          {isSettling ? 'Processing...' : 'Confirm Settlements'}
        </button>
      </div>
    </div>
  );
};

export default SettleUp;
