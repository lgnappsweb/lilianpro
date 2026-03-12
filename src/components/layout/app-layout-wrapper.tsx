
"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { MobileNav } from "./mobile-nav";
import { Sparkles, ArrowLeft } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { doc } from "firebase/firestore";
import Link from "next/link";

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const pathname = usePathname();
  const router = useRouter();

  const settingsRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid, "config", "settings");
  }, [db, user]);

  const { data: settings } = useDoc(settingsRef);

  useEffect(() => {
    if (!isUserLoading && !user && pathname !== '/login') {
      router.push('/login');
    } else if (!isUserLoading && user && pathname === '/login') {
      router.push('/');
    }
  }, [user, isUserLoading, pathname, router]);

  useEffect(() => {
    if (settings) {
      // Aplicar cor primária se existir
      if (settings.primaryColor) {
        // Converte Hex para HSL simplificado para o Tailwind
        const hex = settings.primaryColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s, l = (max + min) / 2;
        if (max === min) { h = s = 0; } else {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
          }
          h /= 6;
        }
        const hDeg = Math.round(h * 360);
        const sPct = Math.round(s * 100);
        const lPct = Math.round(l * 100);
        
        document.documentElement.style.setProperty('--primary', `${hDeg} ${sPct}% ${lPct}%`);
        document.documentElement.style.setProperty('--ring', `${hDeg} ${sPct}% ${lPct}%`);
      }

      // Aplicar modo escuro/claro
      if (settings.themeMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings]);

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
  const appName = settings?.appName || "GlamGestão";

  // Lógica dinâmica para o botão de voltar
  let backHref = "/";
  let backLabel = "Voltar ao início";

  if (pathname.includes('/clientes/')) {
    backHref = "/clientes";
    backLabel = "Voltar aos clientes";
  } else if (pathname.includes('/produtos/')) {
    backHref = "/produtos";
    backLabel = "Voltar aos produtos";
  } else if (pathname.includes('/pedidos/') || pathname.includes('/vendas/')) {
    backHref = "/pedidos";
    backLabel = "Voltar aos pedidos";
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar appName={appName} />
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
              <h1 className="text-6xl sm:text-8xl font-black tracking-tighter text-primary font-headline italic drop-shadow-xl leading-none whitespace-nowrap">
                {appName}
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
              <Link href={backHref}>
                <ArrowLeft className="size-5" />
                <span className="text-xs uppercase tracking-wider">{backLabel}</span>
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
