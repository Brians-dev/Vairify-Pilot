// Temporary minimal test app
export default function TestApp() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#ffffff',
      color: '#000000',
      fontFamily: 'system-ui',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>✅ React is Working!</h1>
        <p style={{ fontSize: '18px', color: '#666' }}>
          If you see this, React is rendering correctly.
        </p>
        <p style={{ fontSize: '14px', color: '#999', marginTop: '20px' }}>
          The issue is likely in one of the imported components.
        </p>
      </div>
    </div>
  );
}







