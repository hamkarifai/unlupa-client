import "@/App.css";
import { Outlet, ScrollRestoration } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider, useApp } from "@/context/AppContext";
import { MaintenancePage } from "@/pages/maintanance/Maintenance";

const isMaintenance = import.meta.env.VITE_MAINTENANCE === "true";

function AppShell() {
  const { theme } = useApp();

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-primary text-primary transition-colors">
      <ScrollRestoration />
      {isMaintenance ? <MaintenancePage /> : <Outlet />}
      <Toaster
        theme={theme}
        position="top-right"
        closeButton
        expand
        gap={10}
        offset={20}
        visibleToasts={4}
      />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default App;
