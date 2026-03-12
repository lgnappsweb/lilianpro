
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
    const totalVendido = orders?.reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0) || 0;
    const totalRecebido = orders?.filter(o => o.paymentStatus === "Pago").reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0) || 0;
    const totalPendente = orders?.filter(o => o.paymentStatus !== "Pago").reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0) || 0;

    return [
      {
        title: "Total Vendido",
        value: `R$ ${totalVendido.toFixed(2)}`,
        description: "Faturamento total",
        icon: TrendingUp,
        color: "text-primary",
        bg: "bg-primary/10",
      },
      {
        title: "Total Recebido",
        value: `R$ ${totalRecebido.toFixed(2)}`,
        description: "Dinheiro em caixa",
        icon: Wallet,
        color: "text-green-600",
        bg: "bg-green-100",
      },
      {
        title: "Total Pendente",
        value: `R$ ${totalPendente.toFixed(2)}`,
        description: "Contas a receber",
        icon: Clock,
        color: "text-orange-600",
        bg: "bg-orange-100",
      },
      {
        title: "Total Clientes",
        value: (clients?.length || 0).toString(),
        description: "Contatos ativos",
        icon: Users,
        color: "text-accent",
        bg: "bg-accent/10",
      },
    ];
  }, [orders, clients]);

  const recentOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()).slice(0, 5);
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
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">Sincronizando dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary font-headline">Olá, {user?.displayName || 'Administradora'}!</h1>
          <p className="text-muted-foreground mt-1">Veja como está o seu negócio hoje.</p>
        </div>
        <Button asChild className="h-12 px-6 font-bold shadow-md rounded-xl">
          <Link href="/vendas/nova">
            <PlusCircle className="mr-2 h-5 w-5" />
            Nova Venda
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 pt-4">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.title}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2 rounded-lg hidden sm:block`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl font-bold truncate">{stat.value}</div>
              <p className="text-[10px] font-medium text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 border-none shadow-md overflow-hidden bg-gradient-to-br from-white to-pink-50 dark:from-slate-950 dark:to-pink-950/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="size-5" />
              <CardTitle className="text-lg font-bold">Resumo Inteligente</CardTitle>
            </div>
            <CardDescription className="text-xs">Insights automáticos baseados nos seus dados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white/60 dark:bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-primary/10">
              <p className="leading-relaxed text-sm text-foreground/80 font-medium">
                {aiSummaryText}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ShoppingBag className="size-5 text-primary" />
              Catálogo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Package className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">Produtos</p>
                <p className="text-xs text-muted-foreground">{products?.length || 0} itens</p>
              </div>
              <Badge variant="secondary" className="text-[10px] font-bold">{products?.filter(p => p.brand === "Natura").length} Nat.</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
              <div className="size-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <Users className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">Clientes</p>
                <p className="text-xs text-muted-foreground">{clients?.length || 0} contatos</p>
              </div>
              <Badge variant="secondary" className="text-[10px] font-bold">{clients?.length || 0} total</Badge>
            </div>
            <Button variant="outline" className="w-full text-xs font-bold text-primary h-10 mt-2 rounded-xl" asChild>
              <Link href="/produtos">Acessar Catálogo Completo <ChevronRight className="ml-1 size-3" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between px-6 py-4 bg-muted/20">
          <CardTitle className="text-lg font-bold">Vendas Recentes</CardTitle>
          <Button variant="outline" size="sm" className="h-8 text-xs font-bold rounded-lg border-primary/20 text-primary" asChild>
            <Link href="/pedidos">Ver Todos</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
                  <th className="h-10 px-6 text-left">Data</th>
                  <th className="h-10 px-6 text-left">Total</th>
                  <th className="h-10 px-6 text-left">Status</th>
                  <th className="h-10 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground font-medium">{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold">R$ {Number(order.finalAmount).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <Badge variant={order.paymentStatus === "Pago" ? "default" : "secondary"} className={`text-[10px] font-bold px-2 py-0.5 ${order.paymentStatus === "Pago" ? "bg-green-600" : ""}`}>
                        {order.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-primary" asChild>
                        <Link href={`/pedidos/${order.id}`}>Ver</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentOrders.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm font-medium italic">
                Nenhuma venda registrada ainda.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
