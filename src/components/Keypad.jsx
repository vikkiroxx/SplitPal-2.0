import { Delete } from 'lucide-react';

const Keypad = ({ onKeyPress, onDelete }) => {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', width: '100%' }}>
      {keys.map((key) => (
        <button
          key={key}
          onClick={() => onKeyPress(key)}
          style={{
            background: 'var(--color-input-bg)',
            borderRadius: '50%',
            aspectRatio: '1/1',
            fontSize: '1.8rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {key}
        </button>
      ))}
      <button 
        onClick={onDelete}
        style={{
          background: 'var(--color-input-bg)',
          borderRadius: '50%',
          aspectRatio: '1/1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-primary)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
        }}
      >
        <Delete size={28} />
      </button>
    </div>
  );
};

export default Keypad;
