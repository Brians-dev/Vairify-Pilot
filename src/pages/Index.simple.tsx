// Simple Index page for testing
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, hsl(204, 52%, 21%) 0%, hsl(172, 70%, 50%) 50%, hsl(188, 91%, 43%) 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px' }}>
          Stop Hoping.<br />Start Knowing.
        </h1>
        <p style={{ fontSize: '20px', marginBottom: '40px', opacity: 0.9 }}>
          The first platform with V.A.I. verified anonymous identity for every encounter.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button
            onClick={() => navigate('/onboarding/registration')}
            style={{
              padding: '16px 32px',
              fontSize: '18px',
              fontWeight: '600',
              backgroundColor: 'white',
              color: '#0a1628',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Sign Up
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '16px 32px',
              fontSize: '18px',
              fontWeight: '600',
              backgroundColor: 'transparent',
              color: 'white',
              border: '2px solid white',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;

