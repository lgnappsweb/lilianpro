
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  PlusCircle,
  ClipboardList,
  Wallet,
  BarChart3,
  Settings,
  Sparkles,
  Tag,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Painel", icon: LayoutDashboard, href: "/" },
  { name: "Clientes", icon: Users, href: "/clientes" },
  { name: "Categorias", icon: Tag, href: "/categorias" },
  { name: "Produtos", icon: Package, href: "/produtos" },
  { name: "Pedidos", icon: ClipboardList, href: "/pedidos" },
  { name: "Financeiro", icon: Wallet, href: "/financeiro" },
  { name: "Relatórios", icon: BarChart3, href: "/relatorios" },
  { name: "Configurações", icon: Settings, href: "/configuracoes" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const { user } = useUser();

  return (
    <Sidebar variant="inset" collapsible="icon" className="hidden md:flex">
      <SidebarHeader className="flex items-center justify-center py-10">
        <div className="flex items-center gap-3 px-4 group-data-[collapsible=icon]:px-0">
          <div className="bg-primary p-3 rounded-2xl flex items-center justify-center text-primary-foreground border-2 border-white shadow-lg">
            <Sparkles className="size-8" />
          </div>
          <span className="font-headline font-black text-2xl tracking-tighter text-primary group-data-[collapsible=icon]:hidden italic">
            GlamGestão
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/vendas/nova"}
                  tooltip="Nova Venda"
                  className={cn(
                    "mb-6 h-16 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-xl rounded-2xl transition-all duration-300",
                    pathname === "/vendas/nova" && "ring-4 ring-primary/30"
                  )}
                >
                  <Link href="/vendas/nova">
                    <PlusCircle className="size-7" />
                    <span className="text-lg font-black uppercase tracking-widest">Nova Venda</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden font-black text-xs uppercase tracking-[0.2em] mb-4">Navegação Elite</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.name}
                    className="h-12 rounded-xl"
                  >
                    <Link href={item.href}>
                      <item.icon className={cn("size-6", pathname === item.href ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn("text-base font-bold", pathname === item.href ? "text-primary" : "text-foreground")}>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-6">
        <div className="bg-muted/50 rounded-3xl p-4 group-data-[collapsible=icon]:hidden border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black shadow-inner">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black truncate">{user?.displayName || 'Admin'}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Administradora</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-10 font-black text-sm rounded-xl"
            onClick={() => signOut(auth)}
          >
            <LogOut className="mr-3 size-4" />
            SAIR DO SISTEMA
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
