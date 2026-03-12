
"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { MobileNav } from "./mobile-nav";
import { Sparkles, ArrowLeft } from "lucide-react";
import { useUser } from "@/firebase";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
          <div className="size-12 rounded-full bg-primary/20"></div>
          <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Sincronizando GlamGestão...</p>
        </div>
      </div>
    );
  }

  if (!user && pathname === '/login') {
    return <>{children}</>;
  }

  if (!user) return null;

  const isDashboard = pathname === '/';

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="overflow-x-hidden bg-background">
        {/* Branding condicional exclusivo do Dashboard */}
        {isDashboard ? (
          <div className="flex flex-col items-center justify-center pt-10 pb-6 gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
            {/* Logo Reduzido */}
            <div className="bg-primary p-3 sm:p-4 rounded-[1.5rem] text-primary-foreground shadow-lg border-2 border-white transition-all">
              <Sparkles className="size-10 sm:size-12" />
            </div>
            <div className="text-center px-4">
              {/* Título Aumentado */}
              <h1 className="text-6xl sm:text-8xl font-black tracking-tighter text-primary font-headline italic drop-shadow-xl leading-none">
                GlamGestão
              </h1>
              {/* Subtítulo Aumentado */}
              <p className="text-xs sm:text-lg text-muted-foreground font-black uppercase tracking-[0.4em] mt-3 opacity-80">
                LINHAS ROSA VERDE E MARROM
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center px-4 sm:px-8 pt-6 pb-2 animate-in fade-in duration-500">
            <Button asChild variant="ghost" className="h-10 px-3 rounded-xl font-black gap-2 text-primary hover:bg-primary/5 border border-primary/10">
              <Link href="/">
                <ArrowLeft className="size-5" />
                <span className="text-xs uppercase tracking-wider">Voltar ao início</span>
              </Link>
            </Button>
          </div>
        )}

        <main className="flex-1 p-3 sm:p-6 pb-24 md:pb-12 overflow-x-hidden">
          <div className="max-w-none mx-auto border-[4px] border-primary rounded-[2.5rem] sm:rounded-[3.5rem] p-4 sm:p-8 bg-card/60 backdrop-blur-xl shadow-2xl overflow-x-hidden relative min-h-[calc(100vh-16rem)] w-full">
            {children}
          </div>
        </main>
        <MobileNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
