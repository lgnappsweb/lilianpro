
"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Package, ShoppingBag, Edit3, Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

export default function ProdutosPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeBrand, setActiveBrand] = useState<string | null>(null);

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

  const handleDelete = (product: any) => {
    if (user && db) {
      const docRef = doc(db, "users", user.uid, "products", product.id);
      deleteDocumentNonBlocking(docRef);
      toast({
        title: "Produto removido",
        description: `${product.name} foi excluído do seu catálogo.`,
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <Package className="size-16 sm:size-24 text-primary" />
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl">PRODUTOS</h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest">Organize seus produtos da Avon, Natura e outras marcas.</p>
        </div>
        <Button className="w-full h-14 sm:h-20 px-10 text-xl font-black rounded-2xl shadow-xl bg-primary hover:bg-primary/90 transition-transform hover:scale-105">
          <Plus className="mr-3 size-6 sm:size-8" />
          Novo Produto
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome do produto..."
            className="pl-12 h-14 text-lg bg-background rounded-2xl shadow-inner border-muted focus-visible:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <Button
            variant={activeBrand === null ? "default" : "outline"}
            onClick={() => setActiveBrand(null)}
            className={`h-14 px-6 text-base font-bold rounded-2xl ${activeBrand === null ? "shadow-lg" : "border-muted"}`}
          >
            Todos
          </Button>
          <Button
            variant={activeBrand === "Natura" ? "default" : "outline"}
            onClick={() => setActiveBrand("Natura")}
            className={`h-14 px-6 text-base font-bold rounded-2xl ${activeBrand === "Natura" ? "bg-orange-600 hover:bg-orange-700 shadow-lg border-none" : "border-muted"}`}
          >
            Natura
          </Button>
          <Button
            variant={activeBrand === "Avon" ? "default" : "outline"}
            onClick={() => setActiveBrand("Avon")}
            className={`h-14 px-6 text-base font-bold rounded-2xl ${activeBrand === "Avon" ? "bg-blue-800 hover:bg-blue-900 shadow-lg border-none" : "border-muted"}`}
          >
            Avon
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground">
          <Loader2 className="size-16 animate-spin text-primary" />
          <p className="text-xl font-medium animate-pulse">Carregando seu catálogo...</p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="border-none shadow-md group hover:shadow-2xl transition-all rounded-3xl overflow-hidden border-b-4 border-b-primary/20">
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={product.imageUrl || `https://picsum.photos/seed/${product.id}/500/500`}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  data-ai-hint="beauty product"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className={`text-xs font-black px-4 py-1.5 rounded-xl shadow-lg border-none ${product.brand === "Natura" ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-800 hover:bg-blue-900"}`}>
                    {product.brand}
                  </Badge>
                </div>
              </div>
              <CardHeader className="pb-3 pt-6 px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-black leading-tight group-hover:text-primary transition-colors line-clamp-2">{product.name}</CardTitle>
                    <CardDescription className="text-sm font-bold uppercase tracking-wider text-primary/60">{product.category}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-6 px-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-black text-primary">R$ {Number(product.salePrice).toFixed(2)}</p>
                  <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-xl">
                    <Package className="size-4" />
                    <span>COD: {product.productCode}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 px-6 pb-6 flex gap-3">
                <Button variant="secondary" className="flex-1 h-12 text-base font-bold rounded-2xl shadow-sm border border-border/50" size="sm">
                  <Edit3 className="mr-2 size-4" />
                  Editar
                </Button>
                <Button 
                  variant="ghost" 
                  className="size-12 rounded-2xl text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20" 
                  size="icon"
                  onClick={() => handleDelete(product)}
                >
                  <Trash2 className="size-6" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredProducts.length === 0 && (
        <div className="text-center py-32 bg-muted/10 rounded-3xl border-2 border-dashed border-muted">
          <ShoppingBag className="size-20 text-muted-foreground/30 mx-auto mb-6" />
          <h3 className="text-2xl font-black text-foreground">Nenhum produto encontrado</h3>
          <p className="text-lg text-muted-foreground mt-2 font-medium">Adicione produtos ao seu estoque para começar as vendas.</p>
        </div>
      )}
    </div>
  );
}
