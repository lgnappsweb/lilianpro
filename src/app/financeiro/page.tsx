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
        
        {/* Seletor de Período Monumental Elite */}
        <div className="w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full sm:min-w-[450px] h-16 sm:h-20 text-lg sm:text-2xl font-black justify-between text-left rounded-[1.5rem] border-4 border-muted hover:border-primary/40 bg-background shadow-2xl transition-all active:scale-95 px-8 group",
                  !date && "text-muted-foreground"
                )}
              >
                <div className="flex items-center">
                  <CalendarIcon className="mr-4 h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                  {date?.from ? (
                    date.to ? (
                      <span className="uppercase tracking-tighter">
                        {format(date.from, "dd MMM yy", { locale: ptBR })} -{" "}
                        {format(date.to, "dd MMM yy", { locale: ptBR })}
                      </span>
                    ) : (
                      <span className="uppercase tracking-tighter">{format(date.from, "dd MMM yy", { locale: ptBR })}</span>
                    )
                  ) : (
                    <span>SELECIONE O PERÍODO</span>
                  )}
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black ml-4 hidden sm:flex">PERÍODO</Badge>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-[2.5rem] overflow-hidden border-8 border-primary/5 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] bg-background" align="center" sideOffset={20}>
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
          <Card key={i} className="border-none shadow-lg overflow-hidden rounded-[2rem] group">
            <div className={`h-3 w-full ${item.bg.replace('100', '500')} opacity-80 group-hover:opacity-100 transition-opacity`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-8 pt-8">
              <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-2">{item.title}</CardTitle>
              <div className={`${item.bg} ${item.color} p-4 rounded-2xl shadow-inner`}>
                <item.icon className="h-7 w-7" />
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-10">
              <div className="text-4xl sm:text-5xl font-black text-foreground px-2 tracking-tighter italic">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-background/50 backdrop-blur-sm">
          <CardHeader className="bg-muted/30 pb-8 p-8 border-b-2">
            <CardTitle className="text-2xl font-black px-2 uppercase tracking-tight italic flex items-center gap-3">
              <Clock className="text-orange-500" /> Pagamentos para Receber
            </CardTitle>
            <CardDescription className="text-sm font-bold uppercase tracking-widest opacity-60">Vendas "A Prazo" com vencimento no período</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-8">
            {proximosRecebimentos.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-6 rounded-[1.5rem] border-4 border-muted bg-background shadow-sm hover:shadow-xl hover:border-primary/10 transition-all group">
                <div>
                  <p className="font-black text-xl px-2 uppercase italic text-primary">Pedido #{p.id.slice(-6)}</p>
                  <p className="text-xs text-muted-foreground font-black flex items-center gap-2 mt-2 uppercase tracking-widest">
                    <CalendarIcon className="size-4 text-primary" /> Vence em: {new Date(p.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-green-600 px-2 italic">R$ {Number(p.finalAmount).toFixed(2)}</p>
                  <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 font-black px-3 py-1 mt-3 rounded-lg text-[10px] uppercase tracking-widest">
                    Aguardando
                  </Badge>
                </div>
              </div>
            ))}
            {proximosRecebimentos.length === 0 && (
              <div className="text-center py-20 bg-muted/10 rounded-[2rem] border-4 border-dashed border-muted">
                <CalendarIcon className="size-16 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg font-black uppercase tracking-tighter opacity-40 italic">Nenhum recebimento pendente para este período.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-background/50 backdrop-blur-sm">
          <CardHeader className="bg-green-50/50 pb-8 p-8 border-b-2 border-green-100">
            <CardTitle className="text-2xl font-black px-2 uppercase tracking-tight italic flex items-center gap-3 text-green-700">
              <ArrowDownCircle className="text-green-600" /> Entradas Confirmadas
            </CardTitle>
            <CardDescription className="text-sm font-bold uppercase tracking-widest text-green-600/60">Últimos pagamentos liquidados com sucesso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-8">
            {filteredOrders?.filter(o => o.paymentStatus === "Pago").slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center justify-between p-6 rounded-[1.5rem] bg-green-50/40 border-4 border-green-100 shadow-sm hover:shadow-xl hover:bg-green-100/50 transition-all group">
                <div className="flex items-center gap-5">
                  <div className="size-16 rounded-[1.2rem] bg-green-100 flex items-center justify-center text-green-700 shadow-inner group-hover:scale-110 transition-transform">
                    <ArrowDownCircle className="size-8" />
                  </div>
                  <div>
                    <p className="font-black text-xl px-2 uppercase italic text-green-800">Via {p.paymentMethod}</p>
                    <p className="text-xs text-green-600/60 font-black flex items-center gap-2 mt-2 uppercase tracking-widest">
                      <CalendarIcon className="size-4" /> {new Date(p.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-green-700 px-2 italic tracking-tighter">+ R$ {Number(p.finalAmount).toFixed(2)}</p>
                </div>
              </div>
            ))}
            {filteredOrders?.filter(o => o.paymentStatus === "Pago").length === 0 && (
              <div className="text-center py-20 bg-muted/10 rounded-[2rem] border-4 border-dashed border-muted">
                <Wallet className="size-16 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg font-black uppercase tracking-tighter opacity-40 italic">Nenhuma entrada registrada no período selecionado.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
