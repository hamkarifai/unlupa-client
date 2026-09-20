import "@/App.css";
import { Outlet, ScrollRestoration } from "react-router";
import { Toaster } from "sonner";
import { AppProvider } from "@/context/AppContext";

function App() {
  return (
    <AppProvider>
      <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-[#070A12] text-foreground">
        <ScrollRestoration />
        <Outlet />
        <Toaster
          theme="dark"
          position="top-right"
          richColors
          closeButton
        />
      </div>
    </AppProvider>
  );
}

export default App;
