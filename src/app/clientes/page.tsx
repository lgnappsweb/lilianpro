
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary font-headline">Minhas Clientes</h1>
          <p className="text-muted-foreground mt-1">Gerencie seu catálogo de contatos e histórico.</p>
        </div>
        <Button asChild className="h-11 px-6 font-bold rounded-xl shadow-md">
          <Link href="/clientes/novo">
            <UserPlus className="mr-2 size-5" />
            Nova Cliente
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 pt-6 bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome ou bairro..."
              className="pl-10 h-11 bg-background rounded-xl border-muted shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="size-10 animate-spin text-primary" />
              <p className="font-medium animate-pulse">Carregando clientes...</p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground bg-muted/10 uppercase text-[10px] tracking-widest font-bold">
                    <th className="h-12 px-6 text-left">Nome</th>
                    <th className="h-12 px-6 text-left">Contato</th>
                    <th className="h-12 px-6 text-left">Localização</th>
                    <th className="h-12 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredClientes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                            {cliente.fullName?.charAt(0)}
                          </div>
                          <span className="font-bold text-base">{cliente.fullName}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2 font-medium text-muted-foreground">
                          <Phone className="size-4" />
                          <span>{cliente.phone}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="space-y-0.5">
                          <p className="font-bold">{cliente.neighborhood}</p>
                          <p className="text-xs text-muted-foreground">{cliente.city}</p>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-10 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => openWhatsApp(cliente.phone)}
                          >
                            <MessageCircle className="size-5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-10">
                                <MoreHorizontal className="size-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-1 rounded-xl shadow-xl">
                              <DropdownMenuLabel className="font-bold text-xs px-3">Opções</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild className="p-2.5 rounded-lg cursor-pointer">
                                <Link href={`/clientes/${cliente.id}`}>
                                  <FileText className="mr-2 size-4 text-primary" />
                                  <span>Ver Perfil</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="p-2.5 rounded-lg cursor-pointer">
                                <Edit className="mr-2 size-4 text-primary" />
                                <span>Editar</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="p-2.5 rounded-lg text-destructive cursor-pointer"
                                onSelect={() => setClientToDelete(cliente)}
                              >
                                <Trash2 className="mr-2 size-4" />
                                <span>Excluir</span>
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
            <div className="text-center py-20 bg-muted/5">
              <Search className="size-10 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-bold">Nenhuma cliente encontrada</h3>
              <p className="text-sm text-muted-foreground mt-1">Cadastre uma nova para começar.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente os dados da cliente 
              <strong> {clientToDelete?.fullName}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-white hover:bg-destructive/90 rounded-xl">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
