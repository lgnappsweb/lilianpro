
"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  MoreVertical,
  Calendar,
  Loader2,
  ClipboardList,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function PedidosPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");

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
      case "Pago": return "bg-green-100 text-green-700";
      case "Pendente": return "bg-orange-100 text-orange-700";
      case "Atrasado": return "bg-red-100 text-red-700";
      default: return "";
    }
  };

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      const matchesSearch = o.id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === "todos" || o.paymentStatus?.toLowerCase() === activeFilter;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [orders, searchTerm, activeFilter]);

  const handleDelete = (orderId: string) => {
    if (user && db) {
      const docRef = doc(db, "users", user.uid, "orders", orderId);
      deleteDocumentNonBlocking(docRef);
      toast({
        title: "Pedido removido",
        description: "O registro do pedido foi excluído.",
      });
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 w-full">
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <ClipboardList className="size-16 sm:size-24 text-primary" />
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap">PEDIDOS</h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">Controle de faturamento e recebimentos.</p>
        </div>
        <Button asChild className="w-full h-14 sm:h-20 px-10 text-xl font-black rounded-2xl shadow-xl bg-primary hover:bg-primary/90 transition-transform hover:scale-105">
          <Link href="/vendas/nova">Nova Venda</Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
          <Input 
            placeholder="Buscar ID do pedido..." 
            className="pl-14 h-14 bg-background rounded-2xl border-muted shadow-inner font-black text-lg" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {["todos", "pago", "pendente", "atrasado"].map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className={`capitalize h-14 px-6 font-bold rounded-2xl ${activeFilter === filter ? "shadow-lg" : "border-muted"}`}
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
              <Loader2 className="size-16 animate-spin text-primary" />
              <p className="text-xl font-black animate-pulse uppercase tracking-widest text-center">Carregando pedidos...</p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto scrollbar-hide">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground bg-muted/10 uppercase text-[10px] tracking-[0.2em] font-black">
                    <th className="h-16 px-8 text-left">Pedido</th>
                    <th className="h-16 px-8 text-left">Data</th>
                    <th className="h-16 px-8 text-left">Total</th>
                    <th className="h-16 px-8 text-left">Status</th>
                    <th className="h-16 px-8 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-8 py-6 font-mono text-xs font-black text-primary/80">#{order.id?.slice(-6)}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-foreground font-bold">
                          <Calendar className="size-4 opacity-40 text-primary" />
                          {new Date(order.orderDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-8 py-6 font-black text-lg text-primary tracking-tighter">R$ {Number(order.finalAmount).toFixed(2)}</td>
                      <td className="px-8 py-6">
                        <Badge className={`flex items-center gap-1 w-fit px-3 py-1 text-[10px] font-black rounded-lg border-none shadow-sm ${getStatusClass(order.paymentStatus)}`}>
                          {getStatusIcon(order.paymentStatus)}
                          {order.paymentStatus?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="size-10 rounded-xl hover:bg-primary/10 text-primary" asChild>
                            <Link href={`/pedidos/${order.id}`}><Eye className="size-5" /></Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-10 rounded-xl hover:bg-muted">
                                <MoreVertical className="size-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-2">
                              <DropdownMenuItem className="p-3 rounded-xl text-sm font-black cursor-pointer hover:bg-primary/5">MARCAR COMO PAGO</DropdownMenuItem>
                              <DropdownMenuItem className="p-3 rounded-xl text-sm font-black cursor-pointer text-destructive hover:bg-destructive/5" onSelect={() => handleDelete(order.id)}>EXCLUIR REGISTRO</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOrders.length === 0 && (
                <div className="text-center py-32 text-muted-foreground text-xl font-black italic opacity-30">
                  Nenhum pedido encontrado.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
