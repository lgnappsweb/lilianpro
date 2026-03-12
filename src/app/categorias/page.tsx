
"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Tag,
  Trash2,
  Loader2,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

export default function CategoriasPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);

  const categoriesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "categories");
  }, [db, user]);

  const { data: categories, isLoading } = useCollection(categoriesQuery);

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter(c =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const handleDeleteConfirm = () => {
    if (categoryToDelete && user && db) {
      const docRef = doc(db, "users", user.uid, "categories", categoryToDelete.id);
      deleteDocumentNonBlocking(docRef);
      toast({
        title: "Removendo categoria...",
        description: `${categoryToDelete.name} será excluída em instantes.`,
      });
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="space-y-8 sm:space-y-12 animate-in fade-in duration-500 w-full">
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <Tag className="size-16 sm:size-24 text-primary" />
            <h1 className="text-5xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap px-2">CATEGORIAS</h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">Organize seu catálogo por nichos e produtos.</p>
        </div>
        <Button asChild className="w-full h-14 sm:h-20 px-10 text-xl font-black rounded-2xl shadow-xl bg-primary hover:bg-primary/90 transition-transform hover:scale-105">
          <Link href="/categorias/novo">
            <Plus className="mr-3 size-6 sm:size-8" />
            Nova Categoria
          </Link>
        </Button>
      </div>

      <div className="w-full space-y-6 sm:space-y-10">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-6 sm:size-8 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome da categoria..."
            className="pl-14 sm:pl-20 h-14 sm:h-24 text-lg sm:text-3xl bg-background rounded-xl sm:rounded-[2rem] border-4 border-muted shadow-inner font-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground">
            <Loader2 className="size-16 animate-spin text-primary" />
            <p className="text-2xl font-black animate-pulse uppercase tracking-widest text-center">Sincronizando categorias...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 w-full">
            {filteredCategories.map((categoria) => (
              <Card key={categoria.id} className="bg-background border-4 border-muted rounded-2xl p-6 shadow-xl hover:border-primary/20 transition-all flex items-center justify-between w-full">
                <div className="flex items-center gap-6">
                  <div className="size-14 sm:size-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0">
                    <Tag className="size-8 sm:size-10" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-2xl sm:text-4xl text-primary uppercase tracking-tighter italic leading-tight px-2">
                      {categoria.name}
                    </h3>
                    <p className="text-sm sm:text-lg text-muted-foreground font-bold mt-1 opacity-60 uppercase tracking-wider px-2">
                      {categoria.description || "Sem descrição"}
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-12 sm:size-16 rounded-2xl hover:bg-muted">
                      <MoreVertical className="size-6 sm:size-8" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-2">
                    <DropdownMenuItem 
                      className="p-3 rounded-xl text-sm font-black cursor-pointer text-destructive hover:bg-destructive/5" 
                      onSelect={() => setCategoryToDelete(categoria)}
                    >
                      <Trash2 className="mr-3 size-4" />
                      EXCLUIR CATEGORIA
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredCategories.length === 0 && (
          <div className="text-center py-32 bg-muted/10 rounded-[2.5rem] border-4 border-dashed border-muted w-full">
            <Tag className="size-24 text-muted-foreground/20 mx-auto mb-6" />
            <h3 className="font-black text-3xl text-muted-foreground uppercase tracking-tighter">Nenhuma categoria encontrada</h3>
            <p className="text-xl text-muted-foreground mt-4 font-bold italic opacity-60">Crie sua primeira categoria no botão acima para organizar seu catálogo.</p>
          </div>
        )}
      </div>

      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-8 sm:p-12 border-8 shadow-2xl max-w-2xl mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl sm:text-5xl font-black tracking-tighter text-primary uppercase leading-none text-left px-2">Excluir permanentemente?</AlertDialogTitle>
            <AlertDialogDescription className="text-xl sm:text-2xl font-bold mt-6 leading-relaxed text-muted-foreground text-left">
              A categoria <strong className="text-foreground border-b-4 border-primary px-1">{categoryToDelete?.name}</strong> será removida definitivamente.
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
