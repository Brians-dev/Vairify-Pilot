// Minimal App - gradually adding components
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
// import Index from "./pages/Index";
import Index from "./pages/Index.simple";
import Registration from "./pages/onboarding/Registration";
import Login from "./pages/Login";

const queryClient = new QueryClient();

const App = () => {
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/onboarding/registration" element={<Registration />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <h1>404 - Page Not Found</h1>
                <p>This is a minimal version of the app.</p>
                <button onClick={() => window.location.href = '/'} style={{ marginTop: '20px', padding: '10px 20px' }}>
                  Go Home
                </button>
              </div>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

