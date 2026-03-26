import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, X, User as UserIcon } from 'lucide-react';

const GroupsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    // Fetch my groups
    const { data: memberData } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name, created_at)')
      .eq('user_id', user.id);
      
    if (memberData) {
      setGroups(memberData.map(m => m.groups));
    }

    // Fetch my friends specifically for the Add Group modal
    const { data: friendData } = await supabase
      .from('friendships')
      .select('friend_id, profiles!friendships_friend_id_fkey(id, full_name)')
      .eq('user_id', user.id);
      
    if (friendData) {
      setFriends(friendData.map(f => ({ id: f.profiles.id, name: f.profiles.full_name })));
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    
    // 1. Insert the central group record
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .insert([{ creator_id: user.id, name: newGroupName }])
      .select();

    if (groupError || !groupData) return alert("Failed to create group");

    const groupId = groupData[0].id;

    // 2. Insert all the members mapping explicitly (Creator is automatically added)
    const membersToInsert = [
      { group_id: groupId, user_id: user.id }, 
      ...selectedFriends.map(fId => ({ group_id: groupId, user_id: fId }))
    ];

    await supabase.from('group_members').insert(membersToInsert);

    // Reset UI cleanly
    setIsCreating(false);
    setNewGroupName('');
    setSelectedFriends([]);
    fetchData();
  };

  const toggleFriend = (id) => {
    setSelectedFriends(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
  };

  if (isCreating) {
    return (
      <div style={{ padding: '2rem', color: 'var(--color-text-light)', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Create Group</h2>
          <button onClick={() => setIsCreating(false)} style={{ background: 'transparent', color: 'var(--color-text-secondary)', padding: '0.5rem' }}>
            <X size={24} />
          </button>
        </header>

        <input 
          type="text" 
          placeholder="Group Name (e.g., Goa Trip)" 
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '1.2rem', 
            borderRadius: 'var(--border-radius-md)', 
            border: 'none', 
            background: 'var(--color-input-bg)',
            color: 'var(--color-text-primary)',
            fontSize: '1.2rem',
            marginBottom: '2rem',
            outline: 'none'
          }}
        />

        <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Add Members</h3>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingBottom: '1rem' }}>
          {friends.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '2rem' }}>You don't have any friends to add yet!</div>
          ) : (
            friends.map(f => (
              <div 
                key={f.id} 
                onClick={() => toggleFriend(f.id)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '1rem', 
                  background: selectedFriends.includes(f.id) ? 'rgba(46, 196, 182, 0.1)' : 'var(--color-card-dark)',
                  border: selectedFriends.includes(f.id) ? '1px solid var(--color-accent-green)' : '1px solid transparent',
                  borderRadius: 'var(--border-radius-md)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-accent-purple)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {f.name.charAt(0)}
                  </div>
                  <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{f.name}</span>
                </div>
                {selectedFriends.includes(f.id) && <div style={{ color: 'var(--color-accent-green)', fontWeight: 'bold' }}>Added</div>}
              </div>
            ))
          )}
        </div>

        <button 
          onClick={handleCreateGroup}
          disabled={!newGroupName.trim()}
          className="pill-button"
          style={{ 
            background: newGroupName.trim() ? 'var(--color-accent-green)' : 'var(--color-input-bg)', 
            color: newGroupName.trim() ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            width: '100%', 
            padding: '1.2rem', 
            fontSize: '1.1rem',
            marginTop: 'auto'
          }}
        >
          Create Group
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', color: 'var(--color-text-light)', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>Groups</h2>
        <button onClick={() => setIsCreating(true)} style={{ background: 'var(--color-accent-green)', color: 'var(--color-text-primary)', padding: '0.6rem 1rem', borderRadius: 'var(--border-radius-sm)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
          <Plus size={18} /> New
        </button>
      </header>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {groups.length === 0 ? (
           <div style={{ background: 'var(--color-input-bg)', padding: '2rem', borderRadius: 'var(--border-radius-md)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
             You aren't in any groups yet. Create one!
           </div>
        ) : (
          groups.map(g => (
            <div key={g.id} onClick={() => navigate(`/group/${g.id}`)} className="card-glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--color-card-dark)', cursor: 'pointer' }}>
               <div style={{ width: 48, height: 48, borderRadius: 'var(--border-radius-sm)', background: 'var(--color-accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--color-text-primary)', fontSize: '1.2rem' }}>
                 <Users size={24} />
               </div>
               <div>
                 <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                   {g.name}
                 </div>
                 <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                   Created {new Date(g.created_at).toLocaleDateString()}
                 </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default GroupsList;
