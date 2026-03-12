
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
        {/* Branding Refinado com Subtítulo Personalizado */}
        <div className="flex flex-col items-center justify-center pt-8 pb-6 gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="bg-primary p-5 md:p-6 rounded-[2rem] text-primary-foreground shadow-xl border-4 border-white">
            <Sparkles className="size-14 md:size-16" />
          </div>
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-primary font-headline italic drop-shadow-sm px-4">
              GlamGestão
            </h1>
            <p className="text-base md:text-lg text-muted-foreground font-black uppercase tracking-[0.3em] mt-1 opacity-60">
              LINHAS ROSA VERDE E MARROM
            </p>
          </div>
        </div>

        <main className="flex-1 p-3 sm:p-4 md:p-6 pb-28 md:pb-12 overflow-x-hidden">
          <div className="max-w-7xl mx-auto border-4 border-primary rounded-[2.5rem] sm:rounded-[3.5rem] p-4 sm:p-8 md:p-12 bg-card/60 backdrop-blur-xl shadow-2xl overflow-x-hidden relative min-h-[calc(100vh-20rem)] w-full">
            {children}
          </div>
        </main>
        <MobileNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
