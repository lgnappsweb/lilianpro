
"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  History,
  Package,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShoppingBag,
  Loader2,
  ArrowLeft,
  Search,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Componente para renderizar os itens de um pedido específico no histórico
 */
function OrderItemsList({ orderId }: { orderId: string }) {
  const { user } = useUser();
  const db = useFirestore();

  const itemsQuery = useMemoFirebase(() => {
    if (!db || !user || !orderId) return null;
    return collection(db, "users", user.uid, "orders", orderId, "orderItems");
  }, [db, user, orderId]);

  const { data: items, isLoading } = useCollection(itemsQuery);

  if (isLoading) return <Loader2 className="size-4 animate-spin text-muted-foreground mx-auto my-4" />;
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-4 space-y-2 border-t border-muted/30 pt-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Produtos Comprados nesta venda:</p>
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between bg-muted/5 p-3 rounded-xl border border-muted/20">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-[10px]">
              {item.quantity}x
            </div>
            <span className="text-sm font-bold text-foreground uppercase italic tracking-tighter truncate max-w-[150px] sm:max-w-none">
              {item.productName}
            </span>
          </div>
          <span className="text-sm font-black text-green-600 italic">
            R$ {Number(item.subtotal).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function HistoricoClientePage() {
  const { clientId } = useParams();
  const { user } = useUser();
  const db = useFirestore();

  // Busca dados da cliente
  const clientRef = useMemoFirebase(() => {
    if (!db || !user || !clientId) return null;
    return doc(db, "users", user.uid, "clients", clientId as string);
  }, [db, user, clientId]);
  const { data: cliente, isLoading: clientLoading } = useDoc(clientRef);

  // Busca todos os pedidos desta cliente (sem orderBy para evitar erro de índice composto)
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user || !clientId) return null;
    return query(
      collection(db, "users", user.uid, "orders"),
      where("clientId", "==", clientId)
    );
  }, [db, user, clientId]);
  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);

  // Ordenação e Estatísticas em Memória
  const sortedOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [orders]);

  const stats = useMemo(() => {
    if (!orders) return { total: 0, count: 0 };
    const total = orders.reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0);
    return { total, count: orders.length };
  }, [orders]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "Pago": return { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100", label: "PAGO" };
      case "Pendente": return { icon: Clock, color: "text-orange-600", bg: "bg-orange-100", label: "A PRAZO" };
      case "Atrasado": return { icon: AlertCircle, color: "text-red-600", bg: "bg-red-100", label: "ATRASADO" };
      default: return { icon: Package, color: "text-muted-foreground", bg: "bg-muted", label: status };
    }
  };

  if (clientLoading || ordersLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-muted-foreground">
        <Loader2 className="size-16 animate-spin text-primary" />
        <p className="text-2xl font-black animate-pulse uppercase tracking-widest text-center">Consultando arquivos elite...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 w-full pb-20">
      {/* CABEÇALHO */}
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="bg-primary p-4 rounded-[1.5rem] shadow-xl text-white rotate-3">
              <History className="size-12 sm:size-16" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl mt-4">
              HISTÓRICO VIP
            </h1>
          </div>
          <div className="mt-6">
            <p className="text-2xl sm:text-4xl font-black text-foreground uppercase italic tracking-tighter border-b-4 border-primary inline-block px-4">
              {cliente?.fullName}
            </p>
          </div>
        </div>
      </div>

      {/* RESUMO RÁPIDO */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-4 border-muted rounded-[2rem] bg-background shadow-lg overflow-hidden">
          <CardContent className="p-6 text-center">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Comprado</p>
            <p className="text-2xl sm:text-4xl font-black text-green-600 italic tracking-tighter">R$ {stats.total.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-4 border-muted rounded-[2rem] bg-background shadow-lg overflow-hidden">
          <CardContent className="p-6 text-center">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Qtd. Pedidos</p>
            <p className="text-2xl sm:text-4xl font-black text-primary italic tracking-tighter">{stats.count}</p>
          </CardContent>
        </Card>
      </div>

      {/* LISTAGEM DE COMPRAS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl sm:text-2xl font-black text-primary uppercase tracking-tighter italic flex items-center gap-3">
            <ShoppingBag className="size-6" /> Jornada de Compras
          </h2>
          <Badge variant="outline" className="border-2 font-black uppercase text-[10px] tracking-widest opacity-60">Cronológico</Badge>
        </div>

        <div className="grid gap-6">
          {sortedOrders.map((order) => {
            const status = getStatusInfo(order.paymentStatus);
            return (
              <Card key={order.id} className="border-4 border-muted rounded-[2rem] shadow-xl hover:border-primary/20 transition-all overflow-hidden group">
                <CardHeader className="bg-muted/30 p-6 pb-4 border-b border-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="size-5 text-primary" />
                      <p className="text-lg font-black text-foreground tracking-tighter">
                        {new Date(order.orderDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <Badge className={cn("px-4 py-1 rounded-full font-black text-[10px] uppercase shadow-sm border-none", status.bg, status.color)}>
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-4 text-muted-foreground" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{order.paymentMethod}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-primary italic tracking-tighter">R$ {Number(order.finalAmount).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Detalhes dos Produtos dentro do Pedido */}
                  <OrderItemsList orderId={order.id} />

                  <Button asChild variant="outline" className="w-full mt-6 h-12 rounded-xl font-black uppercase tracking-widest text-xs border-2 hover:bg-primary/5 group-hover:border-primary/30 transition-all">
                    <Link href={`/pedidos/${order.id}`}>
                      Ver Detalhes da Venda <ChevronRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}

          {sortedOrders.length === 0 && (
            <div className="text-center py-24 bg-muted/10 rounded-[3rem] border-4 border-dashed border-muted">
              <Search className="size-16 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground text-xl font-black uppercase tracking-tighter opacity-40 italic">Nenhuma compra registrada para esta cliente.</p>
            </div>
          )}
        </div>
      </div>

      {/* AÇÕES DE RODAPÉ */}
      <div className="pt-10">
        <Button asChild variant="outline" className="w-full h-20 rounded-[2rem] border-4 border-muted font-black text-xl gap-4 shadow-xl hover:bg-muted/50 transition-all">
          <Link href={`/clientes/${clientId}`}>
            <ArrowLeft className="size-6" />
            VOLTAR AO PERFIL
          </Link>
        </Button>
      </div>
    </div>
  );
}
