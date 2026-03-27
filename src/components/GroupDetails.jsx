import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthProvider';
import { ChevronLeft, Plus, Users, Trash2, Edit2 } from 'lucide-react';

const GroupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);

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
      .select('user_id, profiles!group_members_user_id_fkey(full_name)')
      .eq('group_id', id);
    if (mData) {
      setMembers(mData.map(m => m.profiles.full_name || 'User'));
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
  
  const handleDelete = async (expenseId) => {
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

    await supabase.from('expenses').delete().eq('id', expenseId).eq('creator_id', user.id); 
    fetchGroupData();
  };

  if (!group) return <div style={{ padding: '2rem', color: 'white' }}>Loading...</div>;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', color: 'var(--color-text-primary)', marginLeft: '-0.5rem' }}>
          <ChevronLeft size={28} />
        </button>
        <div style={{ marginLeft: '0.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>{group.name}</h2>
          <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{members.length} Members</span>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
         <div style={{ background: 'var(--color-card-dark)', padding: '0.6rem 1rem', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
           <Users size={16} color="var(--color-accent-green)" />
           <span style={{ fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
             {members.join(', ')}
           </span>
         </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Group Expenses</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {expenses.length === 0 ? (
            <div style={{ background: 'var(--color-input-bg)', padding: '2rem', borderRadius: 'var(--border-radius-md)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No expenses in this group yet.
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
                  {exp.creator_id === user.id && (
                     <>
                      <button onClick={() => navigate('/add-expense', { state: { editExpense: exp, presetGroupId: id } })} style={{ background: 'transparent', padding: '0.4rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Edit2 size={20} />
                      </button>
                      <button onClick={() => handleDelete(exp.id)} style={{ background: 'transparent', padding: '0.4rem', color: 'var(--color-accent-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={20} />
                      </button>
                     </>
                  )}
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
    </div>
  );
};
export default GroupDetails;
