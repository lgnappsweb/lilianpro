
"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
      c.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-primary font-headline">Minhas Clientes</h1>
          <p className="text-lg text-muted-foreground mt-2 font-medium">Gerencie seu catálogo de contatos e histórico de vendas.</p>
        </div>
        <Button asChild className="h-14 px-8 bg-primary hover:bg-primary/90 text-lg font-bold shadow-lg rounded-2xl">
          <Link href="/clientes/novo">
            <UserPlus className="mr-3 size-6" />
            Nova Cliente
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
        <CardHeader className="pb-6 pt-8 bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome ou bairro..."
                className="pl-12 h-14 text-lg bg-background rounded-2xl shadow-inner border-muted focus-visible:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
              <Loader2 className="size-14 animate-spin text-primary" />
              <p className="text-xl font-medium animate-pulse">Carregando clientes...</p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full text-lg">
                <thead>
                  <tr className="border-b text-muted-foreground bg-muted/10 uppercase text-xs tracking-widest font-black">
                    <th className="h-14 px-6 text-left">Nome</th>
                    <th className="h-14 px-6 text-left">Contato</th>
                    <th className="h-14 px-6 text-left">Localização</th>
                    <th className="h-14 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredClientes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg border border-primary/20 shadow-sm">
                            {cliente.fullName?.charAt(0)}
                          </div>
                          <span className="font-black text-xl text-foreground">{cliente.fullName}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3 font-bold text-muted-foreground">
                          <Phone className="size-5 text-primary/60" />
                          <span>{cliente.phone}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="space-y-1">
                          <p className="font-black text-foreground">{cliente.neighborhood}</p>
                          <p className="text-sm text-muted-foreground font-bold">{cliente.city}</p>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-12 rounded-2xl text-green-600 hover:text-green-700 hover:bg-green-50 shadow-sm border border-green-100"
                            onClick={() => openWhatsApp(cliente.phone)}
                          >
                            <MessageCircle className="size-6" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-12 rounded-2xl border border-border/50 shadow-sm">
                                <MoreHorizontal className="size-6" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-xl">
                              <DropdownMenuLabel className="font-black text-base px-4 py-3">Opções para {cliente.fullName}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild className="p-3 rounded-xl cursor-pointer">
                                <Link href={`/clientes/${cliente.id}`}>
                                  <FileText className="mr-3 size-5 text-primary" />
                                  <span className="font-bold">Ver Perfil Completo</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="p-3 rounded-xl cursor-pointer">
                                <Edit className="mr-3 size-5 text-primary" />
                                <span className="font-bold">Editar Dados</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="p-3 rounded-xl text-destructive cursor-pointer"
                                onSelect={() => setClientToDelete(cliente)}
                              >
                                <Trash2 className="mr-3 size-5" />
                                <span className="font-bold">Excluir Cliente</span>
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
          )}
          {!isLoading && filteredClientes.length === 0 && (
            <div className="text-center py-24 bg-muted/10">
              <div className="size-24 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Search className="size-12 text-muted-foreground/30" />
              </div>
              <h3 className="text-2xl font-black text-foreground">Nenhuma cliente encontrada</h3>
              <p className="text-lg text-muted-foreground mt-2 font-medium">Tente buscar por um nome diferente ou cadastre uma nova.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">Tem certeza que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg font-medium">
              Esta ação removerá permanentemente os dados da cliente 
              <strong className="text-primary"> {clientToDelete?.fullName}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="h-12 rounded-xl text-base font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="h-12 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-base font-bold shadow-lg">
              Sim, excluir cliente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
