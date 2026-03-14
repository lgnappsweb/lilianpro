"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
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
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function HistoricoGlobalPage() {
  const { user } = useUser();
  const db = useFirestore();
  
  const [searchTerm, setSearchTerm] = useState("");

  const clientsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "clients");
  }, [db, user]);

  const { data: clients, isLoading } = useCollection(clientsQuery);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter(c =>
      c.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [clients, searchTerm]);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 w-full">
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <History className="size-16 sm:size-24 text-primary" />
            <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap px-2">HISTÓRICO</h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">Selecione uma cliente para ver tudo o que ela já comprou.</p>
        </div>
      </div>

      <div className="w-full space-y-8">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-6 sm:size-8 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente pelo nome..."
            className="pl-14 sm:pl-20 h-14 sm:h-24 text-lg sm:text-3xl bg-background rounded-xl sm:rounded-[2rem] border-4 border-muted shadow-inner font-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground">
            <Loader2 className="size-16 animate-spin text-primary" />
            <p className="text-2xl font-black animate-pulse uppercase tracking-widest text-center">Carregando contatos elite...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {filteredClients.map((cliente) => {
              const nameParts = cliente.fullName?.trim().split(/\s+/) || [];
              const isShortName = nameParts.length <= 2;

              return (
                <div key={cliente.id} className="group relative">
                  <Link href={`/clientes/${cliente.id}/historico`}>
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
                              Clique para ver a jornada de compras
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
        )}

        {!isLoading && filteredClients.length === 0 && (
          <div className="text-center py-32 bg-muted/10 rounded-[2.5rem] border-4 border-dashed border-muted w-full">
            <User className="size-24 text-muted-foreground/20 mx-auto mb-6" />
            <h3 className="font-black text-3xl text-muted-foreground uppercase tracking-tighter">Cliente não encontrada</h3>
            <p className="text-xl text-muted-foreground mt-4 font-bold italic opacity-60">Tente buscar por outro nome ou cadastre a cliente primeiro.</p>
          </div>
        )}
      </div>
    </div>
  );
}
