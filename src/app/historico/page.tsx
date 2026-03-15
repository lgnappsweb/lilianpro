
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  History,
  ChevronRight,
  User,
  Loader2,
  Calendar,
  Filter,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function HistoricoGlobalPage() {
  const { user } = useUser();
  const db = useFirestore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCycleId, setSelectedCycleId] = useState<string>("all");
  const [hasDefaulted, setHasDefaulted] = useState(false);

  // Busca Configurações para pegar o ciclo ativo inicial
  const settingsRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid, "config", "settings");
  }, [db, user]);
  const { data: settings } = useDoc(settingsRef);

  useEffect(() => {
    if (settings?.activeCycleId && !hasDefaulted) {
      setSelectedCycleId(settings.activeCycleId);
      setHasDefaulted(true);
    }
  }, [settings?.activeCycleId, hasDefaulted]);

  // Busca todos os ciclos para o seletor
  const cyclesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "cycles");
  }, [db, user]);
  const { data: cycles } = useCollection(cyclesQuery);

  // Busca todas as ordens para filtrar os clientes por ciclo
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "orders");
  }, [db, user]);
  const { data: allOrders, isLoading: ordersLoading } = useCollection(ordersQuery);

  const clientsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "clients");
  }, [db, user]);
  const { data: clients, isLoading: clientsLoading } = useCollection(clientsQuery);

  const filteredClients = useMemo(() => {
    if (!clients || !allOrders) return [];

    // Filtramos as ordens pelo ciclo selecionado
    const ordersInCycle = selectedCycleId === "all" 
      ? allOrders 
      : allOrders.filter(o => o.cycleId === selectedCycleId);

    // Pegamos os IDs únicos de clientes que têm ordens nesse ciclo
    const clientIdsInCycle = new Set(ordersInCycle.map(o => o.clientId));

    // Agora filtramos a lista de clientes por esses IDs e pelo termo de busca
    return clients
      .filter(c => {
        const matchesSearch = c.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
        const hasOrdersInCycle = clientIdsInCycle.has(c.id);
        return matchesSearch && hasOrdersInCycle;
      })
      .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
  }, [clients, allOrders, selectedCycleId, searchTerm]);

  const selectedCycleName = useMemo(() => {
    if (selectedCycleId === "all") return "Todos os Ciclos";
    return cycles?.find(c => c.id === selectedCycleId)?.name || "Ciclo Selecionado";
  }, [selectedCycleId, cycles]);

  if (clientsLoading || ordersLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground">
        <Loader2 className="size-16 animate-spin text-primary" />
        <p className="text-2xl font-black animate-pulse uppercase tracking-widest text-center">Carregando históricos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 w-full pb-20">
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <History className="size-16 sm:size-24 text-primary" />
            <h1 className="text-4xl sm:text-7xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap px-2">HISTÓRICO</h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">Consulta de clientes por período de venda.</p>
        </div>
      </div>

      {/* FILTROS DE CICLO E BUSCA */}
      <div className="w-full space-y-6">
        <Card className="border-4 border-primary/20 bg-primary/5 rounded-[2rem] overflow-hidden shadow-xl">
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center gap-3 text-primary">
              <Filter className="size-5" />
              <span className="font-black uppercase tracking-widest text-xs">Selecione o Ciclo</span>
            </div>
          </CardHeader>
          <div className="p-6 pt-0">
            <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
              <SelectTrigger className="h-16 sm:h-20 text-lg sm:text-2xl font-black rounded-2xl border-4 border-muted bg-background shadow-inner">
                <SelectValue placeholder="Selecione o ciclo..." />
              </SelectTrigger>
              <SelectContent className="font-black text-lg">
                <SelectItem value="all" className="italic">TODOS OS CICLOS (GERAL)</SelectItem>
                {cycles?.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-6 sm:size-8 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente neste ciclo..."
            className="pl-14 sm:pl-20 h-14 sm:h-24 text-lg sm:text-3xl bg-background rounded-xl sm:rounded-[2rem] border-4 border-muted shadow-inner font-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* LISTAGEM DE CLIENTES */}
      <div className="w-full space-y-6">
        <div className="flex flex-col px-4 gap-1">
          <h2 className="text-base sm:text-2xl font-black text-primary uppercase italic tracking-tight flex items-center gap-2 whitespace-nowrap overflow-hidden">
            <User className="size-5 sm:size-6 shrink-0" /> 
            <span className="truncate">Jornada: {selectedCycleName}</span>
          </h2>
          <span className="text-[10px] font-black text-muted-foreground uppercase opacity-40 tracking-widest">{filteredClients.length} contatos encontrados</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {filteredClients.map((cliente) => {
            const nameParts = cliente.fullName?.trim().split(/\s+/) || [];
            const isShortName = nameParts.length <= 2;

            return (
              <div key={cliente.id} className="group relative">
                <Link href={`/clientes/${cliente.id}/historico?cycleId=${selectedCycleId}`}>
                  <Card className="bg-background border-4 border-muted rounded-[1.5rem] sm:rounded-[2rem] p-6 shadow-lg group-hover:border-primary/40 group-hover:shadow-2xl transition-all flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="size-14 sm:size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                        <User className="size-8 sm:size-10" />
                      </div>
                      <div className="text-left">
                        <h3 className={cn(
                          "font-black text-xl sm:text-4xl text-primary uppercase tracking-tighter italic leading-none px-1",
                          isShortName && "whitespace-nowrap"
                        )}>
                          {cliente.fullName}
                        </h3>
                        <div className="flex items-center gap-2 mt-2 px-1">
                          <Calendar className="size-3 text-muted-foreground opacity-60" />
                          <p className="text-[10px] sm:text-xs text-muted-foreground font-black uppercase tracking-widest opacity-60">
                            Ver compras neste ciclo
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <ChevronRight className="size-8 sm:size-12 text-muted-foreground group-hover:text-primary group-hover:translate-x-2 transition-all opacity-20 group-hover:opacity-100" />
                    </div>
                  </Card>
                </Link>
              </div>
            );
          })}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-32 bg-muted/10 rounded-[2.5rem] border-4 border-dashed border-muted w-full">
            <RefreshCw className="size-24 text-muted-foreground/20 mx-auto mb-6" />
            <h3 className="font-black text-2xl sm:text-3xl text-muted-foreground uppercase tracking-tighter">Sem registros neste ciclo</h3>
            <p className="text-lg sm:text-xl text-muted-foreground mt-4 font-bold italic opacity-60 px-6">
              Nenhuma venda ativa foi encontrada para {selectedCycleName}. Troque o ciclo acima ou faça uma nova venda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
