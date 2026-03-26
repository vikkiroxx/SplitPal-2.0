import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthProvider';
import { UserPlus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FriendsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    fetchFriends();
  }, [user]);

  const fetchFriends = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('friendships')
      .select('friend_id, profiles!friendships_friend_id_fkey(id, full_name, avatar_url)')
      .eq('user_id', user.id);
      
    if (data) {
      setFriends(data.map(f => f.profiles));
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Search profiles by name, omit self
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('full_name', `%${searchQuery}%`)
      .neq('id', user.id);

    if (data) {
      // Filter out users already in friends list
      const friendIds = friends.map(f => f.id);
      setSearchResults(data.filter(p => !friendIds.includes(p.id)));
    }
  };

  const addFriend = async (friendId) => {
    const { error } = await supabase
      .from('friendships')
      .insert([
        { user_id: user.id, friend_id: friendId },
        { user_id: friendId, friend_id: user.id } // Bidirectional friendship
      ]);
      
    if (!error) {
      setSearchQuery('');
      setSearchResults([]);
      fetchFriends();
    } else {
      alert("Error adding friend!");
    }
  };

  return (
    <div style={{ padding: '2rem', color: 'var(--color-text-light)' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>Friends</h2>
      
      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <input 
          type="text" 
          placeholder="Search users by name..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ 
            flex: 1, 
            padding: '1rem', 
            borderRadius: 'var(--border-radius-md)', 
            border: 'none', 
            background: 'rgba(255,255,255,0.4)',
            color: 'var(--color-text-primary)'
          }}
        />
        <button type="submit" style={{ padding: '1rem', background: 'var(--color-accent-purple)', color: 'white', borderRadius: 'var(--border-radius-md)' }}>
          <Search size={20} />
        </button>
      </form>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div style={{ marginBottom: '2rem', background: 'var(--color-card-dark)', padding: '1rem', borderRadius: 'var(--border-radius-md)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', margin: '0 0 1rem 0' }}>Search Results</h3>
          {searchResults.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span>{p.full_name}</span>
              <button 
                onClick={() => addFriend(p.id)}
                style={{ padding: '0.5rem 1rem', background: 'var(--color-accent-green)', borderRadius: 'var(--border-radius-sm)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
              >
                <UserPlus size={16} /> Add
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Current Friends */}
      <h3 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Your Friends</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {friends.length === 0 ? (
           <div style={{ background: 'var(--color-input-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius-md)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
             You haven't added any friends yet.
           </div>
        ) : (
          friends.map(f => (
            <div key={f.id} className="card-glass" onClick={() => navigate(`/friend/${f.id}`)} style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--color-card-dark)', cursor: 'pointer', transition: 'all 0.2s ease', border: '1px solid rgba(255,255,255,0.05)' }}>
               <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--color-accent-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                 {f.full_name?.charAt(0) || '?'}
               </div>
               <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--color-text-light)' }}>
                 {f.full_name}
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default FriendsList;
