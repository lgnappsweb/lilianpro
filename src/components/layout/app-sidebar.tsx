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
  Search,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

const navItems = [
  { name: "Painel", icon: LayoutDashboard, href: "/" },
  { name: "Clientes", icon: Users, href: "/clientes" },
  { name: "Produtos", icon: Package, href: "/produtos" },
  { name: "Nova Venda", icon: PlusCircle, href: "/vendas/nova" },
  { name: "Pedidos", icon: ClipboardList, href: "/pedidos" },
  { name: "Financeiro", icon: Wallet, href: "/financeiro" },
  { name: "Relatórios", icon: BarChart3, href: "/relatorios" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar variant="inset" collapsible="icon">
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
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.name}
                    className="transition-all duration-200"
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
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Configurações">
              <Settings className="size-5" />
              <span className="font-medium group-data-[collapsible=icon]:hidden">Configurações</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
