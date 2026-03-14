
"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
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
  Eye,
  Calendar,
  Loader2,
  ClipboardList,
  User,
  Smartphone,
  Banknote,
  CreditCard,
  HandCoins,
  Trash2,
  FileText,
  CheckCircle2,
  Edit,
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
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
  const [orderToDelete, setOrderToDelete] = useState<any | null>(null);
  const [orderToPay, setOrderToPay] = useState<any | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

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

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      if (o.isDeleted) return false;

      const searchStr = searchTerm.toLowerCase();
      const matchesSearch = 
        o.id?.toLowerCase().includes(searchStr) || 
        o.clientName?.toLowerCase().includes(searchStr);
      const matchesFilter = activeFilter === "todos" || o.paymentStatus?.toLowerCase() === activeFilter;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => (a.clientName || "").localeCompare(b.clientName || ""));
  }, [orders, searchTerm, activeFilter]);

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
        description: `O pedido de ${orderToPay.clientName} foi pago em ${new Date(paymentDate + "T12:00:00").toLocaleDateString('pt-BR')}.`,
      });
      setOrderToPay(null);
    }
  };

  const formatDateBR = (isoString: string) => {
    if (!isoString) return "";
    const datePart = isoString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 w-full overflow-x-hidden">
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <ClipboardList className="size-16 sm:size-24 text-primary" />
            <h1 className="text-5xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap px-2">PEDIDOS</h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">Controle de faturamento e recebimentos.</p>
        </div>
        <Button asChild className="w-full h-14 sm:h-20 px-10 text-xl font-black rounded-2xl shadow-xl bg-primary hover:bg-primary/90 transition-transform hover:scale-105">
          <Link href="/vendas/nova">Nova Venda</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-6 w-full">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-6 sm:size-8 text-muted-foreground" />
          <Input 
            placeholder="Buscar por ID ou nome da cliente..." 
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
          <p className="text-2xl font-black animate-pulse uppercase tracking-widest text-center">Carregando pedidos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 w-full pb-10">
          {filteredOrders.map((order) => (
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

              <div className="flex flex-row items-center justify-center gap-2 w-full pt-4 border-t-2 border-muted/30">
                <Button variant="outline" asChild className="h-10 sm:h-12 font-black text-[9px] sm:text-[10px] uppercase tracking-widest rounded-xl border-2 hover:bg-primary/5 px-2 flex-1 shadow-sm transition-all active:scale-95">
                  <Link href={`/pedidos/${order.id}`}>
                    <FileText className="mr-1 size-3" />
                    Ficha
                  </Link>
                </Button>

                <Button variant="outline" asChild className="h-10 sm:h-12 font-black text-[9px] sm:text-[10px] uppercase tracking-widest rounded-xl border-2 hover:bg-primary/5 px-2 flex-1 shadow-sm transition-all active:scale-95">
                  <Link href={`/pedidos/${order.id}/editar`}>
                    <Edit className="mr-1 size-3" />
                    Editar
                  </Link>
                </Button>
                
                {order.paymentStatus !== "Pago" && (
                  <Button 
                    variant="outline" 
                    className="h-10 sm:h-12 font-black text-[9px] sm:text-[10px] uppercase tracking-widest rounded-xl border-2 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-400 px-2 flex-1 shadow-sm transition-all active:scale-95"
                    onClick={() => setOrderToPay(order)}
                  >
                    <CheckCircle2 className="mr-1 size-3" />
                    Pagar
                  </Button>
                )}

                <Button 
                  variant="outline" 
                  className="h-10 sm:h-12 font-black text-[9px] sm:text-[10px] uppercase tracking-widest rounded-xl border-2 text-destructive border-destructive/20 hover:bg-destructive/5 hover:border-destructive px-2 flex-1 shadow-sm transition-all active:scale-95"
                  onClick={() => setOrderToDelete(order)}
                >
                  <Trash2 className="mr-1 size-3" />
                  EXCLUIR
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo de Confirmação de Pagamento com Data Personalizada */}
      <AlertDialog open={!!orderToPay} onOpenChange={(open) => !open && setOrderToPay(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-8 sm:p-12 border-8 shadow-2xl max-w-2xl mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl sm:text-5xl font-black tracking-tighter text-primary uppercase leading-none text-left px-2 italic">Confirmar Recebimento</AlertDialogTitle>
            <AlertDialogDescription className="text-xl sm:text-2xl font-bold mt-6 leading-relaxed text-muted-foreground text-left">
              Em qual data você recebeu o pagamento de <strong className="text-foreground border-b-4 border-primary px-1">{orderToPay?.clientName}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-6 px-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Data do Recebimento</Label>
            <Input 
              type="date" 
              value={paymentDate} 
              onChange={(e) => setPaymentDate(e.target.value)} 
              className="h-16 text-2xl font-black rounded-2xl border-4 border-muted focus:border-primary"
            />
          </div>
          <AlertDialogFooter className="gap-4 mt-12 flex-col sm:flex-row">
            <AlertDialogCancel className="h-16 sm:h-24 px-10 text-xl font-black rounded-2xl sm:rounded-3xl border-4 border-muted hover:bg-muted/50">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPayment} className="h-16 sm:h-24 px-10 text-xl font-black bg-green-600 text-white hover:bg-green-700 rounded-2xl sm:rounded-3xl shadow-xl active:scale-95 transition-all">
              SIM, CONFIRMAR PAGAMENTO
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-8 sm:p-12 border-8 shadow-2xl max-w-2xl mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl sm:text-5xl font-black tracking-tighter text-primary uppercase leading-none text-left px-2">Remover Pedido?</AlertDialogTitle>
            <AlertDialogDescription className="text-xl sm:text-2xl font-bold mt-6 leading-relaxed text-muted-foreground text-left">
              O pedido de <strong className="text-foreground border-b-4 border-primary px-1">{orderToDelete?.clientName}</strong> sairá do gerenciamento ativo, mas <span className="text-primary font-black">permanecerá no histórico permanente</span> do cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4 mt-12 flex-col sm:flex-row">
            <AlertDialogCancel className="h-16 sm:h-24 px-10 text-xl font-black rounded-2xl sm:rounded-3xl border-4 border-muted hover:bg-muted/50">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="h-16 sm:h-24 px-10 text-xl font-black bg-destructive text-white hover:bg-destructive/90 rounded-2xl sm:rounded-3xl shadow-xl active:scale-95 transition-all">
              SIM, REMOVER
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
