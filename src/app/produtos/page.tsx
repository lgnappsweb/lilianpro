
"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Package, 
  ShoppingBag, 
  Edit3, 
  Trash2, 
  Loader2,
  MoreVertical,
  Edit
} from "lucide-react";
import Image from "next/image";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
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
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 w-full">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="border-none shadow-md group hover:shadow-2xl transition-all rounded-[2rem] overflow-hidden border-b-8 border-b-primary/10 relative">
              <div className="absolute top-4 right-4 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="size-10 sm:size-12 rounded-2xl shadow-xl bg-white/80 backdrop-blur-sm hover:bg-white transition-all">
                      <MoreVertical className="size-6 text-primary" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-2">
                    <DropdownMenuItem asChild className="p-3 rounded-xl text-sm font-black cursor-pointer hover:bg-primary/5">
                      <Link href={`/produtos/${product.id}/editar`}>
                        <Edit className="mr-3 size-4" />
                        EDITAR PRODUTO
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="p-3 rounded-xl text-sm font-black cursor-pointer text-destructive hover:bg-destructive/5" 
                      onSelect={() => setProductToDelete(product)}
                    >
                      <Trash2 className="mr-3 size-4" />
                      EXCLUIR PRODUTO
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={product.imageUrl || `https://picsum.photos/seed/${product.id}/500/500`}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  data-ai-hint="beauty product"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className={`text-[10px] font-black px-4 py-1.5 rounded-xl shadow-lg border-none text-white ${getBrandBadgeColor(product.brand)}`}>
                    {product.brand}
                  </Badge>
                </div>
              </div>
              <CardHeader className="pb-3 pt-8 px-8 text-left">
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-black leading-tight group-hover:text-primary transition-colors line-clamp-2 px-2 italic uppercase tracking-tighter">
                    {product.name}
                  </CardTitle>
                  <CardDescription className="text-xs font-black uppercase tracking-widest text-primary/60 px-2">
                    {product.category}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pb-10 px-8 space-y-6">
                <div className="flex items-center justify-between border-t-2 pt-6">
                  <p className="text-3xl font-black text-primary tracking-tighter px-2">R$ {Number(product.salePrice).toFixed(2)}</p>
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-xl uppercase tracking-tighter">
                    <Package className="size-3" />
                    <span>COD: {product.productCode}</span>
                  </div>
                </div>
              </CardContent>
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
