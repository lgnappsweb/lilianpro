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
  ArrowDownCircle,
  AlertCircle,
  Calendar,
  Filter,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";

export default function FinanceiroPage() {
  const { user } = useUser();
  const db = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "orders");
  }, [db, user]);

  const { data: orders, isLoading } = useCollection(ordersQuery);

  const stats = useMemo(() => {
    if (!orders) return [];
    const recebido = orders.filter(o => o.paymentStatus === "Pago").reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0);
    const pendente = orders.filter(o => o.paymentStatus === "Pendente").reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0);
    const atrasado = orders.filter(o => o.paymentStatus === "Atrasado").reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0);

    return [
      { title: "Entradas Totais", value: `R$ ${recebido.toFixed(2)}`, icon: ArrowDownCircle, color: "text-green-600", bg: "bg-green-100" },
      { title: "Pendentes", value: `R$ ${pendente.toFixed(2)}`, icon: Clock, color: "text-orange-600", bg: "bg-orange-100" },
      { title: "Atrasados", value: `R$ ${atrasado.toFixed(2)}`, icon: AlertCircle, color: "text-red-600", bg: "bg-red-100" },
    ];
  }, [orders]);

  const proximosRecebimentos = useMemo(() => {
    if (!orders) return [];
    return orders
      .filter(o => o.paymentStatus === "Pendente" && o.dueDate)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [orders]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" />
        <p>Sincronizando finanças...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">Controle Financeiro</h1>
          <p className="text-muted-foreground mt-1">Dados reais de entradas e contas a receber.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 size-4" />
            Este Mês
          </Button>
          <Button variant="outline">
            <Filter className="mr-2 size-4" />
            Filtros
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((item, i) => (
          <Card key={i} className="border-none shadow-sm overflow-hidden">
            <div className={`h-1.5 w-full ${item.bg.replace('100', '500')}`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
              <div className={`${item.bg} ${item.color} p-2 rounded-lg`}>
                <item.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Pagamentos para Receber</CardTitle>
            <CardDescription>Vendas "Fiado" com vencimento próximo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {proximosRecebimentos.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                <div>
                  <p className="font-semibold">Pedido #{p.id.slice(-6)}</p>
                  <p className="text-xs text-muted-foreground">Vence em: {new Date(p.dueDate).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">R$ {Number(p.finalAmount).toFixed(2)}</p>
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    Aguardando
                  </Badge>
                </div>
              </div>
            ))}
            {proximosRecebimentos.length === 0 && (
              <p className="text-center py-10 text-muted-foreground text-sm">Nenhum recebimento pendente para exibir.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Entradas Confirmadas</CardTitle>
            <CardDescription>Últimos pagamentos recebidos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {orders?.filter(o => o.paymentStatus === "Pago").slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-green-50/50 border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                    <ArrowDownCircle className="size-4" />
                  </div>
                  <div>
                    <p className="font-semibold">Recebido via {p.paymentMethod}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.orderDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-700">+ R$ {Number(p.finalAmount).toFixed(2)}</p>
                </div>
              </div>
            ))}
            {orders?.filter(o => o.paymentStatus === "Pago").length === 0 && (
              <p className="text-center py-10 text-muted-foreground text-sm">Nenhuma entrada confirmada registrada ainda.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}