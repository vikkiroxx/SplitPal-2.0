import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Keypad from './Keypad';
import { ChevronLeft } from 'lucide-react';

const AddExpense = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editExpense = location.state?.editExpense;
  const presetGroupId = location.state?.presetGroupId;

  const [amount, setAmount] = useState(editExpense ? String(editExpense.total_amount) : '0');
  const [description, setDescription] = useState(editExpense ? editExpense.description : '');

  const handleKeyPress = (key) => {
    if (amount === '0' && key !== '.') {
      setAmount(String(key));
    } else {
      if (key === '.' && amount.includes('.')) return;
      if (amount.includes('.') && amount.split('.')[1].length >= 2) return;
      // Max 6 digits before decimal
      if (!amount.includes('.') && amount.length >= 6 && key !== '.') return;
      setAmount((prev) => prev + String(key));
    }
  };

  const handleDelete = () => {
    if (amount.length <= 1) {
      setAmount('0');
    } else {
      setAmount((prev) => prev.slice(0, -1));
    }
  };

  const handleNext = () => {
    if (parseFloat(amount) > 0) {
      navigate('/split', { state: { editExpenseId: editExpense?.id, presetGroupId, amountStr: amount, description } });
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-bg-mint)' }}>
      <header style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate(-1)} style={{ padding: '0.5rem', background: 'transparent', color: 'var(--color-text-primary)' }}>
          <ChevronLeft size={28} />
        </button>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Split Expense</h2>
        <div style={{ width: 44 }}></div>
      </header>
      
      <div style={{ padding: '0 2rem', marginTop: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <input 
          type="text" 
          placeholder="What's this for? (e.g. Dinner)" 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ 
            background: 'transparent',
            borderBottom: '2px solid rgba(0,0,0,0.1)',
            fontSize: '1.2rem',
            padding: '0.5rem 0',
            marginBottom: '1rem',
            color: 'var(--color-text-primary)'
          }} 
        />
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h1 style={{ fontSize: '4.5rem', fontWeight: 700, letterSpacing: '-2px', marginBottom: '2.5rem', color: 'var(--color-text-primary)' }}>
            ₹{amount}
          </h1>
          
          <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
            <Keypad onKeyPress={handleKeyPress} onDelete={handleDelete} />
            
            <button 
              onClick={handleNext}
              className="pill-button"
              style={{ 
                backgroundColor: 'var(--color-accent-orange)', 
                width: '100%', 
                padding: '1.2rem', 
                fontSize: '1.3rem',
                color: 'var(--color-text-primary)'
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddExpense;
