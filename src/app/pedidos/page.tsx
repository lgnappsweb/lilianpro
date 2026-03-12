
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
      case "Pago": return <CheckCircle className="size-4" />;
      case "Pendente": return <Clock className="size-4" />;
      case "Atrasado": return <AlertCircle className="size-4" />;
      default: return null;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Pago": return "bg-green-100 text-green-700 border-none shadow-sm";
      case "Pendente": return "bg-orange-100 text-orange-700 border-none shadow-sm";
      case "Atrasado": return "bg-red-100 text-red-700 border-none shadow-sm";
      default: return "";
    }
  };

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      const matchesSearch = o.id?.toLowerCase().includes(searchTerm.toLowerCase()) || o.clientId?.toLowerCase().includes(searchTerm.toLowerCase());
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-primary font-headline">Histórico de Pedidos</h1>
          <p className="text-lg text-muted-foreground mt-2 font-medium">Acompanhe todas as vendas realizadas e status de pagamento.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-14 px-8 text-base font-bold rounded-2xl border-muted">Exportar</Button>
          <Button asChild className="h-14 px-8 bg-primary hover:bg-primary/90 text-lg font-bold shadow-lg rounded-2xl">
            <Link href="/vendas/nova">Nova Venda</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
          <Input 
            placeholder="Buscar por ID do pedido..." 
            className="pl-12 h-14 text-lg bg-background rounded-2xl shadow-inner border-muted focus-visible:ring-primary" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {["todos", "pago", "pendente", "atrasado"].map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "outline"}
              onClick={() => setActiveFilter(filter)}
              className={`capitalize h-12 px-6 text-base font-black rounded-xl ${activeFilter === filter ? "shadow-md" : "border-muted"}`}
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground">
              <Loader2 className="size-16 animate-spin text-primary" />
              <p className="text-xl font-medium animate-pulse">Carregando pedidos...</p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full text-lg">
                <thead>
                  <tr className="border-b text-muted-foreground bg-muted/20 uppercase text-xs tracking-widest font-black">
                    <th className="h-16 px-8 text-left">Pedido</th>
                    <th className="h-16 px-8 text-left">Data</th>
                    <th className="h-16 px-8 text-left">Total</th>
                    <th className="h-16 px-8 text-left">Pagamento</th>
                    <th className="h-16 px-8 text-left">Status</th>
                    <th className="h-16 px-8 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-lg">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-8 py-6 font-mono text-base font-bold text-primary/80">#{order.id?.slice(-6)}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3 text-muted-foreground font-medium">
                          <Calendar className="size-5 text-primary/40" />
                          {new Date(order.orderDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-8 py-6 font-black text-2xl text-foreground">R$ {Number(order.finalAmount).toFixed(2)}</td>
                      <td className="px-8 py-6 text-muted-foreground font-bold capitalize">{order.paymentMethod}</td>
                      <td className="px-8 py-6">
                        <Badge className={`flex items-center gap-2 w-fit px-4 py-1.5 text-xs font-black rounded-xl ${getStatusClass(order.paymentStatus)}`}>
                          {getStatusIcon(order.paymentStatus)}
                          {order.paymentStatus}
                        </Badge>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Button variant="ghost" size="icon" className="size-12 rounded-2xl text-primary hover:bg-primary/10 border border-border/50 shadow-sm" asChild>
                            <Link href={`/pedidos/${order.id}`}><Eye className="size-6" /></Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-12 rounded-2xl border border-border/50 shadow-sm">
                                <MoreVertical className="size-6" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl">
                              <DropdownMenuItem className="p-3 rounded-xl font-bold cursor-pointer">Marcar como Pago</DropdownMenuItem>
                              <DropdownMenuItem className="p-3 rounded-xl font-bold cursor-pointer">Gerar Recibo</DropdownMenuItem>
                              <DropdownMenuItem className="p-3 rounded-xl font-bold text-destructive cursor-pointer" onSelect={() => handleDelete(order.id)}>Excluir Registro</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOrders.length === 0 && (
                <div className="text-center py-24 text-muted-foreground text-xl font-medium italic">
                  Nenhum pedido registrado até o momento.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
