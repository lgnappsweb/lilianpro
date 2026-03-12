"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertCircle,
  Calendar,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function FinanceiroPage() {
  const financialSummary = [
    { title: "Entradas Totais", value: "R$ 5.840,00", icon: ArrowDownCircle, color: "text-green-600", bg: "bg-green-100" },
    { title: "Pendentes", value: "R$ 1.250,50", icon: ClockIcon, color: "text-orange-600", bg: "bg-orange-100" },
    { title: "Atrasados", value: "R$ 480,00", icon: AlertCircle, color: "text-red-600", bg: "bg-red-100" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">Controle Financeiro</h1>
          <p className="text-muted-foreground mt-1">Resumo detalhado de suas entradas e contas a receber.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 size-4" />
            Maio 2024
          </Button>
          <Button variant="outline">
            <Filter className="mr-2 size-4" />
            Filtros
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {financialSummary.map((item, i) => (
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
            <CardDescription>Vendas realizadas via "Fiado" que vencem em breve</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { client: "Ana Paula Souza", due: "20/05/2024", amount: 189.90, status: "Vencendo" },
              { client: "Juliana Ferreira", due: "22/05/2024", amount: 45.00, status: "Aguardando" },
              { client: "Carla Beatriz", due: "25/05/2024", amount: 312.40, status: "Aguardando" },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                <div>
                  <p className="font-semibold">{p.client}</p>
                  <p className="text-xs text-muted-foreground">Vence em: {p.due}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">R$ {p.amount.toFixed(2)}</p>
                  <Badge variant="outline" className={p.status === "Vencendo" ? "text-orange-600 border-orange-200" : ""}>
                    {p.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Últimas Entradas</CardTitle>
            <CardDescription>Pagamentos confirmados nos últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { client: "Maria Oliveira", date: "15/05/2024", amount: 245.80, method: "Pix" },
              { client: "Fabiana Mendes", date: "14/05/2024", amount: 120.00, method: "Dinheiro" },
              { client: "Luciana Silva", date: "12/05/2024", amount: 89.90, method: "Cartão" },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-green-50/50 border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                    <ArrowDownCircle className="size-4" />
                  </div>
                  <div>
                    <p className="font-semibold">{p.client}</p>
                    <p className="text-xs text-muted-foreground">{p.date} • {p.method}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-700">+ R$ {p.amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
