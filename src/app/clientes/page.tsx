
"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
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
            <h1 className="text-4xl md:text-8xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-sm">CLIENTES</h1>
          </div>
          <p className="text-xs sm:text-lg text-muted-foreground mt-2 font-bold opacity-60 uppercase tracking-widest">Gerencie seu catálogo de contatos e histórico.</p>
        </div>
        <Button asChild className="w-full h-16 px-10 text-xl font-black rounded-2xl shadow-xl bg-primary hover:bg-primary/90 transition-transform hover:scale-105">
          <Link href="/clientes/novo">
            <UserPlus className="mr-3 size-7" />
            Nova Cliente
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden w-full">
        <CardHeader className="p-4 sm:p-8 pb-4 bg-muted/20">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-7 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome, bairro ou cidade..."
              className="pl-16 h-14 sm:h-16 text-lg sm:text-xl bg-background rounded-xl sm:rounded-2xl border-4 border-muted shadow-inner font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground">
              <Loader2 className="size-16 animate-spin text-primary" />
              <p className="text-2xl font-black animate-pulse uppercase tracking-widest">Sincronizando clientes...</p>
            </div>
          ) : (
            <>
              {/* Visualização Mobile (Cards) */}
              <div className="grid gap-4 md:hidden p-4">
                {filteredClientes.map((cliente) => (
                  <div key={cliente.id} className="bg-background border-4 border-muted rounded-[1.5rem] p-6 space-y-4 shadow-sm active:scale-[0.98] transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl border-2 border-primary/20 shrink-0">
                          {cliente.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-black text-lg truncate leading-tight uppercase tracking-tight">{cliente.fullName}</h3>
                          <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                            <MapPin className="size-3 text-primary/40 shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 truncate">{cliente.city}</span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-12 rounded-xl border-2 border-transparent hover:border-muted-foreground/10">
                            <MoreHorizontal className="size-6" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-2xl">
                          <DropdownMenuItem asChild className="p-3 font-bold cursor-pointer">
                            <Link href={`/clientes/${cliente.id}`}>
                              <FileText className="mr-3 size-5 text-primary" />
                              Ver Detalhes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="p-3 font-bold cursor-pointer">
                            <Edit className="mr-3 size-5 text-primary" />
                            Editar Cadastro
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem 
                            className="p-3 font-bold text-destructive cursor-pointer" 
                            onSelect={() => setClientToDelete(cliente)}
                          >
                            <Trash2 className="mr-3 size-5" />
                            Excluir Cliente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-4 border-t-2 border-muted/30">
                      <div className="flex items-center gap-2 font-black text-muted-foreground text-sm min-w-0">
                        <Phone className="size-4 text-primary/40 shrink-0" />
                        <span className="truncate">{cliente.phone}</span>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 h-10 px-4 rounded-xl font-black gap-2 shadow-sm shrink-0"
                        onClick={() => openWhatsApp(cliente.phone)}
                      >
                        <MessageCircle className="size-4" />
                        WHATSAPP
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabela para Desktop */}
              <div className="hidden md:block relative w-full overflow-auto scrollbar-hide">
                <table className="w-full text-lg">
                  <thead>
                    <tr className="border-b-4 border-muted text-muted-foreground bg-muted/10 uppercase text-xs tracking-[0.3em] font-black">
                      <th className="h-16 px-10 text-left">Nome & Perfil</th>
                      <th className="h-16 px-10 text-left">WhatsApp / Fone</th>
                      <th className="h-16 px-10 text-left">Localização</th>
                      <th className="h-16 px-10 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2">
                    {filteredClientes.map((cliente) => (
                      <tr key={cliente.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="p-10">
                          <div className="flex items-center gap-6">
                            <div className="size-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary font-black text-2xl border-2 border-primary/20 shadow-inner group-hover:scale-110 transition-transform">
                              {cliente.fullName?.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-black text-2xl tracking-tight text-foreground">{cliente.fullName}</span>
                          </div>
                        </td>
                        <td className="p-10">
                          <div className="flex items-center gap-4 font-black text-muted-foreground text-xl">
                            <Phone className="size-6 text-primary/40" />
                            <span>{cliente.phone}</span>
                          </div>
                        </td>
                        <td className="p-10">
                          <div className="space-y-1">
                            <p className="font-black text-xl text-foreground uppercase tracking-wider">{cliente.neighborhood}</p>
                            <p className="text-sm text-muted-foreground font-black uppercase tracking-widest opacity-60">{cliente.city}</p>
                          </div>
                        </td>
                        <td className="p-10 text-right">
                          <div className="flex items-center justify-end gap-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-14 rounded-2xl text-green-600 hover:text-green-700 hover:bg-green-50 border-2 border-transparent hover:border-green-100 shadow-sm transition-all"
                              onClick={() => openWhatsApp(cliente.phone)}
                            >
                              <MessageCircle className="size-8" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="size-14 rounded-2xl border-2 border-muted shadow-sm hover:border-primary/20">
                                  <MoreHorizontal className="size-8" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl border-2">
                                <DropdownMenuLabel className="font-black text-xs px-4 py-2 uppercase tracking-widest opacity-40">Opções da Cliente</DropdownMenuLabel>
                                <DropdownMenuSeparator className="my-2 h-0.5 bg-muted" />
                                <DropdownMenuItem asChild className="p-4 rounded-xl cursor-pointer font-bold text-lg focus:bg-primary/5">
                                  <Link href={`/clientes/${cliente.id}`}>
                                    <FileText className="mr-3 size-6 text-primary" />
                                    <span>Ver Perfil Detalhado</span>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="p-4 rounded-xl cursor-pointer font-bold text-lg focus:bg-primary/5">
                                  <Edit className="mr-3 size-6 text-primary" />
                                  <span>Editar Cadastro</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-2 h-0.5 bg-muted" />
                                <DropdownMenuItem 
                                  className="p-4 rounded-xl text-destructive cursor-pointer font-black text-lg focus:bg-destructive/10"
                                  onSelect={() => setClientToDelete(cliente)}
                                >
                                  <Trash2 className="mr-3 size-6" />
                                  <span>Excluir Cliente</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {!isLoading && filteredClientes.length === 0 && (
            <div className="text-center py-32 bg-muted/5">
              <Search className="size-20 text-muted-foreground/20 mx-auto mb-6" />
              <h3 className="font-black text-2xl text-muted-foreground">Nenhuma cliente encontrada</h3>
              <p className="text-lg text-muted-foreground mt-2 font-bold italic">Refine sua pesquisa ou cadastre uma nova.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerta de Confirmação de Exclusão */}
      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-10 border-4 max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl font-black tracking-tight text-primary">Deseja excluir permanentemente?</AlertDialogTitle>
            <AlertDialogDescription className="text-xl font-bold mt-4 leading-relaxed">
              Os dados da cliente <strong className="text-foreground border-b-2 border-primary">{clientToDelete?.fullName}</strong> e todo o seu histórico de pedidos serão removidos definitivamente do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4 mt-10">
            <AlertDialogCancel className="h-16 px-10 text-xl font-black rounded-2xl border-2">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="h-16 px-10 text-xl font-black bg-destructive text-white hover:bg-destructive/90 rounded-2xl shadow-xl active:scale-95 transition-all">
              Sim, Excluir Agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
