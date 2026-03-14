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
  ArrowDownCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  Wallet,
  FileDown,
  Share2,
  FileText,
  TrendingUp,
  Users,
  Package,
  Trophy,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, getDocs } from "firebase/firestore";
import { format, startOfMonth, endOfMonth, isWithinInterval, setDate, setMonth, setYear, getDate, getMonth, getYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const MONTHS = [
  { value: "0", label: "Janeiro" },
  { value: "1", label: "Fevereiro" },
  { value: "2", label: "Março" },
  { value: "3", label: "Abril" },
  { value: "4", label: "Maio" },
  { value: "5", label: "Junho" },
  { value: "6", label: "Julho" },
  { value: "7", label: "Agosto" },
  { value: "8", label: "Setembro" },
  { value: "9", label: "Outubro" },
  { value: "10", label: "Novembro" },
  { value: "11", label: "Dezembro" },
];
const YEARS = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

export default function FinanceiroPage() {
  const { user } = useUser();
  const db = useFirestore();

  const [date, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const [topProductsRaw, setTopProductsRaw] = useState<any[]>([]);
  const [isRankingsLoading, setIsRankingsLoading] = useState(false);

  const settingsRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid, "config", "settings");
  }, [db, user]);
  const { data: settings } = useDoc(settingsRef);
  const appName = settings?.appName || "LilianPro";

  // Busca configurações do ciclo
  const cycleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid, "config", "cycle");
  }, [db, user]);
  const { data: cycleData } = useDoc(cycleRef);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "products");
  }, [db, user]);
  const { data: allProducts } = useCollection(productsQuery);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "orders");
  }, [db, user]);

  const { data: ordersData, isLoading } = useCollection(ordersQuery);

  const orders = useMemo(() => {
    if (!ordersData) return [];
    return ordersData.filter(o => !o.isDeleted);
  }, [ordersData]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (!date?.from || !date?.to) return orders;
    
    return orders.filter((order) => {
      const orderDate = new Date(order.orderDate);
      return isWithinInterval(orderDate, { 
        start: date.from!, 
        end: date.to! 
      });
    });
  }, [orders, date]);

  // Cálculo dos Top Clientes
  const topClients = useMemo(() => {
    const clientMap: Record<string, { name: string, total: number, count: number }> = {};
    filteredOrders.forEach(o => {
      if (!clientMap[o.clientId]) {
        clientMap[o.clientId] = { name: o.clientName, total: 0, count: 0 };
      }
      clientMap[o.clientId].total += (Number(o.finalAmount) || 0);
      clientMap[o.clientId].count += 1;
    });
    return Object.values(clientMap).sort((a, b) => b.total - a.total).slice(0, 20);
  }, [filteredOrders]);

  // Busca de itens para o Ranking de Produtos
  useEffect(() => {
    if (!user || !db || filteredOrders.length === 0) {
      setTopProductsRaw([]);
      return;
    }

    const fetchItemsForRankings = async () => {
      setIsRankingsLoading(true);
      const productSales: Record<string, { name: string, quantity: number, total: number, productId: string }> = {};
      
      try {
        const itemPromises = filteredOrders.map(order => 
          getDocs(collection(db, "users", user.uid, "orders", order.id, "orderItems"))
        );
        
        const snapshots = await Promise.all(itemPromises);
        
        snapshots.forEach(snap => {
          snap.forEach(doc => {
            const item = doc.data();
            const pid = item.productId;
            if (!productSales[pid]) {
              productSales[pid] = { name: item.productName, quantity: 0, total: 0, productId: pid };
            }
            productSales[pid].quantity += (Number(item.quantity) || 0);
            productSales[pid].total += (Number(item.subtotal) || 0);
          });
        });

        const sorted = Object.values(productSales)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 20);
        
        setTopProductsRaw(sorted);
      } catch (e) {
        console.error("Erro ao carregar rankings de produtos:", e);
      } finally {
        setIsRankingsLoading(false);
      }
    };

    fetchItemsForRankings();
  }, [filteredOrders, user, db]);

  const topProducts = useMemo(() => {
    return topProductsRaw.map(tp => {
      const p = allProducts?.find(prod => prod.id === tp.productId);
      return { ...tp, brand: p?.brand || "OUTRA" };
    });
  }, [topProductsRaw, allProducts]);

  const financialStats = useMemo(() => {
    if (!filteredOrders) return { recebido: 0, pendente: 0, atrasado: 0 };
    const recebido = filteredOrders.filter(o => o.paymentStatus === "Pago").reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0);
    const pendente = filteredOrders.filter(o => o.paymentStatus === "Pendente").reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0);
    const atrasado = filteredOrders.filter(o => o.paymentStatus === "Atrasado").reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0);

    return { recebido, pendente, atrasado };
  }, [filteredOrders]);

  const stats = useMemo(() => {
    const { recebido, pendente, atrasado } = financialStats;
    return [
      { title: "Entradas Totais", value: `R$ ${recebido.toFixed(2)}`, icon: ArrowDownCircle, color: "text-green-600", bg: "bg-green-100", stripe: "bg-green-600" },
      { title: "Pendentes", value: `R$ ${pendente.toFixed(2)}`, icon: Clock, color: "text-orange-600", bg: "bg-orange-100", stripe: "bg-orange-50" },
      { title: "Atrasados", value: `R$ ${atrasado.toFixed(2)}`, icon: AlertCircle, color: "text-red-600", bg: "bg-red-100", stripe: "bg-red-600" },
    ];
  }, [financialStats]);

  const proximosRecebimentos = useMemo(() => {
    if (!filteredOrders) return [];
    return filteredOrders
      .filter(o => o.paymentStatus === "Pendente" && o.dueDate)
      .sort((a, b) => (a.clientName || "").localeCompare(b.clientName || ""));
  }, [filteredOrders]);

  const entradasConfirmadas = useMemo(() => {
    if (!filteredOrders) return [];
    return filteredOrders
      .filter(o => o.paymentStatus === "Pago")
      .sort((a, b) => (a.clientName || "").localeCompare(b.clientName || ""));
  }, [filteredOrders]);

  const updateDatePart = (type: 'from' | 'to', part: 'day' | 'month' | 'year', value: string) => {
    if (!date) return;
    const current = date[type] || new Date();
    let newDate = new Date(current);

    if (part === 'day') newDate = setDate(newDate, parseInt(value));
    if (part === 'month') newDate = setMonth(newDate, parseInt(value));
    if (part === 'year') newDate = setYear(newDate, parseInt(value));

    setDateRange({ ...date, [type]: newDate });
  };

  const formatDateBR = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  };

  const formatDueDateBR = (dateString: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleShareText = () => {
    if (!date?.from || !date?.to) return;

    const fromStr = format(date.from, "dd/MM/yyyy");
    const toStr = format(date.to, "dd/MM/yyyy");

    let message = `📊 *RELATÓRIO FINANCEIRO ELITE - ${appName}*\n`;
    
    if (cycleData?.name) {
      message += `🔄 *Ciclo:* ${cycleData.name}\n`;
      if (cycleData.from) {
        message += `📅 *Vigência Ciclo:* ${new Date(cycleData.from).toLocaleDateString('pt-BR')} - ${new Date(cycleData.to).toLocaleDateString('pt-BR')}\n`;
      }
    }
    
    message += `📅 *Período do Relatório:* ${fromStr} - ${toStr}\n\n`;
    
    message += `💰 *RESUMO FINANCEIRO*\n`;
    message += `✅ Entradas: R$ ${financialStats.recebido.toFixed(2)}\n`;
    message += `⏳ Pendentes: R$ ${financialStats.pendente.toFixed(2)}\n`;
    message += `⚠️ Atrasados: R$ ${financialStats.atrasado.toFixed(2)}\n\n`;

    if (topProducts.length > 0) {
      message += `📦 *TOP PRODUTOS*\n`;
      topProducts.slice(0, 5).forEach((p, i) => {
        message += `${i+1}. ${p.name} (${p.brand}) - ${p.quantity} unid.\n`;
      });
      message += `\n`;
    }

    if (topClients.length > 0) {
      message += `👤 *TOP CLIENTES*\n`;
      topClients.slice(0, 5).forEach((c, i) => {
        message += `${i+1}. ${c.name} - R$ ${c.total.toFixed(2)}\n`;
      });
      message += `\n`;
    }

    if (proximosRecebimentos.length > 0) {
      message += `⏳ *CONTAS A RECEBER*\n`;
      proximosRecebimentos.slice(0, 5).forEach(p => {
        message += `• ${p.clientName}: R$ ${Number(p.finalAmount).toFixed(2)} (${formatDueDateBR(p.dueDate)})\n`;
      });
      message += `\n`;
    }

    message += `✨ _Gerado via ${appName}_`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  const handleGeneratePDF = () => {
    if (!date?.from || !date?.to) return;

    const doc = new jsPDF();
    const fromStr = format(date.from, "dd/MM/yyyy");
    const toStr = format(date.to, "dd/MM/yyyy");

    doc.setFontSize(22);
    doc.setTextColor(194, 24, 91);
    doc.text(`${appName} - Relatório Financeiro Detalhado`, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    
    let currentY = 28;
    if (cycleData?.name) {
      doc.text(`Ciclo Atual: ${cycleData.name}`, 14, currentY);
      currentY += 6;
      if (cycleData.from) {
        doc.text(`Período do Ciclo: ${new Date(cycleData.from).toLocaleDateString('pt-BR')} até ${new Date(cycleData.to).toLocaleDateString('pt-BR')}`, 14, currentY);
        currentY += 6;
      }
    }
    
    doc.text(`Período Relatório: ${fromStr} - ${toStr}`, 14, currentY);
    currentY += 6;
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, currentY);

    autoTable(doc, {
      startY: currentY + 10,
      head: [['RESUMO FINANCEIRO', 'VALOR']],
      body: [
        ['Entradas Confirmadas', `R$ ${financialStats.recebido.toFixed(2)}`],
        ['Pagamentos Pendentes', `R$ ${financialStats.pendente.toFixed(2)}`],
        ['Pagamentos Atrasados', `R$ ${financialStats.atrasado.toFixed(2)}`],
        ['TOTAL DO PERÍODO', `R$ ${(financialStats.recebido + financialStats.pendente + financialStats.atrasado).toFixed(2)}`]
      ],
      theme: 'striped',
      headStyles: { fillColor: [194, 24, 91] }
    });

    if (topProducts.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 15,
        head: [['TOP PRODUTOS', 'MARCA', 'QTD', 'TOTAL']],
        body: topProducts.map((p, i) => [
          `${i+1}º ${p.name}`,
          p.brand,
          p.quantity,
          `R$ ${p.total.toFixed(2)}`
        ]),
        headStyles: { fillColor: [194, 24, 91] }
      });
    }

    if (topClients.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 15,
        head: [['TOP CLIENTES', 'PEDIDOS', 'TOTAL']],
        body: topClients.map((c, i) => [
          `${i+1}º ${c.name}`,
          c.count,
          `R$ ${c.total.toFixed(2)}`
        ]),
        headStyles: { fillColor: [194, 24, 91] }
      });
    }

    if (proximosRecebimentos.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 15,
        head: [['CONTAS A RECEBER', 'VENCIMENTO', 'VALOR']],
        body: proximosRecebimentos.map(p => [
          p.clientName,
          formatDueDateBR(p.dueDate),
          `R$ ${Number(p.finalAmount).toFixed(2)}`
        ]),
        headStyles: { fillColor: [194, 24, 91] }
      });
    }

    doc.save(`Relatorio_Financeiro_Completo_${fromStr.replace(/\//g, '-')}.pdf`);
  };

  const getBrandBadgeColor = (brand: string) => {
    if (brand === "VERDE (N)") return "bg-green-600 text-white";
    if (brand === "ROSA (A)") return "bg-primary text-white";
    if (brand === "MARROM (C&E)") return "bg-amber-900 text-white";
    return "bg-muted text-muted-foreground";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
        <Loader2 className="size-14 animate-spin text-primary" />
        <p className="text-xl font-medium animate-pulse text-center px-2">Sincronizando finanças...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 w-full overflow-x-hidden pb-20">
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <Wallet className="size-16 sm:size-24 text-primary" />
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap px-2">FINANCEIRO</h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">Controle real de entradas e contas a receber.</p>
          
          {cycleData?.name && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary font-black uppercase tracking-widest px-4 py-1 gap-2 rounded-xl">
                <RefreshCw className="size-3" />
                {cycleData.name}
              </Badge>
            </div>
          )}
        </div>
        
        <div className="w-full sm:w-auto flex flex-col gap-6 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full sm:min-w-[500px] h-16 sm:h-24 text-lg sm:text-3xl font-black justify-between text-left rounded-[1.5rem] sm:rounded-[2.5rem] border-4 border-muted hover:border-primary/40 bg-background shadow-2xl transition-all active:scale-95 px-8 group"
                )}
              >
                <div className="flex items-center">
                  <CalendarIcon className="mr-4 h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                  {date?.from && date?.to ? (
                    <span className="tracking-tighter">
                      {format(date.from, "dd/MM/yyyy")} - {format(date.to, "dd/MM/yyyy")}
                    </span>
                  ) : (
                    <span>SELECIONE O PERÍODO</span>
                  )}
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black ml-4 hidden sm:flex">PERÍODO</Badge>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full sm:w-[500px] p-8 rounded-[2rem] sm:rounded-[3.5rem] border-8 border-primary/5 shadow-2xl bg-background space-y-8" align="center" sideOffset={20}>
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 px-2">Início do Período</p>
                  <div className="grid grid-cols-3 gap-3">
                    <Select value={date?.from ? getDate(date.from).toString() : ""} onValueChange={(v) => updateDatePart('from', 'day', v)}>
                      <SelectTrigger className="h-14 font-black rounded-xl border-2"><SelectValue placeholder="Dia" /></SelectTrigger>
                      <SelectContent className="rounded-xl font-bold">{DAYS.map(d => <SelectItem key={d} value={d}>{d.padStart(2, '0')}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={date?.from ? getMonth(date.from).toString() : ""} onValueChange={(v) => updateDatePart('from', 'month', v)}>
                      <SelectTrigger className="h-14 font-black rounded-xl border-2"><SelectValue placeholder="Mês" /></SelectTrigger>
                      <SelectContent className="rounded-xl font-bold">{MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={date?.from ? getYear(date.from).toString() : ""} onValueChange={(v) => updateDatePart('from', 'year', v)}>
                      <SelectTrigger className="h-14 font-black rounded-xl border-2"><SelectValue placeholder="Ano" /></SelectTrigger>
                      <SelectContent className="rounded-xl font-bold">{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 px-2">Fim do Período</p>
                  <div className="grid grid-cols-3 gap-3">
                    <Select value={date?.to ? getDate(date.to).toString() : ""} onValueChange={(v) => updateDatePart('to', 'day', v)}>
                      <SelectTrigger className="h-14 font-black rounded-xl border-2"><SelectValue placeholder="Dia" /></SelectTrigger>
                      <SelectContent className="rounded-xl font-bold">{DAYS.map(d => <SelectItem key={d} value={d}>{d.padStart(2, '0')}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={date?.to ? getMonth(date.to).toString() : ""} onValueChange={(v) => updateDatePart('to', 'month', v)}>
                      <SelectTrigger className="h-14 font-black rounded-xl border-2"><SelectValue placeholder="Mês" /></SelectTrigger>
                      <SelectContent className="rounded-xl font-bold">{MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={date?.to ? getYear(date.to).toString() : ""} onValueChange={(v) => updateDatePart('to', 'year', v)}>
                      <SelectTrigger className="h-14 font-black rounded-xl border-2"><SelectValue placeholder="Ano" /></SelectTrigger>
                      <SelectContent className="rounded-xl font-bold">{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-primary shadow-xl">Aplicar Período</Button>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="w-full sm:w-[400px] h-14 sm:h-16 text-sm sm:text-xl font-black rounded-2xl bg-accent hover:bg-accent/90 shadow-xl transition-all active:scale-95 uppercase tracking-widest gap-3">
                <FileDown className="size-6" />
                EXPORTAR RELATÓRIO
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[300px] sm:w-[400px] p-4 rounded-2xl border-4 border-accent/10 shadow-2xl bg-background" align="center">
              <DropdownMenuItem onClick={handleShareText} className="h-16 rounded-xl font-black text-lg gap-4 cursor-pointer focus:bg-accent/5 focus:text-accent">
                <Share2 className="size-6 text-accent" /> COMPARTILHAR TEXTO (WA)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleGeneratePDF} className="h-16 rounded-xl font-black text-lg gap-4 cursor-pointer focus:bg-primary/5 focus:text-primary">
                <FileText className="size-6 text-primary" /> BAIXAR RELATÓRIO PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((item, i) => (
          <Card key={i} className="border-none shadow-lg overflow-hidden rounded-[2rem] group">
            <div className={`h-3 w-full ${item.stripe} opacity-80 group-hover:opacity-100 transition-opacity`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-8 pt-8">
              <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-2">{item.title}</CardTitle>
              <div className={`${item.bg} ${item.color} p-4 rounded-2xl shadow-inner`}><item.icon className="h-7 w-7" /></div>
            </CardHeader>
            <CardContent className="px-8 pb-10">
              <div className="text-4xl sm:text-5xl font-black text-foreground px-2 tracking-tighter italic">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-background/50 backdrop-blur-sm border-2 border-primary/5">
          <CardHeader className="bg-primary/10 pb-8 p-8 border-b-2 border-primary/10">
            <CardTitle className="text-2xl font-black px-2 uppercase tracking-tight italic flex items-center gap-3 text-primary">
              <Package className="text-primary" /> TOP 20 PRODUTOS
            </CardTitle>
            <CardDescription className="font-bold opacity-70 px-2 uppercase text-[10px] tracking-widest">Os campeões de vendas do período</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-8">
            {isRankingsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                <Loader2 className="size-10 animate-spin text-primary" />
                <p className="font-black uppercase tracking-tighter">Analisando faturamento...</p>
              </div>
            ) : topProducts.length > 0 ? (
              topProducts.map((p, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 rounded-[1.5rem] border-4 border-muted bg-background hover:border-primary/20 transition-all group gap-4 relative overflow-hidden">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="size-8 sm:size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                      {i + 1}º
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-lg sm:text-xl px-1 uppercase italic text-primary truncate leading-tight">{p.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge className={cn("text-[8px] font-black px-2 py-0.5 rounded-md", getBrandBadgeColor(p.brand))}>
                          {p.brand}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                          {p.quantity} unid. vendidas
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl sm:text-2xl font-black text-green-600 px-1 italic">R$ {p.total.toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-muted/10 rounded-[2rem] border-4 border-dashed border-muted">
                <Package className="size-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground text-sm font-black uppercase tracking-tighter opacity-40 italic">Nenhuma venda detalhada no período.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-background/50 backdrop-blur-sm border-2 border-accent/5">
          <CardHeader className="bg-accent/10 pb-8 p-8 border-b-2 border-accent/10">
            <CardTitle className="text-2xl font-black px-2 uppercase tracking-tight italic flex items-center gap-3 text-accent">
              <Users className="text-accent" /> TOP 20 CLIENTES
            </CardTitle>
            <CardDescription className="font-bold opacity-70 px-2 uppercase text-[10px] tracking-widest">Suas clientes mais fiéis no período</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-8">
            {topClients.length > 0 ? (
              topClients.map((c, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-[2rem] border-4 border-muted bg-background hover:border-accent/20 transition-all group gap-4">
                  <div className="flex items-center gap-5 w-full sm:w-auto">
                    <div className="size-8 sm:size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                      {i + 1}º
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-lg sm:text-xl px-1 uppercase italic text-accent truncate leading-tight">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 px-1">
                        Compradora Diamante • {c.count} pedidos
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl sm:text-2xl font-black text-green-600 px-1 italic">R$ {c.total.toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-muted/10 rounded-[2rem] border-4 border-dashed border-muted">
                <Users className="size-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground text-sm font-black uppercase tracking-tighter opacity-40 italic">Sem histórico de clientes no período.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-background/50 backdrop-blur-sm">
          <CardHeader className="bg-muted/80 pb-8 p-8 border-b-2">
            <CardTitle className="text-2xl font-black px-2 uppercase tracking-tight italic flex items-center gap-3">
              <Clock className="text-orange-500" /> Pagamentos para Receber
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-8">
            {proximosRecebimentos.map((p, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 rounded-[1.5rem] border-4 border-muted bg-background shadow-sm hover:shadow-xl hover:border-primary/10 transition-all group gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-black text-lg sm:text-xl px-1 uppercase italic text-primary truncate">{p.clientName}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-black flex items-center gap-2 mt-1 uppercase tracking-widest">
                    <CalendarIcon className="size-3" /> Vence em: {formatDueDateBR(p.dueDate)}
                  </p>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-0 shrink-0 border-t sm:border-t-0 pt-2 w-full sm:w-auto">
                  <p className="text-xl sm:text-2xl font-black text-green-600 px-1 italic">R$ {Number(p.finalAmount).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-background/50 backdrop-blur-sm">
          <CardHeader className="bg-green-100 pb-8 p-8 border-b-2 border-green-100">
            <CardTitle className="text-2xl font-black px-2 uppercase tracking-tight italic flex items-center gap-3 text-green-700">
              <ArrowDownCircle className="text-green-600" /> Entradas Confirmadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-8">
            {entradasConfirmadas.map((p, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 rounded-[1.5rem] bg-green-50/40 border-4 border-green-100 shadow-sm hover:shadow-xl hover:bg-green-100/50 transition-all group gap-4">
                <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                  <div className="size-10 sm:size-16 rounded-[1.2rem] bg-green-100 flex items-center justify-center text-green-700 shadow-inner shrink-0"><ArrowDownCircle className="size-5 sm:size-8" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-lg sm:text-xl px-1 uppercase italic text-green-800 truncate">{p.clientName}</p>
                    <p className="text-[10px] sm:text-xs text-green-600/60 font-black flex items-center gap-2 mt-1 uppercase tracking-widest"><CalendarIcon className="size-3" /> {formatDateBR(p.orderDate)}</p>
                  </div>
                </div>
                <div className="sm:text-right text-left shrink-0 border-t sm:border-t-0 pt-2 w-full sm:w-auto">
                  <p className="text-xl sm:text-3xl font-black text-green-700 px-1 italic tracking-tighter">+ R$ {Number(p.finalAmount).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
