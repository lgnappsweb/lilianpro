
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ReceiptText,
  User,
  Package,
  Calendar,
  CreditCard,
  HandCoins,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Info,
  DollarSign,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function DetalhesPedidoPage() {
  const { orderId } = useParams();
  const { user } = useUser();
  const db = useFirestore();

  // Busca os dados do pedido
  const orderRef = useMemoFirebase(() => {
    if (!db || !user || !orderId) return null;
    return doc(db, "users", user.uid, "orders", orderId as string);
  }, [db, user, orderId]);

  const { data: order, isLoading: orderLoading } = useDoc(orderRef);

  // Busca os itens do pedido
  const itemsQuery = useMemoFirebase(() => {
    if (!db || !user || !orderId) return null;
    return collection(db, "users", user.uid, "orders", orderId as string, "orderItems");
  }, [db, user, orderId]);

  const { data: items, isLoading: itemsLoading } = useCollection(itemsQuery);

  if (orderLoading || itemsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-muted-foreground">
        <Loader2 className="size-16 animate-spin text-primary" />
        <p className="text-2xl font-black animate-pulse uppercase tracking-widest text-center">Sincronizando faturamento elite...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-muted p-8 rounded-full mb-6">
          <ReceiptText className="size-24 text-muted-foreground/40" />
        </div>
        <h2 className="text-4xl font-black text-primary uppercase tracking-tighter px-2">Ops! Pedido não encontrado</h2>
        <p className="text-xl text-muted-foreground mt-4 font-bold opacity-60">Este registro pode ter sido excluído ou movido.</p>
        <Button asChild className="mt-10 h-16 px-10 text-xl font-black rounded-2xl shadow-xl bg-primary" variant="default">
          <Link href="/pedidos">Voltar para a lista</Link>
        </Button>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "Pago": return { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100", label: "PAGAMENTO CONFIRMADO" };
      case "Pendente": return { icon: Clock, color: "text-orange-600", bg: "bg-orange-100", label: "AGUARDANDO PAGAMENTO" };
      case "Atrasado": return { icon: AlertCircle, color: "text-red-600", bg: "bg-red-100", label: "PAGAMENTO EM ATRASO" };
      default: return { icon: Info, color: "text-muted-foreground", bg: "bg-muted", label: status?.toUpperCase() };
    }
  };

  const status = getStatusInfo(order.paymentStatus);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 w-full pb-20">
      {/* CABEÇALHO ELITE MONUMENTAL */}
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <ReceiptText className="size-16 sm:size-24 text-primary" />
            <h1 className="text-[2.2rem] sm:text-5xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl px-2 max-w-full text-center">
              RESUMO DA VENDA
            </h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">Protocolo Elite: #{order.id?.slice(-8)}</p>
        </div>
      </div>

      {/* CLIENTE E STATUS EM DESTAQUE */}
      <div className="flex flex-col items-center text-center mb-10 px-4">
        <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-foreground font-headline uppercase leading-tight italic drop-shadow-sm max-w-5xl px-2">
          {order.clientName}
        </h2>
        <div className={cn("mt-6 flex items-center gap-3 px-8 py-3 rounded-full border-4 shadow-lg", status.bg, "border-white/50")}>
          <status.icon className={cn("size-6", status.color)} />
          <span className={cn("text-xs sm:text-lg font-black uppercase tracking-widest", status.color)}>
            {status.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Coluna 1: Informações de Pagamento e Logística */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-background">
            <CardHeader className="bg-muted/30 p-8 border-b-2">
              <CardTitle className="flex flex-row items-center gap-3 text-2xl font-black px-2 uppercase tracking-widest">
                <CreditCard className="size-7 text-primary" />
                CONEXÃO
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              <div className="space-y-2 text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <HandCoins className="size-3" /> FORMA DE PAGAMENTO
                </p>
                <p className="text-3xl font-black text-primary tracking-tighter uppercase italic">{order.paymentMethod}</p>
              </div>

              <div className="space-y-2 text-left pt-6 border-t-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <Calendar className="size-3" /> DATA DA VENDA
                </p>
                <p className="text-2xl font-black text-foreground">
                  {new Date(order.orderDate).toLocaleDateString()}
                </p>
              </div>

              {order.dueDate && (
                <div className="space-y-2 text-left pt-6 border-t-2 bg-orange-50/50 p-4 rounded-2xl border-orange-100">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 flex items-center gap-2">
                    <Clock className="size-3" /> DATA DE VENCIMENTO (FIADO)
                  </p>
                  <p className="text-2xl font-black text-orange-700">
                    {new Date(order.dueDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white/50 backdrop-blur-sm border-2 border-primary/5">
            <CardHeader className="bg-primary/5 p-8 border-b-2 border-primary/10">
              <CardTitle className="flex flex-row items-center gap-3 text-2xl font-black text-left px-2 uppercase tracking-widest">
                <Info className="size-7 text-primary" />
                NOTAS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="bg-background/80 p-6 rounded-3xl shadow-inner border-2 border-muted text-left">
                <p className="text-lg font-medium text-foreground italic leading-relaxed whitespace-pre-wrap opacity-80">
                  {order.notes || "Sem observações adicionais para este pedido."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2: Itens do Pedido e Resumo Financeiro */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-background">
            <CardHeader className="bg-muted/30 p-8 border-b-2">
              <CardTitle className="flex flex-row items-center gap-3 text-2xl font-black text-left px-2 uppercase tracking-widest">
                <Package className="size-7 text-primary" />
                ITENS NO PEDIDO
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y-2">
                {items?.map((item) => (
                  <div key={item.id} className="p-8 flex items-center justify-between group hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-6">
                      <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black shadow-inner">
                        {item.quantity}x
                      </div>
                      <div>
                        <p className="text-2xl font-black text-foreground uppercase tracking-tight leading-tight px-1 italic">
                          {item.productName}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mt-1">
                          Unitário: R$ {Number(item.unitPrice).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-primary tracking-tighter italic">
                        R$ {Number(item.subtotal).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                {!items?.length && (
                  <div className="p-20 text-center text-muted-foreground italic font-bold">
                    Nenhum item detalhado encontrado.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* FECHAMENTO FINANCEIRO ELITE */}
          <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-primary text-primary-foreground">
            <CardHeader className="p-8 border-b border-white/10">
              <CardTitle className="flex flex-row items-center gap-3 text-2xl font-black px-2 uppercase tracking-widest italic">
                <DollarSign className="size-7" />
                CONSOLIDADO FINANCEIRO
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 sm:p-12">
              <div className="grid sm:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Subtotal Bruto</span>
                    <span className="text-xl font-bold">R$ {Number(order.totalAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Descontos</span>
                    <span className="text-xl font-bold text-green-300">- R$ {Number(order.discountAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Taxas / Extras</span>
                    <span className="text-xl font-bold text-orange-300">+ R$ {Number(order.additionalFeeAmount).toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-white text-primary p-8 rounded-[2.5rem] shadow-2xl text-center border-8 border-white animate-in zoom-in duration-500">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-60">Valor Final Recebido</p>
                  <p className="text-5xl sm:text-7xl font-black tracking-tighter leading-none italic px-2">
                    R$ {Number(order.finalAmount).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rodapé de Ações */}
      <div className="flex flex-col sm:flex-row gap-6">
        <Button
          asChild
          variant="outline"
          className="h-20 px-10 text-xl font-black rounded-3xl border-4 border-muted hover:bg-muted/50 transition-all flex-1 shadow-lg"
        >
          <Link href="/pedidos">
            <ArrowLeft className="mr-3 size-6" />
            VOLTAR AOS PEDIDOS
          </Link>
        </Button>
      </div>
    </div>
  );
}
