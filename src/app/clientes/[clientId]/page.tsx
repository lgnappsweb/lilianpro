
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Phone,
  MapPin,
  Map,
  Info,
  Calendar,
  ArrowLeft,
  MessageCircle,
  Loader2,
  ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function DetalhesClientePage() {
  const { clientId } = useParams();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const clientRef = useMemoFirebase(() => {
    if (!db || !user || !clientId) return null;
    return doc(db, "users", user.uid, "clients", clientId as string);
  }, [db, user, clientId]);

  const { data: cliente, isLoading } = useDoc(clientRef);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-muted-foreground">
        <Loader2 className="size-16 animate-spin text-primary" />
        <p className="text-2xl font-black animate-pulse uppercase tracking-widest text-center">Sincronizando perfil elite...</p>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-muted p-8 rounded-full mb-6">
          <User className="size-24 text-muted-foreground/40" />
        </div>
        <h2 className="text-4xl font-black text-primary uppercase tracking-tighter px-2">Ops! Cliente não encontrada</h2>
        <p className="text-xl text-muted-foreground mt-4 font-bold opacity-60">Este registro pode ter sido excluído ou movido.</p>
        <Button asChild className="mt-10 h-16 px-10 text-xl font-black rounded-2xl shadow-xl bg-primary" variant="default">
          <Link href="/clientes">Voltar para a lista</Link>
        </Button>
      </div>
    );
  }

  const openWhatsApp = (phone: string) => {
    window.open(`https://wa.me/55${phone.replace(/\D/g, "")}`, "_blank");
  };

  // Lógica para verificar quantidade de nomes
  const nameParts = cliente.fullName?.trim().split(/\s+/) || [];
  const isShortName = nameParts.length <= 2;

  return (
    <div className="space-y-12 animate-in fade-in duration-500 w-full pb-20">
      {/* CABEÇALHO ELITE MONUMENTAL */}
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <ClipboardCheck className="size-16 sm:size-24 text-primary" />
            <h1 className="text-5xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap px-2">
              CADASTRO
            </h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">Ficha Detalhada da Cliente Elite</p>
        </div>
      </div>

      {/* NOME DA CLIENTE (FLEXÍVEL - REGRAS DE LINHA) */}
      <div className="flex flex-col items-center text-center mb-10 px-4">
        <h2 className={cn(
          "text-4xl md:text-7xl font-black tracking-tighter text-foreground font-headline uppercase leading-tight italic drop-shadow-sm max-w-5xl px-2",
          isShortName && "whitespace-nowrap"
        )}>
          {cliente.fullName}
        </h2>
        <Badge variant="secondary" className="mt-4 bg-primary/10 text-primary border-none font-black px-6 py-2 rounded-full text-xs sm:text-sm uppercase tracking-widest">
          Cliente Ativa
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Coluna 1: Contato e Ações Rápidas */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden border-t-8 border-green-500 bg-background">
            <CardHeader className="bg-muted/30 p-8 border-b-2">
              <CardTitle className="flex flex-row items-center gap-3 text-2xl font-black px-2">
                <Phone className="size-7 text-green-600" />
                CONEXÃO
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-left">WhatsApp Principal</p>
                <p className="text-3xl font-black text-foreground tracking-tighter text-left">{cliente.phone}</p>
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 h-20 rounded-2xl font-black text-lg gap-4 shadow-xl transition-all active:scale-95 uppercase tracking-widest"
                onClick={() => openWhatsApp(cliente.phone)}
              >
                <MessageCircle className="size-8" />
                ABRIR WHATSAPP
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2: Localização e Notas */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-background">
            <CardHeader className="bg-muted/30 p-8 border-b-2">
              <CardTitle className="flex flex-row items-center gap-3 text-2xl font-black text-left px-2">
                <MapPin className="size-7 text-primary" />
                LOCALIZAÇÃO & ENTREGA
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2 text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <Map className="size-3" /> CIDADE
                  </p>
                  <p className="text-2xl font-black text-foreground uppercase tracking-tight">{cliente.city || "Não informada"}</p>
                </div>
                <div className="space-y-2 text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <MapPin className="size-3" /> BAIRRO
                  </p>
                  <p className="text-2xl font-black text-foreground uppercase tracking-tight">{cliente.neighborhood || "Não informado"}</p>
                </div>
              </div>
              <div className="space-y-2 pt-8 border-t-2 text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                   <Info className="size-3" /> PONTO DE REFERÊNCIA / ENDEREÇO
                </p>
                <p className="text-xl sm:text-2xl font-bold text-foreground leading-relaxed">
                  {cliente.address || "Sem endereço detalhado cadastrado."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white/50 backdrop-blur-sm border-2 border-primary/5">
            <CardHeader className="bg-primary/5 p-8 border-b-2 border-primary/10">
              <CardTitle className="flex flex-row items-center gap-3 text-2xl font-black text-left px-2">
                <Info className="size-7 text-primary" />
                OBSERVAÇÕES DO PERFIL
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="bg-background/80 p-8 rounded-3xl shadow-inner border-2 border-muted text-left">
                <p className="text-xl sm:text-2xl font-medium text-foreground italic leading-relaxed whitespace-pre-wrap opacity-80">
                  {cliente.notes || "Nenhuma nota ou preferência registrada para esta cliente."}
                </p>
              </div>
              <div className="mt-8 pt-8 border-t-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-muted-foreground">
                <div className="flex items-center gap-3">
                   <Calendar className="size-6 text-primary" />
                   <p className="font-black uppercase tracking-widest text-[10px] sm:text-xs">
                     Cadastrada em: {new Date(cliente.registrationDate).toLocaleDateString()}
                   </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rodapé de Ações */}
      <div className="flex flex-col sm:flex-row gap-6">
        <Button
          asChild
          variant="outline"
          className="h-20 px-10 text-xl font-black rounded-3xl border-4 border-muted hover:bg-muted/50 transition-all flex-1 shadow-lg"
        >
          <Link href="/clientes">
            <ArrowLeft className="mr-3 size-6" />
            VOLTAR AOS CLIENTES
          </Link>
        </Button>
      </div>
    </div>
  );
}
