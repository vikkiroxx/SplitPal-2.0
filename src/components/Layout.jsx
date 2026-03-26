import { Home, Users as UsersIcon, UsersRound, Settings } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: UsersIcon, path: '/friends', label: 'Friends' },
    { icon: UsersRound, path: '/groups', label: 'Groups' },
    { icon: Settings, path: '/settings', label: 'Settings' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
      
      {/* Bottom Navigation matching mockups (dark pill with green active icon) */}
      <div style={{ 
        background: 'var(--color-bg-dark)', 
        color: 'var(--color-text-secondary)',
        padding: '1rem 1.5rem',
        borderTopLeftRadius: 'var(--border-radius-lg)',
        borderTopRightRadius: 'var(--border-radius-lg)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                background: isActive ? 'var(--color-accent-green)' : 'transparent',
                color: isActive ? 'var(--color-bg-dark)' : 'inherit',
                padding: '0.8rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}>
                <Icon size={24} color={isActive ? "var(--color-text-primary)" : "currentColor"} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Layout;
