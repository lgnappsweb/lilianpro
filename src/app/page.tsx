
"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  Users,
  ShoppingBag,
  Wallet,
  Clock,
  ChevronRight,
  Sparkles,
  Package,
  PlusCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { generateMonthlySalesSummary } from "@/ai/flows/generate-monthly-sales-summary";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";

export default function DashboardPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [aiSummaryText, setAiSummaryText] = useState("Analisando seus dados reais...");

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "orders");
  }, [db, user]);
  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);

  const clientsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "clients");
  }, [db, user]);
  const { data: clients, isLoading: clientsLoading } = useCollection(clientsQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "products");
  }, [db, user]);
  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);

  const stats = useMemo(() => {
    if (!orders) return [
      { title: "Total Vendido", value: "R$ 0,00", description: "Carregando...", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
      { title: "Total Recebido", value: "R$ 0,00", description: "0%", icon: Wallet, color: "text-green-600", bg: "bg-green-100" },
      { title: "Total Pendente", value: "R$ 0,00", description: "0 abertos", icon: Clock, color: "text-orange-600", bg: "bg-orange-100" },
      { title: "Total Clientes", value: "0", description: "Cadastrados", icon: Users, color: "text-accent", bg: "bg-accent/10" },
    ];

    const totalVendido = orders.reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0);
    const totalRecebido = orders.filter(o => o.paymentStatus === "Pago").reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0);
    const totalPendente = orders.filter(o => o.paymentStatus === "Pendente" || o.paymentStatus === "Atrasado").reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0);
    const pendentesCount = orders.filter(o => o.paymentStatus !== "Pago").length;

    return [
      {
        title: "Total Vendido",
        value: `R$ ${totalVendido.toFixed(2)}`,
        description: "Histórico total",
        icon: TrendingUp,
        color: "text-primary",
        bg: "bg-primary/10",
      },
      {
        title: "Total Recebido",
        value: `R$ ${totalRecebido.toFixed(2)}`,
        description: `${totalVendido > 0 ? ((totalRecebido / totalVendido) * 100).toFixed(0) : 0}%`,
        icon: Wallet,
        color: "text-green-600",
        bg: "bg-green-100",
      },
      {
        title: "Total Pendente",
        value: `R$ ${totalPendente.toFixed(2)}`,
        description: `${pendentesCount} abertos`,
        icon: Clock,
        color: "text-orange-600",
        bg: "bg-orange-100",
      },
      {
        title: "Total Clientes",
        value: (clients?.length || 0).toString(),
        description: "Na base",
        icon: Users,
        color: "text-accent",
        bg: "bg-accent/10",
      },
    ];
  }, [orders, clients]);

  const recentOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()).slice(0, 4);
  }, [orders]);

  useEffect(() => {
    async function getAISummary() {
      if (!orders || orders.length === 0) {
        setAiSummaryText("Cadastre suas primeiras vendas para que eu possa gerar uma análise inteligente do seu negócio!");
        return;
      }

      try {
        const input = {
          month: new Date().toLocaleString('pt-BR', { month: 'long' }),
          year: new Date().getFullYear(),
          totalSalesMonth: orders.reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0),
          totalReceivedMonth: orders.filter(o => o.paymentStatus === "Pago").reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0),
          totalPendingMonth: orders.filter(o => o.paymentStatus !== "Pago").reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0),
          numberOfClients: clients?.length || 0,
          numberOfOrders: orders.length,
          topSellingProducts: [],
          totalProductsRegistered: products?.length || 0,
        };
        const result = await generateMonthlySalesSummary(input);
        setAiSummaryText(result.summary);
      } catch (error) {
        setAiSummaryText("O resumo inteligente está temporariamente indisponível.");
      }
    }

    if (orders && clients && products) {
      getAISummary();
    }
  }, [orders, clients, products]);

  if (ordersLoading || clientsLoading || productsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Sincronizando seus dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary font-headline">Olá, {user?.displayName || 'Administradora'}!</h1>
          <p className="text-sm text-muted-foreground mt-1">Seu resumo de hoje.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild className="flex-1 sm:flex-none h-10 bg-primary hover:bg-primary/90">
            <Link href="/vendas/nova">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Venda
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-3 pt-3 sm:px-6 sm:pt-6">
              <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase">{stat.title}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-1.5 rounded-lg hidden sm:block`}>
                <stat.icon className="h-3 w-3" />
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
              <div className="text-sm sm:text-2xl font-bold truncate">{stat.value}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 border-none shadow-sm overflow-hidden bg-gradient-to-br from-white to-pink-50 dark:from-slate-950 dark:to-pink-950/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="size-5" />
              <CardTitle className="text-lg sm:text-xl font-headline">Resumo de IA</CardTitle>
            </div>
            <CardDescription className="text-xs">Baseado em {orders?.length} vendas</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="bg-white/60 dark:bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-primary/10">
              <p className="leading-relaxed whitespace-pre-line text-xs sm:text-sm text-foreground/90">
                {aiSummaryText}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl font-headline flex items-center gap-2">
              <ShoppingBag className="size-5 text-primary" />
              Catálogo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-primary border border-border">
                <Package className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">Produtos</p>
                <p className="text-xs text-muted-foreground">{products?.length || 0} itens</p>
              </div>
              <Badge variant="outline" className="text-[10px]">{products?.filter(p => p.brand === "Natura").length} Nat.</Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-primary border border-border">
                <Users className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">Clientes</p>
                <p className="text-xs text-muted-foreground">{clients?.length || 0} perfis</p>
              </div>
              <Badge variant="outline" className="text-[10px]">{clients?.length || 0} cont.</Badge>
            </div>
            <Button variant="ghost" className="w-full text-xs text-primary hover:text-primary/80 hover:bg-primary/5 h-8 mt-2" asChild>
              <Link href="/produtos">Ir para Catálogo <ChevronRight className="ml-1 size-3" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl font-headline">Vendas Recentes</CardTitle>
          <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
            <Link href="/pedidos">Histórico</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm min-w-[500px] sm:min-w-0">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="h-10 px-4 text-left font-medium">Data</th>
                  <th className="h-10 px-4 text-left font-medium">Total</th>
                  <th className="h-10 px-4 text-left font-medium">Status</th>
                  <th className="h-10 px-4 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs sm:text-sm">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4 text-muted-foreground">{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td className="p-4 font-semibold">R$ {Number(order.finalAmount).toFixed(2)}</td>
                    <td className="p-4">
                      <Badge variant={order.paymentStatus === "Pago" ? "default" : order.paymentStatus === "Atrasado" ? "destructive" : "secondary"} className={`text-[10px] ${order.paymentStatus === "Pago" ? "bg-green-600" : ""}`}>
                        {order.paymentStatus}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-[10px]" asChild>
                        <Link href={`/pedidos/${order.id}`}>Ver</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentOrders.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                Nenhum pedido encontrado.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
