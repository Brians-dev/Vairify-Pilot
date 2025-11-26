// Diagnostic version of App - minimal to test
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

// Super simple test page
const TestPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      color: '#000000',
      padding: '40px',
      fontFamily: 'system-ui'
    }}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>🔍 Diagnostic Mode</h1>
      <div style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Status Checks:</h2>
        <ul style={{ listStyle: 'disc', paddingLeft: '20px' }}>
          <li>✅ React is working</li>
          <li>✅ Routing is working</li>
          <li>✅ QueryClient is working</li>
          <li>✅ TooltipProvider is working</li>
        </ul>
      </div>
      <div style={{ backgroundColor: '#dbeafe', padding: '20px', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Next Steps:</h2>
        <p>If you see this page, the basic app structure is working.</p>
        <p>The issue is likely in one of the imported components in the full App.tsx</p>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<TestPage />} />
            <Route path="*" element={<TestPage />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;







