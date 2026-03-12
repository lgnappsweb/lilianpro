
"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Package, 
  ShoppingBag, 
  Trash2, 
  Loader2,
  Edit,
  FileText,
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
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

export default function ProdutosPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "products");
  }, [db, user]);

  const { data: products, isLoading } = useCollection(productsQuery);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBrand = activeBrand ? p.brand === activeBrand : true;
      return matchesSearch && matchesBrand;
    });
  }, [products, searchTerm, activeBrand]);

  const handleDeleteConfirm = () => {
    if (productToDelete && user && db) {
      const docRef = doc(db, "users", user.uid, "products", productToDelete.id);
      deleteDocumentNonBlocking(docRef);
      toast({
        title: "Removendo produto...",
        description: `${productToDelete.name} será excluído em instantes.`,
      });
      setProductToDelete(null);
    }
  };

  const getBrandBadgeColor = (brand: string) => {
    if (brand === "VERDE (N)") return "bg-green-600 hover:bg-green-700";
    if (brand === "ROSA (A)") return "bg-primary hover:bg-primary/90";
    if (brand === "MARROM (C&E)") return "bg-amber-900 hover:bg-amber-950";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full overflow-x-hidden">
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <Package className="size-16 sm:size-24 text-primary" />
            <h1 className="text-5xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap px-2">PRODUTOS</h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">Organize seus produtos da Avon, Natura e outras marcas.</p>
        </div>
        <Button asChild className="w-full h-14 sm:h-20 px-10 text-xl font-black rounded-2xl shadow-xl bg-primary hover:bg-primary/90 transition-transform hover:scale-105">
          <Link href="/produtos/novo">
            <Plus className="mr-3 size-6 sm:size-8" />
            Novo Produto
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-6 w-full">
        <div className="relative w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-6 sm:size-8 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome do produto..."
            className="pl-14 sm:pl-20 h-14 sm:h-24 text-lg sm:text-3xl bg-background rounded-xl sm:rounded-[2rem] border-4 border-muted shadow-inner font-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 w-full md:w-auto">
          <Button
            variant={activeBrand === null ? "default" : "outline"}
            onClick={() => setActiveBrand(null)}
            className={`h-12 sm:h-14 px-4 sm:px-8 text-sm sm:text-base font-black rounded-xl sm:rounded-2xl transition-all ${activeBrand === null ? "shadow-lg scale-105" : "border-muted opacity-60"}`}
          >
            Todos
          </Button>
          <Button
            variant={activeBrand === "VERDE (N)" ? "default" : "outline"}
            onClick={() => setActiveBrand("VERDE (N)")}
            className={`h-12 sm:h-14 px-4 sm:px-8 text-sm sm:text-base font-black rounded-xl sm:rounded-2xl transition-all ${activeBrand === "VERDE (N)" ? "bg-green-600 hover:bg-green-700 shadow-lg scale-105 border-none text-white" : "border-muted opacity-60"}`}
          >
            Verde (N)
          </Button>
          <Button
            variant={activeBrand === "ROSA (A)" ? "default" : "outline"}
            onClick={() => setActiveBrand("ROSA (A)")}
            className={`h-12 sm:h-14 px-4 sm:px-8 text-sm sm:text-base font-black rounded-xl sm:rounded-2xl transition-all ${activeBrand === "ROSA (A)" ? "bg-primary hover:bg-primary/90 shadow-lg scale-105 border-none text-white" : "border-muted opacity-60"}`}
          >
            Rosa (A)
          </Button>
          <Button
            variant={activeBrand === "MARROM (C&E)" ? "default" : "outline"}
            onClick={() => setActiveBrand("MARROM (C&E)")}
            className={`h-12 sm:h-14 px-4 sm:px-8 text-sm sm:text-base font-black rounded-xl sm:rounded-2xl transition-all ${activeBrand === "MARROM (C&E)" ? "bg-amber-900 hover:bg-amber-950 shadow-lg scale-105 border-none text-white" : "border-muted opacity-60"}`}
          >
            Marrom (C&E)
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground">
          <Loader2 className="size-16 animate-spin text-primary" />
          <p className="text-2xl font-black animate-pulse uppercase tracking-widest text-center">Carregando catálogo...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10 w-full pb-10">
          {filteredProducts.map((product) => (
            <Card 
              key={product.id} 
              className="bg-background border-4 border-primary/5 rounded-[2rem] p-5 sm:p-8 shadow-xl hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] hover:-translate-y-3 hover:border-primary/20 transition-all duration-500 flex flex-col justify-between w-full relative overflow-hidden group transform-gpu"
            >
              
              {/* LINHA SUPERIOR: MARCA E CATEGORIA */}
              <div className="flex items-center justify-between w-full mb-6">
                <Badge className={`text-[10px] sm:text-xs font-black px-3 py-1 rounded-lg border-none text-white shadow-md ${getBrandBadgeColor(product.brand)}`}>
                  {product.brand}
                </Badge>
                <Badge variant="outline" className="text-[10px] sm:text-xs font-black border-2 border-primary/30 text-primary uppercase px-3 py-1 rounded-lg bg-background/50 backdrop-blur-sm shadow-sm">
                  {product.category}
                </Badge>
              </div>

              {/* CONTEÚDO CENTRAL: NOME E CÓDIGO */}
              <div className="flex flex-col gap-1 mb-8 text-left">
                <h3 className="font-black text-2xl sm:text-4xl text-primary uppercase tracking-tighter italic leading-tight px-1 line-clamp-2 drop-shadow-sm">
                  {product.name}
                </h3>
                <p className="text-[10px] sm:text-sm text-muted-foreground font-black opacity-40 uppercase tracking-[0.2em] px-1">
                  REF: {product.productCode}
                </p>
              </div>
              
              {/* LINHA DE VALOR E ÍCONE GIGANTE 3D */}
              <div className="flex items-end justify-between w-full mb-8 px-1">
                {/* ÍCONE AMPLIADO COM EFEITO */}
                <div className="size-16 sm:size-24 rounded-2xl sm:rounded-3xl bg-primary/5 flex items-center justify-center text-primary shadow-inner border-4 border-primary/5 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                  <Package className="size-8 sm:size-12 drop-shadow-lg" />
                </div>

                <div className="flex flex-col items-end">
                  <p className="text-3xl sm:text-5xl font-black text-primary tracking-tighter leading-none italic">
                    R$ {Number(product.salePrice).toFixed(2)}
                  </p>
                  <p className="text-[9px] sm:text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40 mt-2">
                    Valor de Venda
                  </p>
                </div>
              </div>

              {/* BOTÕES DE AÇÃO ELITE */}
              <div className="flex flex-row items-center justify-center gap-2 w-full pt-6 border-t-2 border-muted/30">
                <Button variant="outline" asChild className="h-10 sm:h-12 font-black text-[9px] sm:text-[11px] uppercase tracking-widest rounded-xl sm:rounded-2xl border-2 hover:bg-primary/5 px-2 flex-1 shadow-sm transition-all active:scale-95">
                  <Link href={`/produtos/${product.id}`}>
                    <FileText className="mr-1 size-3 sm:size-4" />
                    Ficha
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-10 sm:h-12 font-black text-[9px] sm:text-[11px] uppercase tracking-widest rounded-xl sm:rounded-2xl border-2 hover:bg-primary/5 px-2 flex-1 shadow-sm transition-all active:scale-95">
                  <Link href={`/produtos/${product.id}/editar`}>
                    <Edit className="mr-1 size-3 sm:size-4" />
                    Editar
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-10 sm:h-12 font-black text-[9px] sm:text-[11px] uppercase tracking-widest rounded-xl sm:rounded-2xl border-2 text-destructive border-destructive/20 hover:bg-destructive/5 hover:border-destructive px-2 flex-1 shadow-sm transition-all active:scale-95"
                  onClick={() => setProductToDelete(product)}
                >
                  <Trash2 className="mr-1 size-3 sm:size-4" />
                  Apagar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredProducts.length === 0 && (
        <div className="text-center py-32 bg-muted/10 rounded-[2.5rem] border-4 border-dashed border-muted w-full">
          <ShoppingBag className="size-24 text-muted-foreground/20 mx-auto mb-6" />
          <h3 className="font-black text-3xl text-muted-foreground uppercase tracking-tighter">Catálogo Vazio</h3>
          <p className="text-xl text-muted-foreground mt-4 font-bold italic opacity-60 px-4">Adicione produtos ao seu estoque para começar a vender com estilo.</p>
        </div>
      )}

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-8 sm:p-12 border-8 shadow-2xl max-w-2xl mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl sm:text-5xl font-black tracking-tighter text-primary uppercase leading-none text-left px-2">Excluir permanentemente?</AlertDialogTitle>
            <AlertDialogDescription className="text-xl sm:text-2xl font-bold mt-6 leading-relaxed text-muted-foreground text-left">
              O produto <strong className="text-foreground border-b-4 border-primary px-1">{productToDelete?.name}</strong> será removido definitivamente do seu catálogo.
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
