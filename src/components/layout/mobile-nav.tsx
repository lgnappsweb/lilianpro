
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  Plus,
  Tag,
  Package,
  ClipboardList,
  Wallet,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const primaryItems = [
  { name: "Painel", icon: LayoutDashboard, href: "/" },
  { name: "Clientes", icon: Users, href: "/clientes" },
];

const moreItems = [
  { name: "Categorias", icon: Tag, href: "/categorias" },
  { name: "Produtos", icon: Package, href: "/produtos" },
  { name: "Pedidos", icon: ClipboardList, href: "/pedidos" },
  { name: "Financeiro", icon: Wallet, href: "/financeiro" },
  { name: "Relatórios", icon: BarChart3, href: "/relatorios" },
  { name: "Ajustes", icon: Settings, href: "/configuracoes" },
];

export function MobileNav() {
  const pathname = usePathname();

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
        <span className="text-[10px] font-bold">Venda</span>
      </Link>

      {primaryItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            "flex flex-col items-center justify-center gap-1 transition-colors",
            pathname === item.href ? "text-primary" : "text-muted-foreground"
          )}
        >
          <item.icon className="size-6" />
          <span className="text-[10px] font-medium">{item.name}</span>
        </Link>
      ))}

      {/* Botão central de Mais (+) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted border border-border text-muted-foreground shadow-sm">
              <Plus className="size-6" />
            </div>
            <span className="text-[10px] font-medium">Mais</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 mb-4">
          {moreItems.map((item) => (
            <DropdownMenuItem key={item.name} asChild>
              <Link href={item.href} className="flex items-center gap-2 py-2 cursor-pointer">
                <item.icon className="size-4" />
                <span className="text-sm">{item.name}</span>
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
