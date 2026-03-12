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

  // Buscar dados reais do Firestore
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

  // Cálculos de Estatísticas Reais
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
        description: "Histórico total de vendas",
        icon: TrendingUp,
        color: "text-primary",
        bg: "bg-primary/10",
      },
      {
        title: "Total Recebido",
        value: `R$ ${totalRecebido.toFixed(2)}`,
        description: `${totalVendido > 0 ? ((totalRecebido / totalVendido) * 100).toFixed(0) : 0}% do total`,
        icon: Wallet,
        color: "text-green-600",
        bg: "bg-green-100",
      },
      {
        title: "Total Pendente",
        value: `R$ ${totalPendente.toFixed(2)}`,
        description: `${pendentesCount} pagamentos em aberto`,
        icon: Clock,
        color: "text-orange-600",
        bg: "bg-orange-100",
      },
      {
        title: "Total Clientes",
        value: (clients?.length || 0).toString(),
        description: "Clientes na base",
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

  // Efeito para gerar o resumo de IA baseado em dados REAIS
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
          topSellingProducts: [], // Poderia ser calculado via OrderItems
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">Olá, {user?.displayName || 'Administradora'}!</h1>
          <p className="text-muted-foreground mt-1">Dados reais do seu negócio em tempo real.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="h-10">
            <Link href="/pedidos">Ver Todos Pedidos</Link>
          </Button>
          <Button asChild className="h-10 bg-primary hover:bg-primary/90">
            <Link href="/vendas/nova">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Venda
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 border-none shadow-sm overflow-hidden bg-gradient-to-br from-white to-pink-50 dark:from-slate-950 dark:to-pink-950/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="size-5" />
              <CardTitle className="text-xl font-headline">Resumo de IA Personalizado</CardTitle>
            </div>
            <CardDescription>Análise baseada no seu volume atual de {orders?.length} vendas</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="bg-white/60 dark:bg-black/20 backdrop-blur-sm p-5 rounded-xl border border-primary/10">
              <p className="leading-relaxed whitespace-pre-line text-sm text-foreground/90">
                {aiSummaryText}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center gap-2">
              <ShoppingBag className="size-5 text-primary" />
              Catálogo
            </CardTitle>
            <CardDescription>Resumo do seu inventário</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-lg bg-muted flex items-center justify-center text-primary border border-border">
                  <Package className="size-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Total de Produtos</p>
                  <p className="text-xs text-muted-foreground">{products?.length || 0} itens cadastrados</p>
                </div>
                <div className="text-right">
                   <Badge variant="outline">{products?.filter(p => p.brand === "Natura").length} Natura</Badge>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-lg bg-muted flex items-center justify-center text-primary border border-border">
                  <Users className="size-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Base de Clientes</p>
                  <p className="text-xs text-muted-foreground">{clients?.length || 0} perfis ativos</p>
                </div>
                <div className="text-right">
                   <Badge variant="outline">{clients?.length || 0} contatos</Badge>
                </div>
              </div>
            </div>
            <Button variant="ghost" className="w-full mt-6 text-primary hover:text-primary/80 hover:bg-primary/5" asChild>
              <Link href="/produtos">Gerenciar Catálogo <ChevronRight className="ml-1 size-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-headline">Vendas Recentes</CardTitle>
            <CardDescription>Seus últimos registros em tempo real</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/pedidos">Ver histórico completo</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="h-10 px-4 text-left font-medium">Data</th>
                  <th className="h-10 px-4 text-left font-medium">Total</th>
                  <th className="h-10 px-4 text-left font-medium">Status</th>
                  <th className="h-10 px-4 text-left font-medium">Pagamento</th>
                  <th className="h-10 px-4 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4 text-muted-foreground">{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td className="p-4 font-semibold">R$ {Number(order.finalAmount).toFixed(2)}</td>
                    <td className="p-4">
                      <Badge variant={order.paymentStatus === "Pago" ? "default" : order.paymentStatus === "Atrasado" ? "destructive" : "secondary"} className={order.paymentStatus === "Pago" ? "bg-green-600 hover:bg-green-600" : ""}>
                        {order.paymentStatus}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground capitalize">{order.paymentMethod}</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/pedidos/${order.id}`}>Detalhes</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentOrders.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                Nenhum pedido encontrado. Inicie uma nova venda!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}