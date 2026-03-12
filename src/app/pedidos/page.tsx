
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
      case "Pago": return <CheckCircle className="size-3" />;
      case "Pendente": return <Clock className="size-3" />;
      case "Atrasado": return <AlertCircle className="size-3" />;
      default: return null;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Pago": return "bg-green-100 text-green-700 border-none";
      case "Pendente": return "bg-orange-100 text-orange-700 border-none";
      case "Atrasado": return "bg-red-100 text-red-700 border-none";
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">Histórico de Pedidos</h1>
          <p className="text-muted-foreground mt-1">Acompanhe todas as vendas realizadas e status de pagamento.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Exportar</Button>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/vendas/nova">Nova Venda</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por ID do pedido..." 
            className="pl-10 h-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {["todos", "pago", "pendente", "atrasado"].map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className="capitalize"
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-2 text-muted-foreground">
              <Loader2 className="size-8 animate-spin" />
              <p>Carregando pedidos...</p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground bg-muted/30">
                    <th className="h-12 px-6 text-left font-medium">Pedido</th>
                    <th className="h-12 px-6 text-left font-medium">Data</th>
                    <th className="h-12 px-6 text-left font-medium">Total</th>
                    <th className="h-12 px-6 text-left font-medium">Pagamento</th>
                    <th className="h-12 px-6 text-left font-medium">Status</th>
                    <th className="h-12 px-6 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">#{order.id?.slice(-6)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="size-3" />
                          {new Date(order.orderDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold">R$ {Number(order.finalAmount).toFixed(2)}</td>
                      <td className="px-6 py-4 text-muted-foreground capitalize">{order.paymentMethod}</td>
                      <td className="px-6 py-4">
                        <Badge className={`flex items-center gap-1 w-fit ${getStatusClass(order.paymentStatus)}`}>
                          {getStatusIcon(order.paymentStatus)}
                          {order.paymentStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10" asChild>
                            <Link href={`/pedidos/${order.id}`}><Eye className="size-4" /></Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Marcar como Pago</DropdownMenuItem>
                              <DropdownMenuItem>Gerar Recibo</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onSelect={() => handleDelete(order.id)}>Excluir</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOrders.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum pedido registrado.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
