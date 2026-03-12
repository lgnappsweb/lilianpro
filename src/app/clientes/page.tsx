
"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  MoreHorizontal,
  MessageCircle,
  Phone,
  UserPlus,
  Trash2,
  FileText,
  Edit,
  Loader2,
  Users,
  MapPin,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city?.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="space-y-10 animate-in fade-in duration-500 w-full">
      {/* Cabeçalho Centralizado */}
      <div className="flex flex-col items-center text-center gap-6 px-2">
        <div className="w-full">
          <div className="flex items-center justify-center gap-4 mb-2">
            <Users className="size-10 sm:size-16 text-primary" />
            <h1 className="text-4xl md:text-8xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-sm text-center">CLIENTES</h1>
          </div>
          <p className="text-xs sm:text-lg text-muted-foreground mt-2 font-bold opacity-60 uppercase tracking-widest text-center">Gerencie seu catálogo de contatos e histórico.</p>
        </div>
        <Button asChild className="w-full h-16 px-10 text-xl font-black rounded-2xl shadow-xl bg-primary hover:bg-primary/90 transition-transform hover:scale-105">
          <Link href="/clientes/novo">
            <UserPlus className="mr-3 size-7" />
            Nova Cliente
          </Link>
        </Button>
      </div>

      <div className="w-full space-y-6">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-7 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome, bairro ou cidade..."
            className="pl-16 h-14 sm:h-20 text-lg sm:text-2xl bg-background rounded-xl sm:rounded-3xl border-4 border-muted shadow-inner font-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground">
            <Loader2 className="size-16 animate-spin text-primary" />
            <p className="text-2xl font-black animate-pulse uppercase tracking-widest">Sincronizando clientes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClientes.map((cliente) => (
              <Card key={cliente.id} className="bg-background border-4 border-muted rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 space-y-6 shadow-xl hover:border-primary/20 transition-all group relative overflow-hidden flex flex-col justify-between h-full min-h-[300px]">
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <h3 className="font-black text-2xl sm:text-4xl break-words leading-tight uppercase tracking-tighter text-primary italic">
                        {cliente.fullName}
                      </h3>
                      <div className="flex flex-col gap-1 mt-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="size-5 text-primary/40 shrink-0" />
                          <span className="text-sm sm:text-xl font-black uppercase tracking-widest opacity-80 break-words leading-tight">
                            {cliente.city} {cliente.neighborhood ? `• ${cliente.neighborhood}` : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="size-5 text-primary/40 shrink-0" />
                          <span className="text-sm sm:text-xl font-black uppercase tracking-widest opacity-80">{cliente.phone}</span>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="size-12 sm:size-16 rounded-2xl border-4 border-muted hover:border-primary/20 flex items-center justify-center transition-all bg-background shrink-0 shadow-sm active:scale-95">
                          <MoreHorizontal className="size-8 sm:size-10 text-primary" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-72 p-3 rounded-[1.5rem] shadow-2xl border-4">
                        <DropdownMenuLabel className="font-black text-[10px] px-4 py-2 uppercase tracking-[0.2em] opacity-40">Opções da Cliente</DropdownMenuLabel>
                        <DropdownMenuSeparator className="my-2 h-1 bg-muted" />
                        <DropdownMenuItem asChild className="p-4 font-black text-xl cursor-pointer rounded-xl focus:bg-primary/5">
                          <Link href={`/clientes/${cliente.id}`}>
                            <FileText className="mr-3 size-7 text-primary" />
                            Ver Detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="p-4 font-black text-xl cursor-pointer rounded-xl focus:bg-primary/5">
                          <Edit className="mr-3 size-7 text-primary" />
                          Editar Cadastro
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-2 h-1 bg-muted" />
                        <DropdownMenuItem 
                          className="p-4 font-black text-xl text-destructive cursor-pointer rounded-xl focus:bg-destructive/10" 
                          onSelect={() => setClientToDelete(cliente)}
                        >
                          <Trash2 className="mr-3 size-7" />
                          Excluir Cliente
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    variant="default"
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 h-16 sm:h-24 rounded-2xl sm:rounded-3xl font-black text-lg sm:text-3xl gap-4 shadow-xl transition-all active:scale-95 uppercase tracking-widest"
                    onClick={() => openWhatsApp(cliente.phone)}
                  >
                    <MessageCircle className="size-8 sm:size-12" />
                    Chamar no WhatsApp
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredClientes.length === 0 && (
          <div className="text-center py-32 bg-muted/10 rounded-[2.5rem] border-4 border-dashed border-muted">
            <Search className="size-24 text-muted-foreground/20 mx-auto mb-6" />
            <h3 className="font-black text-3xl text-muted-foreground uppercase tracking-tighter">Nenhuma cliente encontrada</h3>
            <p className="text-xl text-muted-foreground mt-4 font-bold italic opacity-60">Refine sua pesquisa ou cadastre uma nova cliente no botão acima.</p>
          </div>
        )}
      </div>

      {/* Alerta de Confirmação de Exclusão */}
      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-8 sm:p-12 border-8 shadow-2xl max-w-2xl mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl sm:text-5xl font-black tracking-tighter text-primary uppercase leading-none">Deseja excluir permanentemente?</AlertDialogTitle>
            <AlertDialogDescription className="text-xl sm:text-2xl font-bold mt-6 leading-relaxed text-muted-foreground">
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
