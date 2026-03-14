"use client";

import React from "react";
import Link from "next/navigation";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  Plus,
  ClipboardList,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";

const primaryItems = [
  { name: "Painel", icon: LayoutDashboard, href: "/", color: "text-blue-500" },
  { name: "Clientes", icon: Users, href: "/clientes", color: "text-accent" },
];

const moreItems = [
  { name: "Pedidos", icon: ClipboardList, href: "/pedidos", color: "text-purple-500" },
  { name: "Histórico", icon: History, href: "/historico", color: "text-pink-600" },
  { name: "Financeiro", icon: Wallet, href: "/financeiro", color: "text-green-600" },
  { name: "Relatórios", icon: BarChart3, href: "/relatorios", color: "text-pink-500" },
  { name: "Ajustes", icon: Settings, href: "/configuracoes", color: "text-slate-500" },
];

export function MobileNav() {
  const pathname = usePathname();
  const auth = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t bg-background/80 backdrop-blur-lg md:hidden px-4 pb-4">
      {/* Nova Venda em Destaque no Início */}
      <Link
        href="/vendas/nova"
        className={cn(
          "flex flex-col items-center justify-center gap-1 transition-all duration-200 px-3 py-1 rounded-xl",
          pathname === "/vendas/nova" 
            ? "text-primary bg-primary/10 border border-primary/20 scale-110" 
            : "text-primary font-bold"
        )}
      >
        <div className="p-2 bg-primary rounded-full text-primary-foreground shadow-md">
          <PlusCircle className="size-6" />
        </div>
        <span className="text-[10px] font-black uppercase">Venda</span>
      </Link>

      {primaryItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-all px-2",
            pathname === item.href ? "scale-110" : "opacity-90"
          )}
        >
          <item.icon className={cn("size-6", pathname === item.href ? "text-primary" : item.color)} />
          <span className={cn(
            "text-[10px] font-black uppercase", 
            pathname === item.href ? "text-primary" : "text-foreground"
          )}>{item.name}</span>
        </Link>
      ))}

      {/* Botão central de Mais (+) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex flex-col items-center justify-center gap-1 text-muted-foreground outline-none">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted border-2 border-border text-primary shadow-sm active:scale-95 transition-transform">
              <Plus className="size-6 stroke-[3px]" />
            </div>
            <span className="text-[10px] font-black uppercase">Mais</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 mb-6 p-3 rounded-[1.5rem] border-4 border-primary/10 shadow-2xl bg-background animate-in slide-in-from-bottom-2">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-3 mb-2 opacity-50">Menu Elite</div>
          {moreItems.map((item) => (
            <DropdownMenuItem key={item.name} asChild className="focus:bg-primary/5 rounded-xl">
              <Link href={item.href} className="flex items-center gap-4 py-3 cursor-pointer">
                <div className={cn("size-10 rounded-lg flex items-center justify-center bg-muted/50 shadow-inner", item.color)}>
                  <item.icon className="size-5" />
                </div>
                <span className={cn("text-base font-black uppercase tracking-tight", pathname === item.href ? "text-primary" : "text-foreground")}>
                  {item.name}
                </span>
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className="my-2 bg-muted h-1" />
          <DropdownMenuItem 
            className="focus:bg-destructive/5 rounded-xl py-3 flex items-center gap-4 cursor-pointer text-destructive"
            onClick={() => signOut(auth)}
          >
            <div className="size-10 rounded-lg flex items-center justify-center bg-destructive/10 shadow-inner">
              <LogOut className="size-5" />
            </div>
            <span className="text-base font-black uppercase tracking-tight">Sair do Sistema</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
