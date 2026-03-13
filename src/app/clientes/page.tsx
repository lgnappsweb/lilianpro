
"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  MessageCircle,
  UserPlus,
  Trash2,
  FileText,
  Edit,
  Loader2,
  Users,
  User,
  History,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function ClientesPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [clientToDelete, setClientToDelete] = useState<any | null>(null);

  const clientsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "clients");
  }, [db, user]);

  const { data: clients, isLoading } = useCollection(clientsQuery);

  const filteredClientes = useMemo(() => {
    if (!clients) return [];
    return clients.filter(c =>
      c.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const openWhatsApp = (phone: string) => {
    window.open(`https://wa.me/55${phone.replace(/\D/g, "")}`, "_blank");
  };

  const handleDeleteConfirm = () => {
    if (clientToDelete && user && db) {
      const docRef = doc(db, "users", user.uid, "clients", clientToDelete.id);
      deleteDocumentNonBlocking(docRef);
      toast({
        title: "Removendo cliente...",
        description: `${clientToDelete.fullName} será excluída em instantes.`,
      });
      setClientToDelete(null);
    }
  };

  return (
    <div className="space-y-8 sm:space-y-12 animate-in fade-in duration-500 w-full">
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <Users className="size-16 sm:size-24 text-primary" />
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap px-2">CLIENTES</h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">Gerencie seu catálogo de contatos e histórico.</p>
        </div>
        <Button asChild className="w-full h-14 sm:h-20 px-10 text-xl font-black rounded-2xl shadow-xl bg-primary hover:bg-primary/90 transition-transform hover:scale-105">
          <Link href="/clientes/novo">
            <UserPlus className="mr-3 size-6 sm:size-8" />
            Novo Cliente
          </Link>
        </Button>
      </div>

      <div className="w-full space-y-6 sm:space-y-10">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-6 sm:size-8 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome da cliente..."
            className="pl-14 sm:pl-20 h-14 sm:h-24 text-lg sm:text-3xl bg-background rounded-xl sm:rounded-[2rem] border-4 border-muted shadow-inner font-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground">
            <Loader2 className="size-16 animate-spin text-primary" />
            <p className="text-2xl font-black animate-pulse uppercase tracking-widest text-center">Sincronizando clientes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 w-full">
            {filteredClientes.map((cliente) => (
              <Card key={cliente.id} className="bg-background border-4 border-muted rounded-2xl p-6 sm:p-4 space-y-4 shadow-xl hover:border-primary/20 transition-all flex flex-col justify-between w-full max-w-none">
                <div className="flex flex-col items-center justify-center gap-2 mb-2">
                  <div className="size-12 sm:size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <User className="size-6 sm:size-10" />
                  </div>
                  <h3 className="font-black text-2xl sm:text-4xl text-primary uppercase tracking-tighter italic text-center line-clamp-2 leading-tight px-2">
                    {cliente.fullName}
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* BOTÕES DE AÇÃO ELITE */}
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <Button variant="outline" asChild className="h-10 sm:h-12 font-black text-[9px] sm:text-[11px] uppercase tracking-tighter rounded-xl border-2 hover:bg-primary/5 px-2">
                      <Link href={`/clientes/${cliente.id}`}>
                        <FileText className="mr-1 size-3 sm:size-4" />
                        Detalhes
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="h-10 sm:h-12 font-black text-[9px] sm:text-[11px] uppercase tracking-tighter rounded-xl border-2 hover:bg-primary/5 px-2">
                      <Link href={`/clientes/${cliente.id}/historico`}>
                        <History className="mr-1 size-3 sm:size-4" />
                        Histórico
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="h-10 sm:h-12 font-black text-[9px] sm:text-[11px] uppercase tracking-tighter rounded-xl border-2 hover:bg-primary/5 px-2">
                      <Link href={`/clientes/${cliente.id}/editar`}>
                        <Edit className="mr-1 size-3 sm:size-4" />
                        Editar
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-10 sm:h-12 font-black text-[9px] sm:text-[11px] uppercase tracking-tighter rounded-xl border-2 text-destructive border-destructive/20 hover:bg-destructive/5 hover:border-destructive px-2"
                      onClick={() => setClientToDelete(cliente)}
                    >
                      <Trash2 className="mr-1 size-3 sm:size-4" />
                      Excluir
                    </Button>
                  </div>

                  <Button
                    variant="default"
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 h-14 sm:h-16 rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg gap-3 shadow-xl transition-all active:scale-95 uppercase tracking-widest"
                    onClick={() => openWhatsApp(cliente.phone)}
                  >
                    <MessageCircle className="size-6 sm:size-7" />
                    Chamar no WhatsApp
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredClientes.length === 0 && (
          <div className="text-center py-32 bg-muted/10 rounded-[2.5rem] border-4 border-dashed border-muted w-full">
            <Search className="size-24 text-muted-foreground/20 mx-auto mb-6" />
            <h3 className="font-black text-3xl text-muted-foreground uppercase tracking-tighter">Nenhuma cliente encontrada</h3>
            <p className="text-xl text-muted-foreground mt-4 font-bold italic opacity-60">Refine sua pesquisa ou cadastre uma nova cliente no botão acima.</p>
          </div>
        )}
      </div>

      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-8 sm:p-12 border-8 shadow-2xl max-w-2xl mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl sm:text-5xl font-black tracking-tighter text-primary uppercase leading-none text-left px-2">Deseja excluir permanentemente?</AlertDialogTitle>
            <AlertDialogDescription className="text-xl sm:text-2xl font-bold mt-6 leading-relaxed text-muted-foreground text-left">
              Os dados da cliente <strong className="text-foreground border-b-4 border-primary px-1">{clientToDelete?.fullName}</strong> e todo o seu histórico serão removidos definitivamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4 mt-12 flex-col sm:flex-row">
            <AlertDialogCancel className="h-16 sm:h-24 px-10 text-xl font-black rounded-2xl sm:rounded-3xl border-4 border-muted hover:bg-muted/50">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="h-16 sm:h-24 px-10 text-xl font-black bg-destructive text-white hover:bg-destructive/90 rounded-2xl sm:rounded-3xl shadow-xl active:scale-95 transition-all">
              SIM, EXCLUIR AGORA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
