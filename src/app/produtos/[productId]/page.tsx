
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  Tag,
  DollarSign,
  Hash,
  Info,
  ArrowLeft,
  Loader2,
  Edit,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function DetalhesProdutoPage() {
  const { productId } = useParams();
  const { user } = useUser();
  const db = useFirestore();

  const productRef = useMemoFirebase(() => {
    if (!db || !user || !productId) return null;
    return doc(db, "users", user.uid, "products", productId as string);
  }, [db, user, productId]);

  const { data: product, isLoading } = useDoc(productRef);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-muted-foreground">
        <Loader2 className="size-16 animate-spin text-primary" />
        <p className="text-2xl font-black animate-pulse uppercase tracking-widest text-center">Sincronizando item elite...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-muted p-8 rounded-full mb-6">
          <Package className="size-24 text-muted-foreground/40" />
        </div>
        <h2 className="text-4xl font-black text-primary uppercase tracking-tighter px-2">Ops! Produto não encontrado</h2>
        <p className="text-xl text-muted-foreground mt-4 font-bold opacity-60">Este registro pode ter sido excluído ou movido.</p>
        <Button asChild className="mt-10 h-16 px-10 text-xl font-black rounded-2xl shadow-xl bg-primary" variant="default">
          <Link href="/produtos">Voltar para o catálogo</Link>
        </Button>
      </div>
    );
  }

  const getBrandBadgeColor = (brand: string) => {
    if (brand === "VERDE (N)") return "bg-green-600 text-white";
    if (brand === "ROSA (A)") return "bg-primary text-white";
    if (brand === "MARROM (C&E)") return "bg-amber-900 text-white";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 w-full pb-20">
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <Package className="size-16 sm:size-24 text-primary" />
            <h1 className="text-5xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap px-2">
              FICHA TÉCNICA
            </h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">Informações detalhadas do produto</p>
        </div>
      </div>

      <div className="flex flex-col items-center text-center mb-10 px-4">
        <div className="flex items-center gap-3 mb-4">
          <Badge className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest ${getBrandBadgeColor(product.brand)}`}>
            {product.brand}
          </Badge>
          <Badge variant="outline" className="px-4 py-1.5 rounded-full font-black text-[10px] border-2 uppercase tracking-widest">
            {product.category}
          </Badge>
        </div>
        <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-foreground font-headline uppercase leading-tight italic drop-shadow-sm max-w-5xl px-2">
          {product.name}
        </h2>
        <p className="mt-4 text-muted-foreground font-black uppercase tracking-[0.2em] text-sm">
          CÓDIGO: {product.productCode || "NÃO CADASTRADO"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Coluna 1: Preço de Venda em Destaque */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-primary text-primary-foreground">
            <CardHeader className="bg-white/10 p-8 border-b border-white/10">
              <CardTitle className="flex flex-row items-center gap-3 text-xl font-black px-2 uppercase tracking-widest italic">
                <ShoppingBag className="size-7" />
                VALOR DE VENDA
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Preço Final Revendedora</p>
              <div className="flex flex-col items-center gap-2">
                <span className="text-xl font-bold opacity-40">R$</span>
                <span className="text-6xl sm:text-8xl font-black tracking-tighter leading-none px-2">
                  {Number(product.salePrice).toFixed(2).replace(".", ",")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Outros Preços */}
          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-background">
            <CardHeader className="bg-muted/80 p-8 border-b-2">
              <CardTitle className="flex flex-row items-center gap-3 text-xl font-black px-2 uppercase tracking-widest">
                <DollarSign className="size-7 text-primary" />
                CUSTOS & REVISTA
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex justify-between items-center p-6 rounded-2xl bg-muted/20 border-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Preço de Revista</p>
                  <p className="text-2xl font-black text-foreground">R$ {Number(product.catalogPrice).toFixed(2).replace(".", ",")}</p>
                </div>
                <Tag className="size-8 text-muted-foreground/30" />
              </div>
              <div className="flex justify-between items-center p-6 rounded-2xl bg-green-50 border-2 border-green-100">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-600/60">Preço de Custo</p>
                  <p className="text-2xl font-black text-green-700">R$ {Number(product.costPrice).toFixed(2).replace(".", ",")}</p>
                </div>
                <Badge className="bg-green-600 text-white font-black">LUCRO ESTIMADO</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2: Descrição e Detalhes */}
        <div className="lg:col-span-7 space-y-8">
          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-background">
            <CardHeader className="bg-muted/80 p-8 border-b-2">
              <CardTitle className="flex flex-row items-center gap-3 text-xl font-black text-left px-2 uppercase tracking-widest">
                <Info className="size-7 text-primary" />
                SOBRE O PRODUTO
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="bg-muted/10 p-8 rounded-3xl shadow-inner border-4 border-dashed border-muted text-left min-h-[300px]">
                {product.description ? (
                  <p className="text-xl sm:text-2xl font-medium text-foreground italic leading-relaxed whitespace-pre-wrap opacity-80">
                    {product.description}
                  </p>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4 opacity-20 py-20">
                    <Info className="size-16" />
                    <p className="text-2xl font-black uppercase tracking-widest text-center">Nenhuma descrição cadastrada.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <Button
          asChild
          variant="outline"
          className="h-20 px-10 text-xl font-black rounded-3xl border-4 border-muted hover:bg-muted/50 transition-all flex-1 shadow-lg"
        >
          <Link href="/produtos">
            <ArrowLeft className="mr-3 size-6" />
            VOLTAR AO CATÁLOGO
          </Link>
        </Button>
        <Button
          asChild
          className="h-20 px-10 text-xl font-black rounded-3xl bg-primary text-white hover:bg-primary/90 transition-all flex-1 shadow-2xl"
        >
          <Link href={`/produtos/${productId}/editar`}>
            <Edit className="mr-3 size-6" />
            EDITAR PRODUTO
          </Link>
        </Button>
      </div>
    </div>
  );
}
