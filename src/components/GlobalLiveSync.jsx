import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthProvider';

const GlobalLiveSync = () => {
  const { user } = useAuth();
  const [notification, setNotification] = useState(null);

  const pushLocalNotif = (msg) => {
     setNotification({ message: msg });
     setTimeout(() => setNotification(null), 4500);
     
     try {
       const saved = localStorage.getItem('splitpal_notifs');
       const notifHistory = saved ? JSON.parse(saved) : [];
       const newHistory = [{ id: Date.now(), msg, time: new Date() }, ...notifHistory].slice(0, 20);
       localStorage.setItem('splitpal_notifs', JSON.stringify(newHistory));
       // Broadcast lightweight event so isolated UI components instantly rebuild maps
       window.dispatchEvent(new Event('splitpal_notif_sync'));
     } catch(e) {}
  };

  useEffect(() => {
    if (!user) return;
    
    // Global App-Level Real-Time Socket Interceptor
    const channel = supabase.channel('splitpal_global_sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'expenses' }, (payload) => {
           pushLocalNotif(`🔔 New Expense: "${payload.new.description}"`);
           window.dispatchEvent(new Event('splitpal_db_update'));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'expense_splits' }, (payload) => {
         if (payload.new.has_paid) {
           pushLocalNotif(`💸 Settle Up verified natively!`);
         }
         window.dispatchEvent(new Event('splitpal_db_update'));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  if (!notification) return null;

  return (
    <div style={{ 
      position: 'fixed', top: 25, left: '50%', transform: 'translate(-50%, 0)', 
      background: 'var(--color-text-primary)', color: 'var(--color-bg-dark)', 
      padding: '1rem 2rem', borderRadius: '50px', fontWeight: 600, 
      zIndex: 9999, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', 
      animation: 'slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
    }}>
      {notification.message}
    </div>
  );
};

export default GlobalLiveSync;
