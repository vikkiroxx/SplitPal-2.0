import { useAuth } from './AuthProvider';
import { LogIn } from 'lucide-react';

const Login = () => {
  const { signInWithGoogle } = useAuth();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 700, margin: 0 }}>SplitPal</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem', marginTop: '0.5rem' }}>
          Split expenses, not friendships.
        </p>
      </div>

      <div className="card-glass" style={{ width: '100%', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem' }}>Get Started</h2>
        <button 
          onClick={signInWithGoogle}
          className="pill-button" 
          style={{ width: '100%', backgroundColor: 'var(--color-accent-purple)', fontSize: '1.1rem', padding: '1rem' }}
        >
          <LogIn size={20} />
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
