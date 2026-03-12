
"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { MobileNav } from "./mobile-nav";
import { Sparkles } from "lucide-react";
import { useUser } from "@/firebase";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
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
          <div className="size-16 rounded-full bg-primary/20"></div>
          <p className="text-xl text-muted-foreground font-black uppercase tracking-widest">Carregando GlamGestão...</p>
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
      <SidebarInset className="overflow-x-hidden bg-background">
        {/* Branding Monumental */}
        <div className="flex flex-col items-center justify-center pt-12 pb-8 gap-6 animate-in fade-in slide-in-from-top-8 duration-1000">
          <div className="bg-primary p-6 rounded-[2.5rem] text-primary-foreground shadow-2xl scale-110 md:scale-125 border-4 border-white">
            <Sparkles className="size-16 md:size-24" />
          </div>
          <div className="text-center">
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-primary font-headline italic drop-shadow-sm px-4">
              GlamGestão
            </h1>
            <p className="text-lg md:text-2xl text-muted-foreground font-black uppercase tracking-[0.3em] mt-2 opacity-60">
              Elite Business Control
            </p>
          </div>
        </div>

        <main className="flex-1 p-3 sm:p-4 md:p-6 pb-28 md:pb-12 overflow-x-hidden">
          <div className="max-w-7xl mx-auto border-4 border-primary rounded-[2.5rem] sm:rounded-[3.5rem] p-4 sm:p-8 md:p-12 bg-card/60 backdrop-blur-xl shadow-2xl overflow-x-hidden relative min-h-[calc(100vh-25rem)] w-full">
            {children}
          </div>
        </main>
        <MobileNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
