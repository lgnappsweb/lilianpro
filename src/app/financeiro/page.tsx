
"use client";

import React, { useMemo, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export default function FinanceiroPage() {
  const { user } = useUser();
  const db = useFirestore();

  // Estado para o intervalo de datas (Inicia com o mês atual)
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "orders");
  }, [db, user]);

  const { data: orders, isLoading } = useCollection(ordersQuery);

  // Filtra pedidos com base no período selecionado
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

  const stats = useMemo(() => {
    if (!filteredOrders) return [];
    const recebido = filteredOrders.filter(o => o.paymentStatus === "Pago").reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0);
    const pendente = filteredOrders.filter(o => o.paymentStatus === "Pendente").reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0);
    const atrasado = filteredOrders.filter(o => o.paymentStatus === "Atrasado").reduce((acc, o) => acc + (Number(o.finalAmount) || 0), 0);

    return [
      { title: "Entradas Totais", value: `R$ ${recebido.toFixed(2)}`, icon: ArrowDownCircle, color: "text-green-600", bg: "bg-green-100" },
      { title: "Pendentes", value: `R$ ${pendente.toFixed(2)}`, icon: Clock, color: "text-orange-600", bg: "bg-orange-100" },
      { title: "Atrasados", value: `R$ ${atrasado.toFixed(2)}`, icon: AlertCircle, color: "text-red-600", bg: "bg-red-100" },
    ];
  }, [filteredOrders]);

  const proximosRecebimentos = useMemo(() => {
    if (!filteredOrders) return [];
    return filteredOrders
      .filter(o => o.paymentStatus === "Pendente" && o.dueDate)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [filteredOrders]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
        <Loader2 className="size-14 animate-spin text-primary" />
        <p className="text-xl font-medium animate-pulse text-center px-2">Sincronizando finanças...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <Wallet className="size-16 sm:size-24 text-primary" />
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap px-2">FINANCEIRO</h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">Controle real de entradas e contas a receber.</p>
        </div>
        
        {/* Seletor de Período Monumental */}
        <div className="w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[400px] h-14 sm:h-16 text-lg sm:text-xl font-black justify-start text-left rounded-2xl border-4 border-muted hover:border-primary/20 bg-background shadow-xl transition-all active:scale-95",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-3 h-6 w-6 text-primary" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                      {format(date.to, "dd/MM/yy", { locale: ptBR })}
                    </>
                  ) : (
                    format(date.from, "dd/MM/yy", { locale: ptBR })
                  )
                ) : (
                  <span>Selecione o período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden border-4 border-primary/10 shadow-2xl" align="center">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={1}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((item, i) => (
          <Card key={i} className="border-none shadow-lg overflow-hidden rounded-3xl group">
            <div className={`h-2.5 w-full ${item.bg.replace('100', '500')} opacity-80 group-hover:opacity-100 transition-opacity`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-6 pt-6">
              <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest px-2">{item.title}</CardTitle>
              <div className={`${item.bg} ${item.color} p-3 rounded-2xl shadow-inner`}>
                <item.icon className="h-6 w-6" />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-8">
              <div className="text-4xl font-black text-foreground px-2">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 pb-6">
            <CardTitle className="text-2xl font-black px-2">Pagamentos para Receber</CardTitle>
            <CardDescription className="text-base font-medium">Vendas "A Prazo" com vencimento próximo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {proximosRecebimentos.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-6 rounded-2xl border border-border/50 bg-background shadow-sm hover:shadow-md transition-all">
                <div>
                  <p className="font-black text-xl px-2">Pedido #{p.id.slice(-6)}</p>
                  <p className="text-sm text-muted-foreground font-bold flex items-center gap-2 mt-1">
                    <CalendarIcon className="size-4" /> Vence em: {new Date(p.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-green-600 px-2">R$ {Number(p.finalAmount).toFixed(2)}</p>
                  <Badge variant="outline" className="text-orange-600 border-orange-200 font-black px-3 py-1 mt-2">
                    Aguardando
                  </Badge>
                </div>
              </div>
            ))}
            {proximosRecebimentos.length === 0 && (
              <p className="text-center py-16 text-muted-foreground text-lg font-medium italic">Nenhum recebimento pendente para o período selecionado.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 pb-6">
            <CardTitle className="text-2xl font-black px-2">Entradas Confirmadas</CardTitle>
            <CardDescription className="text-base font-medium">Últimos pagamentos recebidos com sucesso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {filteredOrders?.filter(o => o.paymentStatus === "Pago").slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-green-50/40 border border-green-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-green-100 flex items-center justify-center text-green-700 shadow-inner">
                    <ArrowDownCircle className="size-7" />
                  </div>
                  <div>
                    <p className="font-black text-xl px-2">Via {p.paymentMethod}</p>
                    <p className="text-sm text-muted-foreground font-bold flex items-center gap-2 mt-1">
                      <CalendarIcon className="size-4" /> {new Date(p.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-green-700 px-2">+ R$ {Number(p.finalAmount).toFixed(2)}</p>
                </div>
              </div>
            ))}
            {filteredOrders?.filter(o => o.paymentStatus === "Pago").length === 0 && (
              <p className="text-center py-16 text-muted-foreground text-lg font-medium italic">Nenhuma entrada confirmada registrada no período.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
