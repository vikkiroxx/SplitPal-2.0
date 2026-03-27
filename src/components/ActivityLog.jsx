import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthProvider';
import { ChevronLeft, Activity, PlusCircle, CheckCircle, Edit3, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ActivityLog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!user) return;
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .contains('involved_users', [user.id])
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (error) console.error("Error fetching logs:", error);
        
      if (data) setLogs(data);
    };
    
    fetchLogs();

    // Mathematically Realtime Architecture
    const channel = supabase.channel('splitpal_activity_log')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, () => {
         fetchLogs();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const getIcon = (type) => {
     switch(type) {
       case 'ADDED': return <PlusCircle size={20} color="var(--color-accent-green)" />;
       case 'UPDATED': return <Edit3 size={20} color="var(--color-accent-yellow)" />;
       case 'DELETED': return <Trash2 size={20} color="var(--color-accent-orange)" />;
       case 'SETTLED': return <CheckCircle size={20} color="var(--color-accent-purple)" />;
       default: return <Activity size={20} color="var(--color-text-secondary)" />;
     }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', color: 'var(--color-text-primary)', marginLeft: '-0.5rem' }}>
          <ChevronLeft size={28} />
        </button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)', marginLeft: '0.5rem' }}>Global Activity</h2>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {logs.length === 0 ? (
           <div style={{ background: 'var(--color-input-bg)', padding: '2rem', borderRadius: 'var(--border-radius-md)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
             No historical activity mathematically recorded for you globally yet.
           </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="card-glass" style={{ padding: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', background: 'var(--color-card-dark)', borderLeft: log.action_type === 'SETTLED' ? '4px solid var(--color-accent-purple)' : '1px solid rgba(255,255,255,0.05)' }}>
               <div style={{ marginTop: '0.2rem' }}>
                 {getIcon(log.action_type)}
               </div>
               <div>
                 <div style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '0.3rem', lineHeight: 1.4 }}>
                   {log.description}
                 </div>
                 <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                   {new Date(log.created_at).toLocaleString()}
                 </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default ActivityLog;
