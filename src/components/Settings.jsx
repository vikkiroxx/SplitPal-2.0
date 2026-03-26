import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthProvider';
import { User, LogOut, Save } from 'lucide-react';

const Settings = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState({ full_name: '', upi_id: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profile.full_name, upi_id: profile.upi_id })
      .eq('id', user.id);
      
    setIsSaving(false);
    if (!error) alert('Profile updated!');
    else alert('Failed to update profile.');
  };

  return (
    <div style={{ padding: '2rem', color: 'var(--color-text-light)', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '2rem', color: 'var(--color-text-primary)' }}>Settings</h2>
      
      <div className="card-glass" style={{ background: 'var(--color-card-dark)', padding: '1.5rem', borderRadius: 'var(--border-radius-md)', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', fontWeight: 500 }}>Your Profile</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Display Name</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-input-bg)', padding: '0.8rem', borderRadius: 'var(--border-radius-sm)' }}>
              <User size={20} color="var(--color-text-secondary)" style={{ marginRight: '0.5rem' }} />
              <input 
                type="text" 
                value={profile.full_name || ''} 
                onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', outline: 'none', flex: 1, fontSize: '1.1rem' }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>UPI ID (For receiving payments)</label>
            <input 
              type="text" 
              placeholder="e.g. name@okhdfcbank"
              value={profile.upi_id || ''} 
              onChange={(e) => setProfile({...profile, upi_id: e.target.value})}
              style={{ width: '100%', background: 'var(--color-input-bg)', border: 'none', padding: '1rem', color: 'var(--color-text-primary)', borderRadius: 'var(--border-radius-sm)', outline: 'none', fontSize: '1.1rem' }}
            />
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Add your UPI ID so friends can tap exactly one button to pay you from their preferred UPI app.
            </p>
          </div>
          
          <button onClick={handleSave} disabled={isSaving} className="pill-button" style={{ background: 'var(--color-accent-green)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', marginTop: '0.5rem' }}>
            <Save size={20} /> {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      <button onClick={signOut} className="pill-button" style={{ width: '100%', background: 'var(--color-card-dark)', color: 'var(--color-accent-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}>
        <LogOut size={20} /> Sign Out
      </button>
    </div>
  );
};

export default Settings;
