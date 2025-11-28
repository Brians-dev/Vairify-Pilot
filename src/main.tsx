import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

// Initialize theme on app load - set to OCEAN (blue palette)
if (typeof window !== 'undefined') {
  document.documentElement.classList.add('theme-ocean');
  localStorage.setItem('vairify-theme', 'ocean');
}

console.log("[Vairify] Supabase env configured:", {
  VITE_SUPABASE_URL: !!import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
});

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found!");
  }


  createRoot(rootElement).render(
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  );

} catch (error) {
  console.error("❌ Failed to render app:", error);
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; font-family: system-ui; background: white; color: black;">
        <div style="max-width: 500px; text-align: center;">
          <h1 style="color: #ef4444; margin-bottom: 16px;">Application Error</h1>
          <p style="color: #6b7280; margin-bottom: 8px;">Failed to load the application:</p>
          <pre style="text-align: left; color: #6b7280; background: #f3f4f6; padding: 16px; border-radius: 8px; overflow: auto; font-size: 12px;">
${error instanceof Error ? error.message : String(error)}
${error instanceof Error && error.stack ? '\n\n' + error.stack : ''}
          </pre>
          <button onclick="window.location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Reload Page
          </button>
        </div>
      </div>
    `;
  }
}
