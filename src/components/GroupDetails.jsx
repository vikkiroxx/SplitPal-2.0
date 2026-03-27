import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthProvider';
import { ChevronLeft, Plus, Users, Trash2, Edit2, UserMinus, LogOut, UserPlus } from 'lucide-react';

const GroupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableFriends, setAvailableFriends] = useState([]);

  useEffect(() => {
    fetchGroupData();
  }, [id, user]);

  const fetchGroupData = async () => {
    if (!user) return;
    
    // Group basics
    const { data: gData } = await supabase.from('groups').select('*').eq('id', id).single();
    if (gData) setGroup(gData);

    // Members
    const { data: mData } = await supabase
      .from('group_members')
      .select('user_id, profiles!group_members_user_id_fkey(id, full_name)')
      .eq('group_id', id);
    if (mData) {
      setMembers(mData.map(m => ({ id: m.user_id, name: m.profiles?.full_name || 'User' })));
    }

    // Expenses
    const { data: eData } = await supabase
      .from('expenses')
      .select('*')
      .eq('group_id', id)
      .order('created_at', { ascending: false });
    if (eData) setExpenses(eData);
  };

  const handleAddExpense = () => {
    navigate('/add-expense', { state: { presetGroupId: id } });
  };
  
  const handleDeleteExpense = async (expenseId) => {
    const confirmDelete = window.confirm("Delete this group expense?");
    if (!confirmDelete) return;

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

    await supabase.from('expenses').delete().eq('id', expenseId); 
    fetchGroupData();
  };

  const checkUnsettledDebts = async (checkUserId) => {
    // Check if they owe money
    const { data: owe } = await supabase
      .from('expense_splits')
      .select('id, expenses!inner(group_id)')
      .eq('user_id', checkUserId)
      .eq('has_paid', false)
      .eq('expenses.group_id', id);

    // Check if they are owed money
    const { data: owed } = await supabase
      .from('expense_splits')
      .select('id, expenses!inner(creator_id, group_id)')
      .eq('has_paid', false)
      .eq('expenses.creator_id', checkUserId)
      .eq('expenses.group_id', id);

    return (owe && owe.length > 0) || (owed && owed.length > 0);
  };

  const handleRemoveMember = async (memberId, memberName) => {
    const isMe = memberId === user.id;
    const msg = isMe ? "Are you sure you want to rigorously completely leave this group?" : `Remove ${memberName} from this group?`;
    if (!window.confirm(msg)) return;

    const hasDebts = await checkUnsettledDebts(memberId);
    if (hasDebts) {
       alert(`Cannot ${isMe ? 'leave' : 'remove member'}. All outstanding debts within this structural group must mathematically be settled up first!`);
       return;
    }

    await supabase.from('group_members').delete().eq('group_id', id).eq('user_id', memberId);
    
    await supabase.from('activity_logs').insert([{
      user_id: user.id,
      involved_users: members.map(m => m.id),
      action_type: 'UPDATED',
      description: isMe ? `${memberName} left the group.` : `${user?.user_metadata?.full_name || 'Someone'} removed ${memberName} from the group.`
    }]);

    if (isMe) {
      navigate('/groups');
    } else {
      fetchGroupData();
    }
  };

  const loadFriendsToAdd = async () => {
    const { data } = await supabase
      .from('friendships')
      .select('friend_id, profiles!friendships_friend_id_fkey(id, full_name, email)')
      .eq('user_id', user.id);
    
    if (data) {
       const memberIds = members.map(m => m.id);
       const filtered = data.filter(f => !memberIds.includes(f.friend_id));
       setAvailableFriends(filtered);
    }
    setShowAddModal(true);
  };

  const addMemberToGroup = async (friendId, friendName) => {
    await supabase.from('group_members').insert([{ group_id: id, user_id: friendId }]);
    
    await supabase.from('activity_logs').insert([{
      user_id: user.id,
      involved_users: [...members.map(m => m.id), friendId],
      action_type: 'UPDATED',
      description: `${user?.user_metadata?.full_name || 'Someone'} dynamically added ${friendName} structurally onto the group!`
    }]);

    setShowAddModal(false);
    fetchGroupData();
  };

  if (!group) return <div style={{ padding: '2rem', color: 'white' }}>Loading...</div>;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
      
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: 'var(--color-bg-dark)', padding: '2rem', borderRadius: '24px', width: '100%', maxWidth: '400px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.4rem' }}>Bind Friends</h2>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
               {availableFriends.length === 0 ? (
                 <p style={{ color: 'var(--color-text-secondary)' }}>All your friends are already in this group.</p>
               ) : (
                 availableFriends.map(af => (
                    <div key={af.friend_id} onClick={() => addMemberToGroup(af.friend_id, af.profiles.full_name || 'Friend')} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--color-card-dark)', borderRadius: '12px', cursor: 'pointer' }}>
                       <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-bg-dark)', fontWeight: 'bold' }}>
                         {(af.profiles.full_name || 'F').charAt(0).toUpperCase()}
                       </div>
                       <div style={{ fontWeight: 500, flex: 1 }}>{af.profiles.full_name || 'Friend'}</div>
                       <Plus size={20} color="var(--color-text-secondary)" />
                    </div>
                 ))
               )}
            </div>
            <button onClick={() => setShowAddModal(false)} className="pill-button" style={{ marginTop: '1.5rem', background: 'var(--color-card-dark)', color: 'white' }}>Cancel</button>
          </div>
        </div>
      )}

      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', color: 'var(--color-text-primary)', marginLeft: '-0.5rem' }}>
          <ChevronLeft size={28} />
        </button>
        <div style={{ marginLeft: '0.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>{group.name}</h2>
          <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{members.length} Active Members</span>
        </div>
      </header>

      {/* Modern Members Roster */}
      <div style={{ marginBottom: '2rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
           <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0, color: 'var(--color-text-secondary)' }}>Members</h3>
           <button onClick={loadFriendsToAdd} style={{ background: 'transparent', color: 'var(--color-accent-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
             <UserPlus size={18} /> Add
           </button>
         </div>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {members.map(m => (
               <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.6rem 1rem', borderRadius: '12px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                   <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontSize: '0.9rem' }}>
                     {m.name.charAt(0).toUpperCase()}
                   </div>
                   <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{m.id === user.id ? 'You' : m.name}</span>
                 </div>
                 {m.id !== user.id && (
                    <button onClick={() => handleRemoveMember(m.id, m.name)} style={{ background: 'transparent', color: 'var(--color-text-secondary)', padding: '0.4rem' }}>
                      <UserMinus size={18} />
                    </button>
                 )}
               </div>
            ))}
         </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0, color: 'var(--color-text-secondary)' }}>Group Expenses</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {expenses.length === 0 ? (
            <div style={{ background: 'var(--color-input-bg)', padding: '2rem', borderRadius: 'var(--border-radius-md)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No expenses computationally mapped onto this group yet.
            </div>
          ) : (
            expenses.map(exp => (
              <div key={exp.id} className="card-glass" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-card-dark)', color: 'var(--color-text-light)' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1.1rem', fontWeight: 500 }}>{exp.description}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{new Date(exp.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    ₹{exp.total_amount}
                  </div>
                  <>
                    <button onClick={() => navigate('/add-expense', { state: { editExpense: exp, presetGroupId: id } })} style={{ background: 'transparent', padding: '0.4rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Edit2 size={20} />
                    </button>
                    <button onClick={() => handleDeleteExpense(exp.id)} style={{ background: 'transparent', padding: '0.4rem', color: 'var(--color-accent-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={20} />
                    </button>
                  </>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <button 
        onClick={handleAddExpense}
        className="pill-button"
        style={{ 
           background: 'var(--color-accent-green)', 
           color: 'var(--color-bg-dark)', 
           padding: '1.2rem', 
           width: '100%', 
           marginTop: '2rem',
           fontSize: '1.2rem',
           fontWeight: 600,
           display: 'flex', 
           alignItems: 'center', 
           justifyContent: 'center', 
           gap: '0.5rem'
        }}
      >
        <Plus size={24} /> Add Group Expense
      </button>

      <button 
        onClick={() => handleRemoveMember(user.id, user.user_metadata?.full_name || 'You')}
        className="pill-button"
        style={{ 
           background: 'transparent', 
           color: 'var(--color-accent-orange)', 
           border: '1px solid var(--color-accent-orange)',
           padding: '1rem', 
           width: '100%', 
           marginTop: '1rem',
           fontSize: '1.1rem',
           display: 'flex', 
           alignItems: 'center', 
           justifyContent: 'center', 
           gap: '0.5rem'
        }}
      >
        <LogOut size={20} /> Exit Group
      </button>

    </div>
  );
};

export default GroupDetails;
