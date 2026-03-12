"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  MoreVertical,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mockOrders = [
  { id: "1001", customer: "Maria Oliveira", date: "15/05/2024", total: 245.80, status: "Pago", method: "Pix" },
  { id: "1002", customer: "Juliana Ferreira", date: "16/05/2024", total: 112.50, status: "Pendente", method: "Fiado" },
  { id: "1003", customer: "Ana Paula Souza", date: "14/05/2024", total: 89.90, status: "Atrasado", method: "Fiado" },
  { id: "1004", customer: "Fabiana Mendes", date: "12/05/2024", total: 432.00, status: "Pago", method: "Cartão" },
  { id: "1005", customer: "Carla Beatriz", date: "10/05/2024", total: 156.40, status: "Pendente", method: "Pix" },
];

export default function PedidosPage() {
  const [activeFilter, setActiveFilter] = useState("todos");

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">Histórico de Pedidos</h1>
          <p className="text-muted-foreground mt-1">Acompanhe todas as vendas realizadas e status de pagamento.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Exportar</Button>
          <Button className="bg-primary hover:bg-primary/90">Nova Venda</Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente ou ID do pedido..." className="pl-10 h-10" />
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
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground bg-muted/30">
                  <th className="h-12 px-6 text-left font-medium">Pedido</th>
                  <th className="h-12 px-6 text-left font-medium">Cliente</th>
                  <th className="h-12 px-6 text-left font-medium">Data</th>
                  <th className="h-12 px-6 text-left font-medium">Total</th>
                  <th className="h-12 px-6 text-left font-medium">Pagamento</th>
                  <th className="h-12 px-6 text-left font-medium">Status</th>
                  <th className="h-12 px-6 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mockOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">#{order.id}</td>
                    <td className="px-6 py-4 font-medium">{order.customer}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="size-3" />
                        {order.date}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold">R$ {order.total.toFixed(2)}</td>
                    <td className="px-6 py-4 text-muted-foreground">{order.method}</td>
                    <td className="px-6 py-4">
                      <Badge className={`flex items-center gap-1 w-fit ${getStatusClass(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
                          <Eye className="size-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Editar Venda</DropdownMenuItem>
                            <DropdownMenuItem>Marcar como Pago</DropdownMenuItem>
                            <DropdownMenuItem>Gerar Recibo</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
