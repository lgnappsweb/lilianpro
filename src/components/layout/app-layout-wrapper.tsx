
"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { MobileNav } from "./mobile-nav";
import { Search, Bell, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser, useAuth } from "@/firebase";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "firebase/auth";

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user && pathname !== '/login') {
      router.push('/login');
    } else if (!isUserLoading && user && pathname === '/login') {
      router.push('/');
    }
  }, [user, isUserLoading, pathname, router]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="size-12 rounded-full bg-primary/20"></div>
          <p className="text-muted-foreground font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user && pathname === '/login') {
    return <>{children}</>;
  }

  if (!user) return null;

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <span className="font-headline font-bold text-lg text-primary">GlamGestão</span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <SidebarTrigger />
              <div className="relative w-64 md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar..."
                  className="pl-10 h-9 bg-muted/50 border-none focus-visible:ring-1"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="size-5" />
              <span className="absolute top-2 right-2 size-2 bg-primary rounded-full border-2 border-background"></span>
            </Button>
            <div className="h-8 w-px bg-border mx-1"></div>
            <div className="flex items-center gap-2 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">{user.displayName || 'Administradora'}</p>
                <p className="text-xs text-muted-foreground">Avon & Natura</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut(auth)}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="size-5" />
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-2 sm:p-4 md:p-6 pb-24 md:pb-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto border-2 border-primary rounded-[2rem] p-4 sm:p-6 md:p-8 bg-card/40 backdrop-blur-sm shadow-md overflow-x-hidden relative min-h-[calc(100vh-12rem)]">
            {children}
          </div>
        </main>
        <MobileNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
