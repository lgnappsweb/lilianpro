
"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  Users,
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
  ReceiptText,
  RefreshCw,
  Trash2,
  Calendar as CalendarIcon,
  Plus,
  Check,
  Edit,
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
import { collection, doc, getDocs, query, where } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
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

  // Estados para Gerenciamento de Ciclos
  const [newCycleName, setNewCycleName] = useState("");
  const [newCycleDate, setNewCycleDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [isNewCyclePopoverOpen, setIsNewCyclePopoverOpen] = useState(false);
  const [cycleToDelete, setCycleToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Busca Configurações (Ciclo Ativo)
  const settingsRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid, "config", "settings");
  }, [db, user]);
  const { data: settings } = useDoc(settingsRef);
  const activeCycleId = settings?.activeCycleId;

  // Busca Todos os Ciclos
  const cyclesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "cycles");
  }, [db, user]);
  const { data: cycles, isLoading: cyclesLoading } = useCollection(cyclesQuery);

  // Busca Clientes (para o contador)
  const clientsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "clients");
  }, [db, user]);
  const { data: clients, isLoading: clientsLoading } = useCollection(clientsQuery);

  // Busca Pedidos do Ciclo Ativo (em ordem alfabética)
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user || !activeCycleId) return null;
    return query(
      collection(db, "users", user.uid, "orders"),
      where("cycleId", "==", activeCycleId),
      where("isDeleted", "==", false)
    );
  }, [db, user, activeCycleId]);
  const { data: filteredOrdersRaw, isLoading: ordersLoading } = useCollection(ordersQuery);

  const filteredOrders = useMemo(() => {
    if (!filteredOrdersRaw) return [];
    return [...filteredOrdersRaw].sort((a, b) => (a.clientName || "").localeCompare(b.clientName || ""));
  }, [filteredOrdersRaw]);

  const activeCycle = useMemo(() => {
    if (!cycles || !activeCycleId) return null;
    return cycles.find(c => c.id === activeCycleId);
  }, [cycles, activeCycleId]);

  const stats = useMemo(() => {
    const totalVendido = filteredOrders?.reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0) || 0;
    const totalRecebido = filteredOrders?.filter(o => o.paymentStatus === "Pago").reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0) || 0;
    const totalPendente = filteredOrders?.filter(o => o.paymentStatus !== "Pago").reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0) || 0;

    return [
      {
        title: "Vendido no Ciclo",
        value: `R$ ${totalVendido.toFixed(2)}`,
        description: activeCycle ? activeCycle.name : "Nenhum ciclo selecionado",
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
  }, [filteredOrders, clients, activeCycle]);

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
      desc: "Excelente! Todas as suas vendas deste ciclo estão liquidadas.",
      icon: CheckCircle2,
    };

    if (counts.atrasado > 0) {
      theme = {
        bg: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-green-500/30",
        iconColor: "text-red-600",
        title: "ALERTA DE ATRASOS",
        desc: "Atenção! Existem pagamentos vencidos neste ciclo.",
        icon: AlertTriangle,
      };
    } else if (counts.pendente > 0) {
      theme = {
        bg: "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-green-500/30",
        iconColor: "text-orange-600",
        title: "PAGAMENTOS PENDENTES",
        desc: "Você tem valores a receber dentro do prazo deste ciclo.",
        icon: Clock,
      };
    }

    return { counts, ...theme };
  }, [filteredOrders]);

  const recentOrders = useMemo(() => {
    if (!filteredOrders) return [];
    return [...filteredOrders].slice(0, 10);
  }, [filteredOrders]);

  const sortedCycles = useMemo(() => {
    if (!cycles) return [];
    return [...cycles].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [cycles]);

  // Ações de Ciclo
  const handleCreateCycle = () => {
    if (!user || !db || !newCycleName) {
      toast({ variant: "destructive", title: "Erro", description: "Informe o nome do ciclo." });
      return;
    }

    const cycleId = `cyc-${Date.now()}`;
    const cycleData = {
      id: cycleId,
      name: newCycleName,
      from: newCycleDate?.from?.toISOString() || null,
      to: newCycleDate?.to?.toISOString() || null,
      adminId: user.uid,
    };

    setDocumentNonBlocking(doc(db, "users", user.uid, "cycles", cycleId), cycleData, { merge: true });
    
    // Auto-selecionar o novo ciclo
    setDocumentNonBlocking(settingsRef!, { activeCycleId: cycleId }, { merge: true });

    toast({ title: "Ciclo criado!", description: `${newCycleName} agora está ativo.` });
    setNewCycleName("");
    setIsNewCyclePopoverOpen(false);
  };

  const handleSelectCycle = (cycleId: string) => {
    if (!user || !db || !settingsRef) return;
    setDocumentNonBlocking(settingsRef, { activeCycleId: cycleId }, { merge: true });
    toast({ title: "Ciclo alterado!", description: "Dados atualizados." });
  };

  const handleDeleteCycle = async () => {
    if (!user || !db || !cycleToDelete) return;
    setIsDeleting(true);
    try {
      // 1. Apagar Itens dos Pedidos do Ciclo
      const ordersRef = collection(db, "users", user.uid, "orders");
      const q = query(ordersRef, where("cycleId", "==", cycleToDelete.id));
      const snapshot = await getDocs(q);
      
      for (const orderDoc of snapshot.docs) {
        const itemsRef = collection(db, "users", user.uid, "orders", orderDoc.id, "orderItems");
        const itemsSnap = await getDocs(itemsRef);
        itemsSnap.forEach(itemDoc => {
          deleteDocumentNonBlocking(doc(db, "users", user.uid, "orders", orderDoc.id, "orderItems", itemDoc.id));
        });
        deleteDocumentNonBlocking(doc(db, "users", user.uid, "orders", orderDoc.id));
      }

      // 2. Apagar o Ciclo
      deleteDocumentNonBlocking(doc(db, "users", user.uid, "cycles", cycleToDelete.id));

      // 3. Limpar activeCycleId se for o excluído
      if (activeCycleId === cycleToDelete.id) {
        setDocumentNonBlocking(settingsRef!, { activeCycleId: null }, { merge: true });
      }

      toast({ title: "Ciclo Removido", description: "Todos os pedidos deste ciclo foram apagados." });
      setCycleToDelete(null);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao remover ciclo." });
    } finally {
      setIsDeleting(false);
    }
  };

  const updateDatePart = (type: 'from' | 'to', part: 'day' | 'month' | 'year', value: string) => {
    if (!newCycleDate) return;
    const current = newCycleDate[type] || new Date();
    let newDate = new Date(current);
    if (part === 'day') newDate = setDate(newDate, parseInt(value));
    if (part === 'month') newDate = setMonth(newDate, parseInt(value));
    if (part === 'year') newDate = setYear(newDate, parseInt(value));
    setNewCycleDate({ ...newCycleDate, [type]: newDate });
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

  if (cyclesLoading || clientsLoading || ordersLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">Sincronizando gestão...</p>
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

        {/* NOVA GESTÃO DE CICLOS (MULTI-CICLOS) */}
        <Card className="w-full border-4 border-primary/20 shadow-xl rounded-[2.5rem] overflow-hidden bg-background mb-4">
          <CardHeader className="bg-primary/5 p-4 sm:p-6 border-b-2 border-primary/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-base sm:text-xl font-black flex items-center gap-2 sm:gap-3 uppercase italic text-primary whitespace-nowrap">
                <RefreshCw className="size-4 sm:size-6" /> GESTÃO DE CICLOS
              </CardTitle>
              <Popover open={isNewCyclePopoverOpen} onOpenChange={setIsNewCyclePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button size="sm" className="w-full sm:w-auto h-12 sm:h-10 rounded-full bg-primary font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg">
                    <Plus className="size-3" /> NOVO CICLO
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] sm:w-[400px] p-6 rounded-[2rem] border-4 shadow-2xl space-y-6" align="end">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Nome do Período</Label>
                      <Input placeholder="Ex: Ciclo 05/2024" className="font-black h-12 rounded-xl" value={newCycleName} onChange={(e) => setNewCycleName(e.target.value)} />
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 px-2">Início</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Select value={newCycleDate?.from ? getDate(newCycleDate.from).toString() : ""} onValueChange={(v) => updateDatePart('from', 'day', v)}>
                          <SelectTrigger className="h-10 font-bold rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={newCycleDate?.from ? getMonth(newCycleDate.from).toString() : ""} onValueChange={(v) => updateDatePart('from', 'month', v)}>
                          <SelectTrigger className="h-10 font-bold rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>{MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={newCycleDate?.from ? getYear(newCycleDate.from).toString() : ""} onValueChange={(v) => updateDatePart('from', 'year', v)}>
                          <SelectTrigger className="h-10 font-bold rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 px-2">Fim</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Select value={newCycleDate?.to ? getDate(newCycleDate.to).toString() : ""} onValueChange={(v) => updateDatePart('to', 'day', v)}>
                          <SelectTrigger className="h-10 font-bold rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={newCycleDate?.to ? getMonth(newCycleDate.to).toString() : ""} onValueChange={(v) => updateDatePart('to', 'month', v)}>
                          <SelectTrigger className="h-10 font-bold rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>{MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={newCycleDate?.to ? getYear(newCycleDate.to).toString() : ""} onValueChange={(v) => updateDatePart('to', 'year', v)}>
                          <SelectTrigger className="h-10 font-bold rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleCreateCycle} className="w-full h-14 rounded-xl font-black uppercase bg-primary">ATIVAR CICLO</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {sortedCycles.map((cycle) => (
                <div key={cycle.id} className={cn(
                  "p-4 rounded-2xl border-4 flex flex-row items-center justify-between group transition-all",
                  activeCycleId === cycle.id ? "bg-primary/5 border-primary shadow-inner" : "bg-background border-muted hover:border-primary/20"
                )}>
                  <div className="flex items-center gap-4 flex-1 min-w-0" onClick={() => handleSelectCycle(cycle.id)}>
                    <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0", activeCycleId === cycle.id ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                      {activeCycleId === cycle.id ? <Check className="size-6" /> : <CalendarIcon className="size-5" />}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <p className={cn("font-black text-lg uppercase italic leading-tight break-words", activeCycleId === cycle.id ? "text-primary" : "text-foreground")}>{cycle.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest break-words">
                        {cycle.from ? `${format(new Date(cycle.from), "dd/MM/yy")} - ${format(new Date(cycle.to), "dd/MM/yy")}` : "Sem data definida"}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setCycleToDelete(cycle)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl shrink-0 ml-2">
                    <Trash2 className="size-5" />
                  </Button>
                </div>
              ))}
              {sortedCycles.length === 0 && (
                <div className="text-center py-10 opacity-40">
                  <p className="font-black uppercase text-xs">Nenhum ciclo cadastrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Button asChild className="w-full h-16 sm:h-20 px-10 text-xl font-black shadow-xl rounded-2xl bg-primary hover:bg-primary/90 transition-all hover:scale-105">
          <Link href="/vendas/nova">
            <PlusCircle className="mr-3 size-7 sm:size-8" />
            Nova Venda
          </Link>
        </Button>
      </div>

      {/* DASHBOARD DE MÉTRICAS */}
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
          <CardHeader className="p-4 sm:p-8 pb-4">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-2xl bg-white dark:bg-white/10 shadow-sm", healthStatus.iconColor)}>
                <healthStatus.icon className="size-6 sm:size-8" />
              </div>
              <div className="min-w-0">
                <CardTitle className={cn("text-base sm:text-2xl font-black uppercase tracking-tighter italic whitespace-nowrap", healthStatus.iconColor)}>
                  {healthStatus.title}
                </CardTitle>
                <CardDescription className="font-bold opacity-70 text-xs sm:text-sm">Monitoramento de cobranças</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-8 pt-4">
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

      {/* VENDAS DO CICLO (A a Z) */}
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

                <Badge className={cn("flex items-center gap-1 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest border-none shadow-md", 
                  order.paymentStatus === "Pago" ? "bg-green-600 text-white" : 
                  order.paymentStatus === "Atrasado" ? "bg-red-600 text-white" : "bg-orange-50 text-orange-600 border-orange-200")}>
                  {order.paymentStatus?.toUpperCase()}
                </Badge>
              </div>

              <div className="flex flex-row items-center justify-center gap-2 w-full pt-4 border-t-2 border-muted/30">
                <Button variant="outline" asChild className="h-10 sm:h-12 font-black text-[9px] sm:text-[10px] uppercase tracking-widest rounded-xl border-2 hover:bg-primary/5 px-2 flex-1 shadow-sm transition-all active:scale-95">
                  <Link href={`/pedidos/${order.id}`}>
                    <ReceiptText className="mr-1 size-3" /> Detalhes
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-10 sm:h-12 font-black text-[9px] sm:text-[10px] uppercase tracking-widest rounded-xl border-2 hover:bg-primary/5 px-2 flex-1 shadow-sm transition-all active:scale-95">
                  <Link href={`/pedidos/${order.id}/editar`}>
                    <Edit className="mr-1 size-3" /> Editar
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
          {recentOrders.length === 0 && !activeCycleId && (
            <div className="text-center py-20 bg-muted/10 rounded-[2.5rem] border-4 border-dashed border-muted w-full">
              <RefreshCw className="size-24 text-muted-foreground/20 mx-auto mb-6" />
              <h3 className="font-black text-3xl text-muted-foreground uppercase tracking-tighter">Selecione um Ciclo</h3>
              <p className="text-xl text-muted-foreground mt-4 font-bold italic opacity-60 px-4">Selecione ou crie um ciclo acima para gerenciar as vendas deste período.</p>
            </div>
          )}
          {recentOrders.length === 0 && activeCycleId && (
            <div className="text-center py-20 bg-muted/10 rounded-[2.5rem] border-4 border-dashed border-muted w-full">
              <ReceiptText className="size-24 text-muted-foreground/20 mx-auto mb-6" />
              <h3 className="font-black text-3xl text-muted-foreground uppercase tracking-tighter">Sem vendas neste ciclo</h3>
              <p className="text-xl text-muted-foreground mt-4 font-bold italic opacity-60 px-4">Cadastre sua primeira venda para o ciclo "{activeCycle?.name}".</p>
            </div>
          )}
        </div>
      </div>

      {/* Alerta de Confirmação para Remover Ciclo (Individual) */}
      <AlertDialog open={!!cycleToDelete} onOpenChange={(open) => !open && setCycleToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-8 sm:p-12 border-8 shadow-2xl max-w-2xl mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl sm:text-5xl font-black tracking-tighter text-destructive uppercase leading-none text-left px-2">Remover Ciclo Individual?</AlertDialogTitle>
            <AlertDialogDescription className="text-xl sm:text-2xl font-bold mt-6 leading-relaxed text-muted-foreground text-left">
              <span className="text-destructive font-black">ATENÇÃO:</span> Esta ação apagará permanentemente o ciclo <strong className="text-foreground border-b-4 border-primary px-1">{cycleToDelete?.name}</strong> e <span className="text-primary font-black uppercase">TODOS OS PEDIDOS</span> vinculados a ele. <br /><br />
              Os dados dos outros ciclos e clientes serão preservados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4 mt-12 flex-col sm:flex-row">
            <AlertDialogCancel className="h-16 sm:h-24 px-10 text-xl font-black rounded-2xl sm:rounded-3xl border-4 border-muted hover:bg-muted/50">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCycle} 
              disabled={isDeleting}
              className="h-16 sm:h-24 px-10 text-xl font-black bg-destructive text-white hover:bg-destructive/90 rounded-2xl sm:rounded-3xl shadow-xl active:scale-95 transition-all"
            >
              {isDeleting ? "APAGANDO..." : "SIM, REMOVER CICLO"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
