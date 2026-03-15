import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { useRepo } from "@/context/RepoContext";

export default function AppLayout() {
  const { repo, repoStatus } = useRepo();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 gap-3 flex-shrink-0">
            <SidebarTrigger />
            <span className="text-sm text-muted-foreground font-mono">
              {repo || "Set repository in Settings"}
              {repoStatus === "checking" ? " · checking" : ""}
            </span>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
