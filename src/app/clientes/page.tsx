
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

  // Consulta memoizada para evitar loops de renderização
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
      
      // PADRÃO ELITE: Operação Non-blocking (não espera o servidor)
      deleteDocumentNonBlocking(docRef);
      
      toast({
        title: "Removendo cliente...",
        description: `${clientToDelete.fullName} será excluída em instantes.`,
      });
      setClientToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">Minhas Clientes</h1>
          <p className="text-muted-foreground mt-1">Gerencie seu catálogo de contatos e histórico de vendas.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/clientes/novo">
            <UserPlus className="mr-2 size-4" />
            Nova Cliente
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome ou bairro..."
                className="pl-10 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="size-8 animate-spin" />
              <p>Carregando clientes...</p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="h-10 px-4 text-left font-medium">Nome</th>
                    <th className="h-10 px-4 text-left font-medium">Contato</th>
                    <th className="h-10 px-4 text-left font-medium">Localização</th>
                    <th className="h-10 px-4 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredClientes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {cliente.fullName?.charAt(0)}
                          </div>
                          <span className="font-medium">{cliente.fullName}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Phone className="size-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{cliente.phone}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs">
                          <p className="font-medium">{cliente.neighborhood}</p>
                          <p className="text-muted-foreground">{cliente.city}</p>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => openWhatsApp(cliente.phone)}
                          >
                            <MessageCircle className="size-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>Opções para {cliente.fullName}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/clientes/${cliente.id}`} className="cursor-pointer">
                                  <FileText className="mr-2 size-4" />
                                  Ver Perfil Completo
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer">
                                <Edit className="mr-2 size-4" />
                                Editar Dados
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive cursor-pointer"
                                onSelect={() => setClientToDelete(cliente)}
                              >
                                <Trash2 className="mr-2 size-4" />
                                Excluir Cliente
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
            <div className="text-center py-12">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="size-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium">Nenhuma cliente encontrada</h3>
              <p className="text-muted-foreground">Tente buscar por um nome diferente ou cadastre uma nova.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente os dados da cliente 
              <strong> {clientToDelete?.fullName}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sim, excluir cliente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
