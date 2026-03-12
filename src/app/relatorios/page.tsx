
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Award,
  Users,
  Calendar,
  Download,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const salesData = [
  { name: "Jan", total: 2400 },
  { name: "Fev", total: 1398 },
  { name: "Mar", total: 9800 },
  { name: "Abr", total: 3908 },
  { name: "Mai", total: 4800 },
  { name: "Jun", total: 3800 },
];

const brandData = [
  { name: "Natura", value: 65 },
  { name: "Avon", value: 35 },
];

const COLORS = ["#C2185B", "#AD1457", "#D028A9", "#F8BBD0"];

export default function RelatoriosPage() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <BarChart3 className="size-16 sm:size-24 text-primary" />
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap">RELATÓRIOS</h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">Desempenho do seu negócio em gráficos detalhados.</p>
        </div>
        <Button variant="outline" className="w-full h-14 sm:h-20 px-8 text-lg font-black rounded-2xl border-4 border-muted text-primary hover:bg-primary/5 transition-transform hover:scale-105 shadow-xl">
          <Download className="mr-3 size-6" />
          Baixar PDF Elite
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Sales Trend Chart */}
        <Card className="md:col-span-2 border-none shadow-lg rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-muted/10 pb-4">
            <CardTitle className="text-2xl font-black flex items-center gap-3">
              <TrendingUp className="size-7 text-primary" />
              Evolução de Vendas
            </CardTitle>
            <CardDescription className="text-base font-medium">Total vendido nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: "#888", fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: "#888", fontWeight: 700 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "1.5rem", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", padding: "1rem" }}
                    cursor={{ fill: "rgba(194, 24, 91, 0.05)" }}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Brands Distribution */}
        <Card className="border-none shadow-lg rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-muted/10 pb-4">
            <CardTitle className="text-2xl font-black flex items-center gap-3">
              <Award className="size-7 text-primary" />
              Mix de Marcas
            </CardTitle>
            <CardDescription className="text-base font-medium">Distribuição das suas vendas</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={brandData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {brandData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "1rem" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-4 mt-6">
              {brandData.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="size-4 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-lg font-black">{item.name}</span>
                  </div>
                  <span className="text-lg font-black text-primary">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Clients Table */}
        <Card className="md:col-span-3 border-none shadow-lg rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-muted/10 pb-4">
            <CardTitle className="text-2xl font-black flex items-center gap-3">
              <Users className="size-7 text-primary" />
              Melhores Clientes
            </CardTitle>
            <CardDescription className="text-base font-medium">Clientes VIP com maior volume de compras</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {[
              { name: "Maria Oliveira", total: 1250.40, count: 15 },
              { name: "Juliana Ferreira", total: 980.00, count: 10 },
              { name: "Carla Beatriz", total: 750.20, count: 8 },
            ].map((client, i) => (
              <div key={i} className="flex items-center justify-between p-6 rounded-[1.5rem] border border-border/50 bg-background hover:bg-muted/10 transition-all hover:shadow-md">
                <div className="flex items-center gap-5">
                  <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl shadow-inner">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-foreground leading-tight">{client.name}</p>
                    <p className="text-sm font-bold text-muted-foreground mt-1 uppercase tracking-widest">{client.count} pedidos realizados</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-primary leading-tight">R$ {client.total.toFixed(2)}</p>
                  <p className="text-xs font-black text-green-600 bg-green-50 px-3 py-1 rounded-lg mt-2 inline-block">Top {i + 1} Compradora</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
