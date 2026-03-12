import React from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { generateMonthlySalesSummary } from "@/ai/flows/generate-monthly-sales-summary";

export default async function DashboardPage() {
  // Dados mockados para o resumo do dashboard
  const stats = [
    {
      title: "Total Vendido (Mês)",
      value: "R$ 4.250,00",
      description: "+12.5% em relação ao mês anterior",
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Total Recebido",
      value: "R$ 3.120,00",
      description: "73% do total vendido",
      icon: Wallet,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Total Pendente",
      value: "R$ 1.130,00",
      description: "8 pagamentos em aberto",
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      title: "Novos Clientes",
      value: "14",
      description: "+2 esta semana",
      icon: Users,
      color: "text-accent",
      bg: "bg-accent/10",
    },
  ];

  const recentOrders = [
    { id: "101", customer: "Maria Silva", total: 185.90, date: "Hoje", status: "Pago", method: "Pix" },
    { id: "102", customer: "Ana Paula", total: 320.00, date: "Ontem", status: "Pendente", method: "Fiado" },
    { id: "103", customer: "Juliana Costa", total: 120.00, date: "Ontem", status: "Pago", method: "Cartão" },
    { id: "104", customer: "Clara Mendes", total: 245.00, date: "2 dias atrás", status: "Atrasado", method: "Fiado" },
  ];

  const topProducts = [
    { name: "Perfume Essencial Natura", category: "Perfumes", sales: 12, growth: "+15%" },
    { name: "Batom Ultra Matte Avon", category: "Maquiagem", sales: 25, growth: "+8%" },
    { name: "Hidratante Tododia", category: "Corpo", sales: 18, growth: "+22%" },
  ];

  // Em um app real, estes valores viriam do banco de dados
  const aiSummaryInput = {
    month: "Janeiro",
    year: 2024,
    totalSalesMonth: 4250,
    totalReceivedMonth: 3120,
    totalPendingMonth: 1130,
    numberOfClients: 14,
    numberOfOrders: 28,
    topSellingProducts: topProducts.map(p => ({ name: p.name, quantity: p.sales })),
    totalProductsRegistered: 156,
  };

  let aiSummaryText = "Os insights automáticos estão sendo preparados...";
  
  try {
    // Chamada ultra-segura para o fluxo de IA
    const aiSummary = await generateMonthlySalesSummary(aiSummaryInput);
    aiSummaryText = aiSummary?.summary || "Não foi possível carregar o resumo inteligente neste momento.";
  } catch (error) {
    // Falha silenciosa para garantir que a dashboard carregue o resto dos dados
    console.error("DashboardPage: Falha ao obter resumo de IA:", error);
    aiSummaryText = "O resumo de IA está temporariamente indisponível. O restante dos seus dados está visível abaixo.";
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">Olá, Administradora!</h1>
          <p className="text-muted-foreground mt-1">Veja como estão suas vendas da Avon e Natura hoje.</p>
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

      {/* Cards de Estatísticas */}
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
        {/* Seção de Insight de IA */}
        <Card className="md:col-span-4 border-none shadow-sm overflow-hidden bg-gradient-to-br from-white to-pink-50 dark:from-slate-950 dark:to-pink-950/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="size-5" />
              <CardTitle className="text-xl font-headline">Resumo de IA do Mês</CardTitle>
            </div>
            <CardDescription>Análise inteligente do desempenho das suas vendas</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="bg-white/60 dark:bg-black/20 backdrop-blur-sm p-5 rounded-xl border border-primary/10 prose prose-sm dark:prose-invert max-w-none">
              <p className="leading-relaxed whitespace-pre-line text-sm text-foreground/90">
                {aiSummaryText}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Produtos em Alta */}
        <Card className="md:col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center gap-2">
              <ShoppingBag className="size-5 text-primary" />
              Produtos em Alta
            </CardTitle>
            <CardDescription>Os itens mais vendidos esta semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {topProducts.map((product, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="size-12 rounded-lg bg-muted flex items-center justify-center text-primary border border-border">
                    <Package className="size-6" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold leading-none">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{product.sales} vendidos</p>
                    <p className="text-xs text-green-600 font-medium">{product.growth}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-6 text-primary hover:text-primary/80 hover:bg-primary/5" asChild>
              <Link href="/produtos">Ver estoque completo <ChevronRight className="ml-1 size-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Pedidos Recentes */}
      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-headline">Pedidos Recentes</CardTitle>
            <CardDescription>Acompanhe suas últimas 4 vendas registradas</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/pedidos">Ver tudo</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="h-10 px-4 text-left font-medium">Cliente</th>
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
                    <td className="p-4 font-medium">{order.customer}</td>
                    <td className="p-4 text-muted-foreground">{order.date}</td>
                    <td className="p-4 font-semibold">R$ {order.total.toFixed(2)}</td>
                    <td className="p-4">
                      <Badge variant={order.status === "Pago" ? "default" : order.status === "Atrasado" ? "destructive" : "secondary"} className={order.status === "Pago" ? "bg-green-600 hover:bg-green-600" : ""}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">{order.method}</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/pedidos/${order.id}`}>Detalhes</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
