import { Outlet } from "react-router-dom";
import { Header } from "../../shared/components/common/Header";

export function AppShell() {
  return (
    
    <div className="min-h-screen">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
}