
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
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

const navItems = [
  { name: "Nova Venda", icon: PlusCircle, href: "/vendas/nova" },
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

  return (
    <Sidebar variant="inset" collapsible="icon" className="hidden md:flex">
      <SidebarHeader className="flex items-center justify-center py-6">
        <div className="flex items-center gap-2 px-4 group-data-[collapsible=icon]:px-0">
          <div className="bg-primary p-2 rounded-xl flex items-center justify-center text-primary-foreground">
            <Sparkles className="size-6" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tight text-primary group-data-[collapsible=icon]:hidden">
            GlamGestão
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.name}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
