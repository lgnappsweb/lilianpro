
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
        <Loader2 className="size-12 animate-spin text-primary" />
        <p className="text-xl text-muted-foreground animate-pulse font-medium">Sincronizando seus dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary font-headline">Olá, {user?.displayName || 'Administradora'}!</h1>
          <p className="text-lg text-muted-foreground mt-2 font-medium">Seu resumo de hoje.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="flex-1 sm:flex-none h-14 px-8 bg-primary hover:bg-primary/90 text-lg font-bold shadow-lg">
            <Link href="/vendas/nova">
              <PlusCircle className="mr-2 h-6 w-6" />
              Nova Venda
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-md hover:shadow-lg transition-all border-l-4 border-l-primary/30">
            <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 px-4 pt-4 sm:px-6 sm:pt-6">
              <CardTitle className="text-xs sm:text-base font-bold text-muted-foreground uppercase tracking-widest">{stat.title}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2 rounded-xl hidden sm:block shadow-inner`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
              <div className="text-xl sm:text-3xl font-black truncate text-foreground">{stat.value}</div>
              <p className="text-xs sm:text-sm font-bold text-muted-foreground/80 mt-1 truncate">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-7">
        <Card className="md:col-span-4 border-none shadow-lg overflow-hidden bg-gradient-to-br from-white to-pink-50 dark:from-slate-950 dark:to-pink-950/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 text-primary">
              <Sparkles className="size-7" />
              <CardTitle className="text-2xl sm:text-3xl font-black font-headline tracking-tight">Resumo de IA</CardTitle>
            </div>
            <CardDescription className="text-sm font-medium">Baseado em {orders?.length} vendas realizadas</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="bg-white/70 dark:bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-primary/20 shadow-sm">
              <p className="leading-relaxed whitespace-pre-line text-sm sm:text-lg text-foreground/90 font-medium">
                {aiSummaryText}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl font-black font-headline flex items-center gap-3">
              <ShoppingBag className="size-7 text-primary" />
              Catálogo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50">
              <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                <Package className="size-8" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-black truncate">Produtos</p>
                <p className="text-sm text-muted-foreground font-bold">{products?.length || 0} itens cadastrados</p>
              </div>
              <Badge variant="secondary" className="text-xs font-bold px-3 py-1">{products?.filter(p => p.brand === "Natura").length} Nat.</Badge>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border/50">
              <div className="size-14 rounded-xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20 shadow-sm">
                <Users className="size-8" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-black truncate">Clientes</p>
                <p className="text-sm text-muted-foreground font-bold">{clients?.length || 0} perfis ativos</p>
              </div>
              <Badge variant="secondary" className="text-xs font-bold px-3 py-1">{clients?.length || 0} cont.</Badge>
            </div>
            <Button variant="outline" className="w-full text-base font-bold text-primary hover:text-primary/80 hover:bg-primary/5 h-12 mt-4 rounded-xl border-primary/20" asChild>
              <Link href="/produtos">Acessar Catálogo Completo <ChevronRight className="ml-2 size-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between px-6 py-6 bg-muted/30">
          <CardTitle className="text-2xl sm:text-3xl font-black font-headline">Vendas Recentes</CardTitle>
          <Button variant="outline" size="sm" className="h-10 text-sm font-bold px-4 rounded-xl border-primary/20 text-primary" asChild>
            <Link href="/pedidos">Ver Histórico</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-base min-w-[600px] sm:min-w-0">
              <thead>
                <tr className="border-b text-muted-foreground text-sm uppercase tracking-widest font-black">
                  <th className="h-14 px-6 text-left font-black">Data</th>
                  <th className="h-14 px-6 text-left font-black">Total</th>
                  <th className="h-14 px-6 text-left font-black">Status</th>
                  <th className="h-14 px-6 text-right font-black">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y text-base">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-5 text-muted-foreground font-medium">{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td className="px-6 py-5 font-black text-lg">R$ {Number(order.finalAmount).toFixed(2)}</td>
                    <td className="px-6 py-5">
                      <Badge variant={order.paymentStatus === "Pago" ? "default" : order.paymentStatus === "Atrasado" ? "destructive" : "secondary"} className={`text-xs font-black px-3 py-1 ${order.paymentStatus === "Pago" ? "bg-green-600 hover:bg-green-700" : ""}`}>
                        {order.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Button variant="ghost" size="sm" className="h-10 text-sm font-bold text-primary hover:bg-primary/10" asChild>
                        <Link href={`/pedidos/${order.id}`}>Detalhes</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentOrders.length === 0 && (
              <div className="text-center py-16 text-muted-foreground text-lg font-medium italic">
                Ainda não há pedidos registrados.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
