import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { ChevronLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';

const SplitMath = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { amountStr, description, editExpenseId, presetGroupId } = location.state || { amountStr: '0', description: 'Untitled' };
  const totalAmount = parseFloat(amountStr) || 0;

  const [splitMode, setSplitMode] = useState(editExpenseId ? 'EXACT' : 'EQUAL'); // EQUAL, EXACT, PERCENT
  const [friends, setFriends] = useState([]);
  const [splits, setSplits] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      if (presetGroupId) {
         const { data: groupMembers } = await supabase
           .from('group_members')
           .select('user_id, profiles!group_members_user_id_fkey(id, full_name)')
           .eq('group_id', presetGroupId);
           
         const realFriends = groupMembers 
           ? groupMembers.filter(m => m.user_id !== user.id).map(m => ({ id: m.profiles.id, name: m.profiles.full_name || 'Member' })) 
           : [];
           
         setFriends([
           { id: user.id, name: 'You' },
           ...realFriends
         ]);
      } else {
         const { data } = await supabase
           .from('friendships')
           .select('friend_id, profiles!friendships_friend_id_fkey(id, full_name)')
           .eq('user_id', user.id);
           
         const realFriends = data ? data.map(f => ({ id: f.profiles.id, name: f.profiles.full_name || 'Friend' })) : [];
         setFriends([
           { id: user.id, name: 'You' },
           ...realFriends
         ]);
      }

      if (editExpenseId) {
         const { data: splitData } = await supabase.from('expense_splits').select('*').eq('expense_id', editExpenseId);
         if (splitData && splitData.length > 0) {
           const loadedSplits = {};
           splitData.forEach(s => loadedSplits[s.user_id] = Number(s.amount_owed));
           setSplits(loadedSplits);
         }
      }
    };
    fetchData();
  }, [user, editExpenseId]);

  useEffect(() => {
    // Skip auto-allocation if in EXACT mode, essential for preserving loaded edit debts natively
    if (splitMode === 'EXACT') return;

    if (splitMode === 'EQUAL' && friends.length > 0) {
      const splitAmt = (totalAmount / friends.length).toFixed(2);
      const newSplits = {};
      friends.forEach(f => newSplits[f.id] = parseFloat(splitAmt));
      setSplits(newSplits);
    } else if (splitMode === 'PERCENT') {
      const newSplits = {};
      friends.forEach(f => newSplits[f.id] = parseFloat((100 / friends.length).toFixed(2)));
      setSplits(newSplits);
    } else {
      const newSplits = {};
      friends.forEach(f => newSplits[f.id] = 0);
      setSplits(newSplits);
    }
  }, [splitMode, friends.length, totalAmount]);

  const handleInputChange = (id, val) => {
    setSplits(prev => ({ ...prev, [id]: parseFloat(val) || 0 }));
  };

  const currentSum = Object.values(splits).reduce((a, b) => a + (parseFloat(b) || 0), 0);
  
  const isValid = splitMode === 'EQUAL' 
    ? true 
    : splitMode === 'PERCENT' 
      ? Math.abs(currentSum - 100) < 0.05 
      : Math.abs(currentSum - totalAmount) < 0.05;

  const handleSave = async () => {
    if (!isValid) return;
    
    let expenseId = editExpenseId;

    if (expenseId) {
      // Update logic
      await supabase.from('expenses').update({ description: description || 'Split Expense', total_amount: totalAmount }).eq('id', expenseId);
      await supabase.from('expense_splits').delete().eq('expense_id', expenseId); // Clean slate strictly for edits
    } else {
      // Insert new logic
      const extParams = presetGroupId ? { group_id: presetGroupId } : {};
      const { data: newExpense, error } = await supabase
        .from('expenses')
        .insert([{ 
           creator_id: user.id, 
           description: description || 'Split Expense', 
           total_amount: totalAmount,
           ...extParams
        }])
        .select();

      if (error || !newExpense) {
        console.error('Error saving expense:', error);
        alert('Failed to save expense.');
        return;
      }
      expenseId = newExpense[0].id;
    }
    
    // Create the split objects
    const splitInserts = friends.map(f => ({
      expense_id: expenseId,
      user_id: f.id,
      amount_owed: splits[f.id] || 0,
      has_paid: f.id === user.id // creator is considered 'paid' for their own share initially
    })).filter(split => split.amount_owed > 0);

    if (splitInserts.length > 0) {
      await supabase.from('expense_splits').insert(splitInserts);
    }

    console.log("Expense saved successfully!");
    // Navigate back to Dashboard upon success
    navigate('/');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-bg-dark)' }}>
      <header style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-text-light)' }}>
        <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', color: 'var(--color-text-light)' }}>
          <ChevronLeft size={28} />
        </button>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>{editExpenseId ? 'Edit Split' : 'Adjust Split'}</h2>
        <div style={{ width: 44 }}></div>
      </header>

      <div style={{ padding: '0 2rem', marginTop: '1rem', color: 'var(--color-text-light)', flex: 1 }}>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>{description || 'Expense'}</p>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 700, margin: '0.5rem 0 2.5rem 0', letterSpacing: '-1px' }}>
          ₹{totalAmount.toFixed(2)}
        </h1>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: 'var(--color-card-dark)', borderRadius: 'var(--border-radius-md)', padding: '0.4rem', marginBottom: '2.5rem' }}>
          {['EQUAL', 'EXACT', 'PERCENT'].map(mode => (
             <button 
               key={mode} 
               onClick={() => setSplitMode(mode)}
               style={{ 
                 flex: 1, 
                 padding: '0.8rem', 
                 borderRadius: 'var(--border-radius-sm)',
                 background: splitMode === mode ? 'var(--color-bg-mint)' : 'transparent',
                 color: splitMode === mode ? 'var(--color-text-primary)' : 'var(--color-text-light)',
                 fontWeight: 600,
                 fontSize: '0.95rem'
               }}
             >
               {mode === 'EQUAL' ? 'Equally' : mode === 'EXACT' ? 'Exact ₹' : '% Percent'}
             </button>
          ))}
        </div>

        {/* Split List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {friends.map(friend => (
            <div key={friend.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--color-accent-purple)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {friend.name.charAt(0)}
                </div>
                <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>{friend.name}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {splitMode !== 'EQUAL' && splitMode === 'EXACT' && <span style={{ marginRight: '0.5rem', color: 'var(--color-text-secondary)' }}>₹</span>}
                <input 
                  type="number"
                  disabled={splitMode === 'EQUAL'}
                  value={splits[friend.id] === 0 ? '' : splits[friend.id]}
                  placeholder="0"
                  onChange={(e) => handleInputChange(friend.id, e.target.value)}
                  style={{
                    width: '80px',
                    textAlign: 'right',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: splitMode === 'EQUAL' ? 'var(--color-text-secondary)' : 'var(--color-text-light)',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: splitMode !== 'EQUAL' ? '2px solid var(--color-accent-green)' : 'none',
                    padding: '0.2rem',
                    outline: 'none'
                  }}
                />
                {splitMode === 'PERCENT' && <span style={{ marginLeft: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>%</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '2rem', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        {splitMode !== 'EQUAL' && (
          <div style={{ textAlign: 'center', marginBottom: '1.5rem', color: isValid ? 'var(--color-accent-green)' : 'var(--color-accent-orange)', fontWeight: 500 }}>
            {splitMode === 'PERCENT' ? `Total Allocation: ${currentSum.toFixed(2)}%` : `Total Allocation: ₹${currentSum.toFixed(2)} / ₹${totalAmount.toFixed(2)}`}
          </div>
        )}
        <button 
          onClick={handleSave}
          disabled={!isValid}
          className="pill-button"
          style={{ 
            backgroundColor: isValid ? 'var(--color-accent-green)' : 'var(--color-card-dark)', 
            width: '100%', 
            padding: '1.2rem', 
            fontSize: '1.2rem',
            color: isValid ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            opacity: isValid ? 1 : 0.7,
            cursor: isValid ? 'pointer' : 'not-allowed'
          }}
        >
          Confirm Split
        </button>
      </div>
    </div>
  );
};

export default SplitMath;
