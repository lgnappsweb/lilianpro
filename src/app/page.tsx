
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
  PlusCircle,
  Loader2,
  LayoutDashboard,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Calendar,
  Smartphone,
  Banknote,
  CreditCard,
  HandCoins,
  FileText,
  AlertCircle,
  ReceiptText,
  RefreshCw,
  Trash2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useDoc, 
  setDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from "@/firebase";
import { collection, doc, getDocs } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval, 
  setDate, 
  setMonth, 
  setYear, 
  getDate, 
  getMonth, 
  getYear 
} from "date-fns";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { DateRange } from "react-day-picker";

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

export default function DashboardPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [cycleName, setCycleName] = useState("");
  const [cycleDate, setCycleDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Busca configurações do ciclo
  const cycleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid, "config", "cycle");
  }, [db, user]);
  const { data: cycleData } = useDoc(cycleRef);

  useEffect(() => {
    if (cycleData) {
      setCycleName(cycleData.name || "");
      if (cycleData.from && cycleData.to) {
        setCycleDate({
          from: new Date(cycleData.from),
          to: new Date(cycleData.to)
        });
      }
    }
  }, [cycleData]);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "orders");
  }, [db, user]);
  const { data: ordersData, isLoading: ordersLoading } = useCollection(ordersQuery);

  const clientsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "clients");
  }, [db, user]);
  const { data: clients, isLoading: clientsLoading } = useCollection(clientsQuery);

  // Filtra ordens pelo ciclo e ativos
  const filteredOrders = useMemo(() => {
    if (!ordersData) return [];
    let result = ordersData.filter(o => !o.isDeleted);
    
    if (cycleDate?.from && cycleDate?.to) {
      result = result.filter(order => {
        const orderDate = new Date(order.orderDate);
        return isWithinInterval(orderDate, { 
          start: cycleDate.from!, 
          end: cycleDate.to! 
        });
      });
    }
    return result;
  }, [ordersData, cycleDate]);

  const stats = useMemo(() => {
    const totalVendido = filteredOrders?.reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0) || 0;
    const totalRecebido = filteredOrders?.filter(o => o.paymentStatus === "Pago").reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0) || 0;
    const totalPendente = filteredOrders?.filter(o => o.paymentStatus !== "Pago").reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0) || 0;

    return [
      {
        title: "Vendido no Ciclo",
        value: `R$ ${totalVendido.toFixed(2)}`,
        description: "Faturamento do período",
        icon: TrendingUp,
        color: "text-primary",
        bg: "bg-primary/10",
        href: "/pedidos",
      },
      {
        title: "Recebido no Ciclo",
        value: `R$ ${totalRecebido.toFixed(2)}`,
        description: "Dinheiro em caixa",
        icon: Wallet,
        color: "text-green-600",
        bg: "bg-green-100",
        href: "/financeiro",
      },
      {
        title: "Pendente no Ciclo",
        value: `R$ ${totalPendente.toFixed(2)}`,
        description: "Contas a receber",
        icon: Clock,
        color: "text-orange-600",
        bg: "bg-orange-100",
        href: "/financeiro",
      },
      {
        title: "Total Clientes",
        value: (clients?.length || 0).toString(),
        description: "Contatos ativos",
        icon: Users,
        color: "text-accent",
        bg: "bg-accent/10",
        href: "/clientes",
      },
    ];
  }, [filteredOrders, clients]);

  const healthStatus = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) return null;

    const counts = {
      pago: filteredOrders.filter(o => o.paymentStatus === "Pago").length,
      pendente: filteredOrders.filter(o => o.paymentStatus === "Pendente").length,
      atrasado: filteredOrders.filter(o => o.paymentStatus === "Atrasado").length,
    };

    let theme = {
      bg: "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-500/30",
      iconColor: "text-green-600",
      title: "TUDO EM DIA",
      desc: "Excelente! Todas as suas vendas do ciclo estão liquidadas.",
      icon: CheckCircle2,
    };

    if (counts.atrasado > 0) {
      theme = {
        bg: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-green-500/30",
        iconColor: "text-red-600",
        title: "ALERTA DE ATRASOS",
        desc: "Atenção! Existem pagamentos vencidos no ciclo.",
        icon: AlertTriangle,
      };
    } else if (counts.pendente > 0) {
      theme = {
        bg: "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-green-500/30",
        iconColor: "text-orange-600",
        title: "PAGAMENTOS PENDENTES",
        desc: "Você tem valores a receber dentro do prazo do ciclo.",
        icon: Clock,
      };
    }

    return { counts, ...theme };
  }, [filteredOrders]);

  const recentOrders = useMemo(() => {
    if (!filteredOrders) return [];
    return [...filteredOrders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()).slice(0, 5);
  }, [filteredOrders]);

  const handleUpdateCycleName = (name: string) => {
    setCycleName(name);
    if (user && db) {
      setDocumentNonBlocking(doc(db, "users", user.uid, "config", "cycle"), { name }, { merge: true });
    }
  };

  const updateCycleDatePart = (type: 'from' | 'to', part: 'day' | 'month' | 'year', value: string) => {
    if (!cycleDate) return;
    const current = cycleDate[type] || new Date();
    let newDate = new Date(current);

    if (part === 'day') newDate = setDate(newDate, parseInt(value));
    if (part === 'month') newDate = setMonth(newDate, parseInt(value));
    if (part === 'year') newDate = setYear(newDate, parseInt(value));

    const updatedDate = { ...cycleDate, [type]: newDate };
    setCycleDate(updatedDate);
    
    if (user && db && updatedDate.from && updatedDate.to) {
      setDocumentNonBlocking(doc(db, "users", user.uid, "config", "cycle"), {
        from: updatedDate.from.toISOString(),
        to: updatedDate.to.toISOString()
      }, { merge: true });
    }
  };

  const handleResetCycle = async () => {
    if (!user || !db) return;
    setIsResetting(true);
    try {
      const ordersRef = collection(db, "users", user.uid, "orders");
      const snapshot = await getDocs(ordersRef);
      
      for (const orderDoc of snapshot.docs) {
        const itemsRef = collection(db, "users", user.uid, "orders", orderDoc.id, "orderItems");
        const itemsSnap = await getDocs(itemsRef);
        itemsSnap.forEach(itemDoc => {
          deleteDocumentNonBlocking(doc(db, "users", user.uid, "orders", orderDoc.id, "orderItems", itemDoc.id));
        });
        deleteDocumentNonBlocking(doc(db, "users", user.uid, "orders", orderDoc.id));
      }

      setDocumentNonBlocking(doc(db, "users", user.uid, "config", "cycle"), {
        name: "",
        from: null,
        to: null
      }, { merge: true });

      setCycleName("");
      setCycleDate({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });

      toast({
        title: "Ciclo Reiniciado",
        description: "Todos os pedidos foram apagados. Clientes mantidos.",
      });
      setShowResetConfirm(false);
    } catch (error) {
      console.error("Error resetting cycle:", error);
      toast({
        variant: "destructive",
        title: "Erro ao reiniciar",
        description: "Ocorreu um problema ao apagar os dados.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pago": return <CheckCircle2 className="size-3" />;
      case "Pendente": return <Clock className="size-3" />;
      case "Atrasado": return <AlertCircle className="size-3" />;
      default: return null;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Pago": return "bg-green-600 text-white";
      case "Pendente": return "bg-orange-500 text-white";
      case "Atrasado": return "bg-red-600 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case "pix": return <Smartphone className="size-4" />;
      case "dinheiro": return <Banknote className="size-4" />;
      case "cartao": return <CreditCard className="size-4" />;
      case "a prazo": return <HandCoins className="size-4" />;
      default: return <CreditCard className="size-4" />;
    }
  };

  if (ordersLoading || clientsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">Sincronizando dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 w-full overflow-hidden">
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <LayoutDashboard className="size-16 sm:size-24 text-primary" />
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap px-2">Olá, LILIAN</h1>
          </div>
          <p className="text-base sm:text-xl text-muted-foreground mt-4 font-bold opacity-80 uppercase tracking-widest">Veja como está o seu negócio hoje.</p>
        </div>

        {/* GESTÃO DE CICLO */}
        <Card className="w-full border-4 border-primary/20 shadow-xl rounded-[2.5rem] overflow-hidden bg-background mb-4">
          <CardHeader className="bg-primary/5 p-6 border-b-2 border-primary/10">
            <CardTitle className="text-xl font-black flex items-center justify-center gap-3 uppercase italic text-primary">
              <RefreshCw className="size-6" /> GESTÃO DE CICLO ATUAL
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid sm:grid-cols-2 gap-6 text-left">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Nome do Ciclo</Label>
                <Input 
                  placeholder="Ex: Ciclo 05/2024"
                  className="h-14 sm:h-16 text-lg font-black rounded-2xl border-4 border-muted focus:border-primary px-4"
                  value={cycleName}
                  onChange={(e) => handleUpdateCycleName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Período do Ciclo</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-14 sm:h-16 text-sm font-black rounded-2xl border-4 border-muted justify-between px-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="size-4 text-primary" />
                        {cycleDate?.from && cycleDate?.to ? (
                          <span>{format(cycleDate.from, "dd/MM/yyyy")} - {format(cycleDate.to, "dd/MM/yyyy")}</span>
                        ) : "Selecionar Datas"}
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] sm:w-[450px] p-6 rounded-[2rem] border-4 shadow-2xl space-y-6" align="center">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 px-2">Início do Ciclo</p>
                        <div className="grid grid-cols-3 gap-3">
                          <Select value={cycleDate?.from ? getDate(cycleDate.from).toString() : ""} onValueChange={(v) => updateCycleDatePart('from', 'day', v)}>
                            <SelectTrigger className="h-14 font-black rounded-xl border-2"><SelectValue placeholder="Dia" /></SelectTrigger>
                            <SelectContent className="rounded-xl font-bold">{DAYS.map(d => <SelectItem key={d} value={d}>{d.padStart(2, '0')}</SelectItem>)}</SelectContent>
                          </Select>
                          <Select value={cycleDate?.from ? getMonth(cycleDate.from).toString() : ""} onValueChange={(v) => updateCycleDatePart('from', 'month', v)}>
                            <SelectTrigger className="h-14 font-black rounded-xl border-2"><SelectValue placeholder="Mês" /></SelectTrigger>
                            <SelectContent className="rounded-xl font-bold">{MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                          </Select>
                          <Select value={cycleDate?.from ? getYear(cycleDate.from).toString() : ""} onValueChange={(v) => updateCycleDatePart('from', 'year', v)}>
                            <SelectTrigger className="h-14 font-black rounded-xl border-2"><SelectValue placeholder="Ano" /></SelectTrigger>
                            <SelectContent className="rounded-xl font-bold">{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 px-2">Fim do Ciclo</p>
                        <div className="grid grid-cols-3 gap-3">
                          <Select value={cycleDate?.to ? getDate(cycleDate.to).toString() : ""} onValueChange={(v) => updateCycleDatePart('to', 'day', v)}>
                            <SelectTrigger className="h-14 font-black rounded-xl border-2"><SelectValue placeholder="Dia" /></SelectTrigger>
                            <SelectContent className="rounded-xl font-bold">{DAYS.map(d => <SelectItem key={d} value={d}>{d.padStart(2, '0')}</SelectItem>)}</SelectContent>
                          </Select>
                          <Select value={cycleDate?.to ? getMonth(cycleDate.to).toString() : ""} onValueChange={(v) => updateCycleDatePart('to', 'month', v)}>
                            <SelectTrigger className="h-14 font-black rounded-xl border-2"><SelectValue placeholder="Mês" /></SelectTrigger>
                            <SelectContent className="rounded-xl font-bold">{MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                          </Select>
                          <Select value={cycleDate?.to ? getYear(cycleDate.to).toString() : ""} onValueChange={(v) => updateCycleDatePart('to', 'year', v)}>
                            <SelectTrigger className="h-14 font-black rounded-xl border-2"><SelectValue placeholder="Ano" /></SelectTrigger>
                            <SelectContent className="rounded-xl font-bold">{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-primary shadow-xl">Confirmar Datas</Button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              onClick={() => setShowResetConfirm(true)}
              className="w-full h-12 text-destructive font-black uppercase tracking-widest gap-2 hover:bg-destructive/5 rounded-xl border-2 border-destructive/10 transition-all active:scale-95"
            >
              <Trash2 className="size-4" /> ENCERRAR E APAGAR PEDIDOS DO CICLO
            </Button>
          </CardContent>
        </Card>

        <Button asChild className="w-full h-16 sm:h-20 px-10 text-xl font-black shadow-xl rounded-2xl bg-primary hover:bg-primary/90 transition-all hover:scale-105">
          <Link href="/vendas/nova">
            <PlusCircle className="mr-3 size-7 sm:size-8" />
            Nova Venda
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1">
        {stats.map((stat, i) => (
          <Link href={stat.href} key={i} className="block group">
            <Card className="border-4 border-muted shadow-lg hover:shadow-2xl transition-all rounded-[2.5rem] overflow-hidden group-hover:scale-[1.01] active:scale-[0.99] hover:border-primary/40">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-8 pt-8">
                <CardTitle className="text-base font-black text-muted-foreground uppercase tracking-widest px-2">{stat.title}</CardTitle>
                <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl group-hover:scale-110 transition-transform shadow-inner`}>
                  <stat.icon className="h-8 w-8" />
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-10">
                <div className="text-4xl md:text-6xl font-black truncate text-primary tracking-tighter px-2">{stat.value}</div>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm font-black text-muted-foreground uppercase tracking-widest opacity-60">{stat.description}</p>
                  <ChevronRight className="size-8 text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* MONITOR DE SAÚDE FINANCEIRA DINÂMICO */}
      {healthStatus && (
        <Card className={cn("border-4 shadow-2xl rounded-[2.5rem] overflow-hidden transition-all duration-700", healthStatus.bg)}>
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-2xl bg-white dark:bg-white/10 shadow-sm", healthStatus.iconColor)}>
                <healthStatus.icon className="size-8" />
              </div>
              <div>
                <CardTitle className={cn("text-2xl font-black uppercase tracking-tighter italic", healthStatus.iconColor)}>
                  {healthStatus.title}
                </CardTitle>
                <CardDescription className="font-bold opacity-70">Monitoramento automático de cobranças</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
              <div className="bg-white/60 dark:bg-white/5 p-2 sm:p-4 rounded-2xl text-center shadow-inner border border-white/20 min-w-0">
                <p className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-tighter sm:tracking-widest mb-1 truncate">Pagos</p>
                <p className="text-2xl sm:text-3xl font-black text-green-600">{healthStatus.counts.pago}</p>
              </div>
              <div className="bg-white/60 dark:bg-white/5 p-2 sm:p-4 rounded-2xl text-center shadow-inner border border-white/20 min-w-0">
                <p className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-tighter sm:tracking-widest mb-1 truncate">A Prazo</p>
                <p className="text-2xl sm:text-3xl font-black text-orange-500">{healthStatus.counts.pendente}</p>
              </div>
              <div className="bg-white/60 dark:bg-white/5 p-2 sm:p-4 rounded-2xl text-center shadow-inner border border-white/20 min-w-0">
                <p className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-tighter sm:tracking-widest mb-1 truncate">Atrasados</p>
                <p className="text-2xl sm:text-3xl font-black text-red-600">{healthStatus.counts.atrasado}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/40 dark:bg-white/5 rounded-2xl border border-white/20">
              <Activity className={cn("size-5 shrink-0", healthStatus.iconColor)} />
              <p className="text-sm font-bold leading-tight opacity-80">{healthStatus.desc}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="w-full">
        <Card className="border-4 border-muted shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-4 bg-muted/50">
            <CardTitle className="text-2xl md:text-3xl font-black flex flex-col items-center gap-3 px-2">
              <Users className="size-8 text-primary" />
              Gestão de Contatos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <Link href="/clientes" className="block group/card">
              <div className="flex items-center gap-5 p-5 rounded-[1.5rem] bg-background border-4 border-muted shadow-sm hover:border-accent/20 transition-all relative overflow-hidden">
                <div className="size-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-inner">
                  <Users className="size-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-black uppercase tracking-tight px-2 whitespace-nowrap">Clientes</p>
                  <p className="text-sm text-muted-foreground font-bold">{clients?.length || 0} contatos</p>
                </div>
                <Badge variant="secondary" className="absolute bottom-3 right-4 text-[10px] font-black px-3 py-1 bg-accent/5 text-accent border-none shadow-sm group-hover/card:bg-accent group-hover/card:text-white transition-all">Ver Lista</Badge>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="w-full space-y-8">
        <div className="flex flex-row items-center justify-between px-2">
          <h2 className="text-3xl sm:text-4xl font-black text-primary uppercase italic tracking-tighter">Vendas do Ciclo</h2>
          <Button variant="ghost" size="lg" className="text-base font-black text-primary hover:bg-primary/10 rounded-xl" asChild>
            <Link href="/pedidos">Ver Histórico</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {recentOrders.map((order) => (
            <Card 
              key={order.id} 
              className="bg-background border-4 border-muted rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 shadow-xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:-translate-y-2 hover:border-primary/40 transition-all duration-500 flex flex-col justify-between w-full relative overflow-hidden group transform-gpu"
            >
              <div className="flex items-center justify-between w-full mb-4">
                <Badge variant="outline" className="font-mono text-[10px] sm:text-xs font-black text-primary/60 bg-primary/5 border-2 border-primary/10 rounded-lg px-3 py-1">
                  #{order.id?.slice(-6)}
                </Badge>
                <div className="flex items-center gap-2 text-muted-foreground font-black text-[10px] sm:text-xs uppercase tracking-widest opacity-60">
                  <Calendar className="size-3" />
                  {new Date(order.orderDate).toLocaleDateString()}
                </div>
              </div>

              <div className="flex flex-col gap-1 mb-4 text-left">
                <h3 className="font-black text-2xl sm:text-4xl text-primary uppercase tracking-tighter italic leading-none px-1 line-clamp-1 drop-shadow-md">
                  {order.clientName}
                </h3>
                <div className="flex items-center gap-2 mt-2 px-1">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-primary/60 shadow-inner">
                    {getPaymentIcon(order.paymentMethod)}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-black uppercase tracking-[0.2em]">
                    PAGO VIA {order.paymentMethod?.toUpperCase()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between w-full mb-6 px-1">
                <div className="flex flex-col">
                  <p className="text-2xl sm:text-4xl font-black text-green-600 tracking-tighter leading-none italic">
                    R$ {Number(order.finalAmount).toFixed(2)}
                  </p>
                  <p className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40 mt-1">
                    Total do Pedido
                  </p>
                </div>

                <Badge className={`flex items-center gap-1 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest border-none shadow-md ${getStatusClass(order.paymentStatus)}`}>
                  {getStatusIcon(order.paymentStatus)}
                  {order.paymentStatus?.toUpperCase()}
                </Badge>
              </div>

              <div className="flex flex-row items-center justify-center gap-2 w-full pt-4 border-t-2 border-muted/30">
                <Button variant="outline" asChild className="h-10 sm:h-12 font-black text-[9px] sm:text-[10px] uppercase tracking-widest rounded-xl border-2 hover:bg-primary/5 px-2 flex-1 shadow-sm transition-all active:scale-95">
                  <Link href={`/pedidos/${order.id}`}>
                    <FileText className="mr-1 size-3" />
                    Detalhes
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
          {recentOrders.length === 0 && (
            <div className="text-center py-20 bg-muted/10 rounded-[2.5rem] border-4 border-dashed border-muted w-full">
              <ReceiptText className="size-24 text-muted-foreground/20 mx-auto mb-6" />
              <h3 className="font-black text-3xl text-muted-foreground uppercase tracking-tighter">Sem vendas no ciclo</h3>
              <p className="text-xl text-muted-foreground mt-4 font-bold italic opacity-60 px-4">Cadastre sua primeira venda para começar o faturamento deste ciclo.</p>
            </div>
          )}
        </div>
      </div>

      {/* Alerta de Confirmação para Reiniciar Ciclo */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent className="rounded-[2.5rem] p-8 sm:p-12 border-8 shadow-2xl max-w-2xl mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl sm:text-5xl font-black tracking-tighter text-destructive uppercase leading-none text-left px-2">Encerrar Ciclo Atual?</AlertDialogTitle>
            <AlertDialogDescription className="text-xl sm:text-2xl font-bold mt-6 leading-relaxed text-muted-foreground text-left">
              <span className="text-destructive font-black">ATENÇÃO:</span> Esta ação apagará permanentemente <strong className="text-foreground border-b-4 border-primary px-1">TODOS OS PEDIDOS</strong> e registros financeiros salvos. <br /><br />
              Os <span className="text-primary font-black uppercase">DADOS DOS CLIENTES</span> continuarão salvos normalmente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4 mt-12 flex-col sm:flex-row">
            <AlertDialogCancel className="h-16 sm:h-24 px-10 text-xl font-black rounded-2xl sm:rounded-3xl border-4 border-muted hover:bg-muted/50">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleResetCycle} 
              disabled={isResetting}
              className="h-16 sm:h-24 px-10 text-xl font-black bg-destructive text-white hover:bg-destructive/90 rounded-2xl sm:rounded-3xl shadow-xl active:scale-95 transition-all"
            >
              {isResetting ? "APAGANDO..." : "SIM, LIMPAR TUDO"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
