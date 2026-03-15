
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Loader2,
  ClipboardList,
  Smartphone,
  Banknote,
  CreditCard,
  HandCoins,
  Trash2,
  FileText,
  CheckCircle2,
  Edit,
  Filter,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, query, where } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
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

export default function PedidosPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [activeFilter, setActiveFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCycleId, setSelectedCycleId] = useState<string>("all");
  const [hasDefaulted, setHasDefaulted] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<any | null>(null);
  const [orderToPay, setOrderToPay] = useState<any | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // Busca Configurações para o ciclo ativo inicial
  const settingsRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid, "config", "settings");
  }, [db, user]);
  const { data: settings } = useDoc(settingsRef);

  useEffect(() => {
    if (settings?.activeCycleId && !hasDefaulted) {
      setSelectedCycleId(settings.activeCycleId);
      setHasDefaulted(true);
    }
  }, [settings?.activeCycleId, hasDefaulted]);

  // Busca Ciclos
  const cyclesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "cycles");
  }, [db, user]);
  const { data: cycles } = useCollection(cyclesQuery);

  // Busca todos os pedidos do usuário
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "orders");
  }, [db, user]);
  const { data: orders, isLoading } = useCollection(ordersQuery);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pago": return <CheckCircle className="size-3" />;
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
      case "a prazo": return <HandCoins className="size-4" />;
      default: return <CreditCard className="size-4" />;
    }
  };

  const formatDateBR = (isoString: string) => {
    if (!isoString) return "";
    const datePart = isoString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
  };

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      if (o.isDeleted) return false;

      // Filtro de Ciclo (Obrigatório)
      if (selectedCycleId !== "all" && o.cycleId !== selectedCycleId) return false;

      const searchStr = searchTerm.toLowerCase();
      const matchesSearch = 
        o.id?.toLowerCase().includes(searchStr) || 
        o.clientName?.toLowerCase().includes(searchStr);
      const matchesFilter = activeFilter === "todos" || o.paymentStatus?.toLowerCase() === activeFilter;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => {
      const nameA = a.clientName || "";
      const nameB = b.clientName || "";
      return nameA.localeCompare(nameB);
    });
  }, [orders, searchTerm, activeFilter, selectedCycleId]);

  const handleDeleteConfirm = () => {
    if (orderToDelete && user && db) {
      const docRef = doc(db, "users", user.uid, "orders", orderToDelete.id);
      updateDocumentNonBlocking(docRef, { isDeleted: true });
      toast({
        title: "Pedido removido",
        description: "O registro saiu da lista ativa, mas continua no histórico do cliente.",
      });
      setOrderToDelete(null);
    }
  };

  const handleConfirmPayment = () => {
    if (orderToPay && user && db) {
      const docRef = doc(db, "users", user.uid, "orders", orderToPay.id);
      updateDocumentNonBlocking(docRef, { 
        paymentStatus: "Pago",
        paymentDate: paymentDate 
      });
      toast({
        title: "Pagamento confirmado!",
        description: `O pedido de ${orderToPay.clientName} foi pago.`,
      });
      setOrderToPay(null);
    }
  };

  const selectedCycleName = useMemo(() => {
    if (selectedCycleId === "all") return "Todos os Ciclos";
    return cycles?.find(c => c.id === selectedCycleId)?.name || "Ciclo Selecionado";
  }, [selectedCycleId, cycles]);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 w-full overflow-x-hidden">
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <ClipboardList className="size-16 sm:size-24 text-primary" />
            <h1 className="text-5xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap px-2">PEDIDOS</h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">Gestão isolada por ciclo de vendas.</p>
        </div>
        <Button asChild className="w-full h-14 sm:h-20 px-10 text-xl font-black rounded-2xl shadow-xl bg-primary hover:bg-primary/90 transition-transform hover:scale-105">
          <Link href="/vendas/nova">Nova Venda</Link>
        </Button>
      </div>

      {/* FILTROS DE CICLO E BUSCA */}
      <div className="w-full space-y-6">
        <Card className="border-4 border-primary/20 bg-primary/5 rounded-[2rem] overflow-hidden shadow-xl">
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center gap-3 text-primary">
              <Filter className="size-5" />
              <span className="font-black uppercase tracking-widest text-xs">Exibir Pedidos do Ciclo</span>
            </div>
          </CardHeader>
          <div className="p-6 pt-0">
            <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
              <SelectTrigger className="h-16 text-lg sm:text-2xl font-black rounded-2xl border-4 border-muted bg-background">
                <SelectValue placeholder="Selecione o ciclo..." />
              </SelectTrigger>
              <SelectContent className="font-black text-lg">
                <SelectItem value="all" className="italic">TODOS OS CICLOS (GERAL)</SelectItem>
                {cycles?.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-6 sm:size-8 text-muted-foreground" />
          <Input 
            placeholder="Buscar pedido por cliente..." 
            className="pl-14 sm:pl-20 h-14 sm:h-24 text-lg sm:text-3xl bg-background rounded-xl sm:rounded-[2rem] border-4 border-muted shadow-inner font-black" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 w-full md:w-auto">
          {["todos", "pago", "pendente", "atrasado"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`capitalize h-12 sm:h-14 px-4 sm:px-8 text-xs sm:text-sm font-black rounded-xl sm:rounded-2xl transition-all border-4 ${
                activeFilter === filter 
                  ? "bg-primary text-white border-primary shadow-lg scale-105" 
                  : "bg-background text-muted-foreground border-muted hover:border-primary/20 opacity-60"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground">
          <Loader2 className="size-16 animate-spin text-primary" />
          <p className="text-2xl font-black animate-pulse uppercase tracking-widest text-center">Sincronizando faturamento...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 w-full pb-10">
          <div className="px-2">
            <h2 className="text-xl font-black text-primary uppercase italic tracking-tighter">
              {selectedCycleName} • {filteredOrders.length} vendas
            </h2>
          </div>

          {filteredOrders.map((order) => (
            <Card 
              key={order.id} 
              className="bg-background border-4 border-muted rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 shadow-xl hover:border-primary/40 transition-all flex flex-col justify-between w-full relative overflow-hidden group"
            >
              <div className="flex items-center justify-between w-full mb-4">
                <Badge variant="outline" className="font-mono text-[10px] sm:text-xs font-black text-primary/60 bg-primary/5 border-2 border-primary/10 rounded-lg px-3 py-1">
                  #{order.id?.slice(-6)}
                </Badge>
                <div className="flex items-center gap-2 text-muted-foreground font-black text-[10px] sm:text-xs uppercase tracking-widest opacity-60">
                  <Calendar className="size-3" />
                  {formatDateBR(order.orderDate)}
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

              <div className="grid grid-cols-2 gap-2 w-full pt-4 border-t-2 border-muted/30">
                <Button variant="outline" asChild className="h-10 sm:h-12 font-black text-[11px] uppercase tracking-tighter rounded-xl border-2 hover:bg-primary/5 px-2">
                  <Link href={`/pedidos/${order.id}`}>
                    <FileText className="mr-1 size-3 sm:size-4" /> Ficha
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-10 sm:h-12 font-black text-[11px] uppercase tracking-tighter rounded-xl border-2 hover:bg-primary/5 px-2">
                  <Link href={`/pedidos/${order.id}/editar`}>
                    <Edit className="mr-1 size-3 sm:size-4" /> Editar
                  </Link>
                </Button>
                {order.paymentStatus !== "Pago" && (
                  <Button variant="outline" onClick={() => setOrderToPay(order)} className="h-10 sm:h-12 font-black text-[11px] uppercase tracking-tighter rounded-xl border-2 border-green-200 text-green-600 hover:bg-green-50 px-2">
                    <CheckCircle2 className="mr-1 size-3 sm:size-4" /> Pagar
                  </Button>
                )}
                <Button variant="outline" onClick={() => setOrderToDelete(order)} className="h-10 sm:h-12 font-black text-[11px] uppercase tracking-tighter rounded-xl border-2 text-destructive border-destructive/20 hover:bg-destructive/5 px-2">
                  <Trash2 className="mr-1 size-3 sm:size-4" /> Excluir
                </Button>
              </div>
            </Card>
          ))}

          {filteredOrders.length === 0 && (
            <div className="text-center py-32 bg-muted/10 rounded-[2.5rem] border-4 border-dashed border-muted w-full">
              <RefreshCw className="size-24 text-muted-foreground/20 mx-auto mb-6" />
              <h3 className="font-black text-3xl text-muted-foreground uppercase tracking-tighter">Nenhum pedido encontrado</h3>
              <p className="text-xl text-muted-foreground mt-4 font-bold italic opacity-60 px-6">Para {selectedCycleName}. Experimente trocar o ciclo acima.</p>
            </div>
          )}
        </div>
      )}

      {/* DIÁLOGOS DE CONFIRMAÇÃO */}
      <AlertDialog open={!!orderToPay} onOpenChange={(open) => !open && setOrderToPay(null)}>
        <AlertDialogContent className="rounded-[2rem] p-6 sm:p-12 border-8 shadow-2xl max-w-2xl mx-auto w-[92vw]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl sm:text-4xl font-black text-primary uppercase italic text-left">Confirmar Recebimento</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-xl font-bold mt-2 text-left">Data do pagamento de {orderToPay?.clientName}:</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="h-12 sm:h-16 text-lg sm:text-2xl font-black rounded-xl border-4 border-muted" />
          </div>
          <AlertDialogFooter className="gap-2 sm:gap-4 mt-4 flex-col sm:flex-row">
            <AlertDialogCancel className="h-12 sm:h-20 text-[10px] sm:text-lg font-black uppercase rounded-xl sm:rounded-2xl border-4">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPayment} className="h-12 sm:h-20 text-[10px] sm:text-lg font-black bg-green-600 text-white uppercase rounded-xl sm:rounded-2xl shadow-xl">CONFIRMAR</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
        <AlertDialogContent className="rounded-[2rem] p-6 sm:p-12 border-8 shadow-2xl max-w-2xl mx-auto w-[92vw]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl sm:text-4xl font-black text-destructive uppercase italic text-left">Remover Pedido?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-xl font-bold text-left">O pedido sairá da lista ativa do ciclo, mas continua no histórico permanente do cliente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-4 mt-4 flex-col sm:flex-row">
            <AlertDialogCancel className="h-12 sm:h-20 text-[10px] sm:text-lg font-black uppercase rounded-xl sm:rounded-2xl border-4">Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="h-12 sm:h-20 text-[10px] sm:text-lg font-black bg-destructive text-white uppercase rounded-xl sm:rounded-2xl shadow-xl">REMOVER</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
