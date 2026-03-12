
"use client";

import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Award,
  Users,
  Download,
  BarChart3,
  Loader2,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Cores Elite para as Marcas: Verde (N), Rosa (A - Primary), Marrom (C&E)
const COLORS = ["#16a34a", "#C2185B", "#78350f"];

export default function RelatoriosPage() {
  const { user } = useUser();
  const db = useFirestore();

  // Busca dados do Firestore
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "orders");
  }, [db, user]);

  const clientsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "clients");
  }, [db, user]);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "products");
  }, [db, user]);

  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);
  const { data: clients, isLoading: clientsLoading } = useCollection(clientsQuery);
  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);

  // 1. Processamento: Evolução de Vendas (Últimos 6 meses)
  const salesHistory = useMemo(() => {
    if (!orders) return [];
    
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        name: format(date, "MMM", { locale: ptBR }).toUpperCase(),
        fullName: format(date, "MMMM / yyyy", { locale: ptBR }),
        start: startOfMonth(date),
        end: endOfMonth(date),
        total: 0
      };
    });

    orders.forEach(order => {
      const orderDate = new Date(order.orderDate);
      months.forEach(m => {
        if (isWithinInterval(orderDate, { start: m.start, end: m.end })) {
          m.total += Number(order.finalAmount) || 0;
        }
      });
    });

    return months;
  }, [orders]);

  // 2. Processamento: Melhores Clientes
  const topClients = useMemo(() => {
    if (!orders || !clients) return [];

    const clientStats = clients.map(client => {
      const clientOrders = orders.filter(o => o.clientId === client.id);
      const totalSpent = clientOrders.reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0);
      return {
        name: client.fullName,
        total: totalSpent,
        count: clientOrders.length
      };
    });

    return clientStats
      .filter(c => c.count > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [orders, clients]);

  // 3. Processamento: Mix de Marcas Real (Baseado no Catálogo)
  const brandStats = useMemo(() => {
    if (!products || products.length === 0) {
      return [
        { name: "VERDE (N)", value: 0 },
        { name: "ROSA (A)", value: 0 },
        { name: "MARROM (C&E)", value: 0 },
      ];
    }

    const counts = {
      "VERDE (N)": 0,
      "ROSA (A)": 0,
      "MARROM (C&E)": 0,
    };

    products.forEach(p => {
      const brand = p.brand as keyof typeof counts;
      if (counts.hasOwnProperty(brand)) {
        counts[brand]++;
      }
    });

    const total = products.length;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  }, [products]);

  const handleGeneratePDF = () => {
    if (!orders || !clients) return;

    const doc = new jsPDF();
    const now = new Date();
    const timestamp = format(now, "dd/MM/yyyy HH:mm");

    // --- CAPA & CABEÇALHO ---
    doc.setFillColor(194, 24, 91); // Primary Color
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("GLAMGESTÃO", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("RELATÓRIO DE DESEMPENHO ELITE", 105, 30, { align: "center" });

    // --- RESUMO EXECUTIVO ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text("Resumo Geral", 14, 55);
    
    const totalRevenue = orders.reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0);
    const avgTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

    autoTable(doc, {
      startY: 60,
      head: [['Métrica', 'Valor']],
      body: [
        ['Faturamento Total Acumulado', `R$ ${totalRevenue.toFixed(2)}`],
        ['Total de Vendas Realizadas', `${orders.length} pedidos`],
        ['Ticket Médio por Venda', `R$ ${avgTicket.toFixed(2)}`],
        ['Base de Clientes Ativos', `${clients.length} contatos`],
        ['Total de Itens no Catálogo', `${products?.length || 0} itens`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [194, 24, 91] },
      styles: { fontSize: 11, cellPadding: 5 }
    });

    // --- EVOLUÇÃO MENSAL ---
    doc.setFontSize(18);
    doc.text("Evolução de Vendas (6 Meses)", 14, (doc as any).lastAutoTable.finalY + 20);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 25,
      head: [['Mês / Ano', 'Faturamento']],
      body: salesHistory.map(s => [s.fullName, `R$ ${s.total.toFixed(2)}`]),
      headStyles: { fillColor: [173, 20, 87] },
      theme: 'striped'
    });

    // --- TOP CLIENTES ---
    doc.addPage();
    doc.setFillColor(194, 24, 91);
    doc.rect(0, 0, 210, 15, 'F');
    
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text("Ranking de Clientes VIP", 14, 30);
    
    autoTable(doc, {
      startY: 35,
      head: [['Pos.', 'Nome da Cliente', 'Total Comprado', 'Pedidos']],
      body: topClients.map((c, i) => [
        `${i + 1}º`,
        c.name,
        `R$ ${c.total.toFixed(2)}`,
        `${c.count}`
      ]),
      headStyles: { fillColor: [194, 24, 91] },
      columnStyles: {
        0: { cellWidth: 15 },
        2: { fontStyle: 'bold', textColor: [22, 163, 74] }
      }
    });

    // --- RODAPÉ ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`GlamGestão Elite - Gerado em ${timestamp}`, 14, 285);
      doc.text(`Página ${i} de ${pageCount}`, 180, 285);
    }

    doc.save(`Relatorio_Elite_GlamGestao_${now.toISOString().split('T')[0]}.pdf`);
  };

  if (ordersLoading || clientsLoading || productsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground">
        <Loader2 className="size-16 animate-spin text-primary" />
        <p className="text-2xl font-black animate-pulse uppercase tracking-widest text-center">Analisando performance...</p>
      </div>
    );
  }

  const isMixEmpty = brandStats.every(s => s.value === 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 w-full overflow-x-hidden">
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <BarChart3 className="size-16 sm:size-24 text-primary" />
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap px-2">RELATÓRIOS</h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">Desempenho do seu negócio em gráficos detalhados.</p>
        </div>
        <Button 
          onClick={handleGeneratePDF}
          className="w-full h-14 sm:h-20 px-8 text-lg sm:text-2xl font-black rounded-2xl bg-primary hover:bg-primary/90 text-white transition-transform hover:scale-105 shadow-xl uppercase tracking-widest gap-4"
        >
          <Download className="size-6 sm:size-8" />
          Baixar PDF Elite
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Sales Trend Chart */}
        <Card className="md:col-span-2 border-none shadow-lg rounded-[2rem] overflow-hidden bg-background/50 backdrop-blur-sm border-2 border-primary/5">
          <CardHeader className="bg-muted/10 pb-4">
            <CardTitle className="text-2xl font-black flex items-center gap-3 px-2">
              <TrendingUp className="size-7 text-primary" />
              Evolução de Vendas
            </CardTitle>
            <CardDescription className="text-base font-bold uppercase tracking-widest opacity-60">Faturamento total dos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888", fontWeight: 900 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888", fontWeight: 900 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "1.5rem", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", padding: "1rem" }}
                    cursor={{ fill: "rgba(194, 24, 91, 0.05)" }}
                    formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, "Vendas"]}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Brands Distribution */}
        <Card className="border-none shadow-lg rounded-[2rem] overflow-hidden bg-background/50 backdrop-blur-sm border-2 border-primary/5">
          <CardHeader className="bg-muted/10 pb-4">
            <CardTitle className="text-2xl font-black flex items-center gap-3 px-2">
              <Award className="size-7 text-primary" />
              Mix de Marcas
            </CardTitle>
            <CardDescription className="text-base font-bold uppercase tracking-widest opacity-60">Distribuição real do seu catálogo</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[280px] w-full relative">
              {isMixEmpty ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 opacity-20">
                  <Package className="size-16" />
                  <p className="font-black text-center uppercase tracking-tighter">Sem produtos cadastrados</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={brandStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {brandStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "1rem", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex flex-col gap-4 mt-6">
              {brandStats.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border-2 border-transparent hover:border-primary/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="size-4 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-lg font-black px-2 italic">{item.name}</span>
                  </div>
                  <span className="text-lg font-black text-primary px-2">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Clients Table */}
        <Card className="md:col-span-3 border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-background/50 backdrop-blur-sm border-2 border-primary/5">
          <CardHeader className="bg-muted/10 pb-4">
            <CardTitle className="text-2xl font-black flex items-center gap-3 px-2">
              <Users className="size-7 text-primary" />
              Melhores Clientes (VIP)
            </CardTitle>
            <CardDescription className="text-base font-bold uppercase tracking-widest opacity-60">Ranking por volume total de compras</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-8 space-y-6">
            {topClients.map((client, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-center justify-between p-6 rounded-[2rem] border-4 border-muted bg-background hover:border-primary/20 transition-all group gap-4">
                <div className="flex items-center gap-5 w-full sm:w-auto">
                  <div className="size-14 sm:size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xl sm:text-3xl font-black text-foreground leading-tight px-2 uppercase italic truncate">{client.name}</p>
                    <p className="text-[10px] sm:text-xs font-black text-muted-foreground mt-1 uppercase tracking-widest px-2">{client.count} pedidos realizados</p>
                  </div>
                </div>
                <div className="text-center sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-muted">
                  <p className="text-3xl sm:text-4xl font-black text-green-600 leading-tight px-2 italic tracking-tighter">R$ {client.total.toFixed(2)}</p>
                  <p className="text-[8px] sm:text-[10px] font-black text-white bg-green-600 px-3 py-1 rounded-full mt-2 inline-block uppercase tracking-[0.2em] shadow-lg">Cliente Diamante</p>
                </div>
              </div>
            ))}
            {topClients.length === 0 && (
              <div className="text-center py-20 bg-muted/10 rounded-[2rem] border-4 border-dashed border-muted">
                <Users className="size-16 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg font-black uppercase tracking-tighter opacity-40 italic">Nenhum dado de cliente disponível para o ranking.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
