"use client";

import React, { useState } from "react";
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
import { Search, Plus, Filter, Package, ShoppingBag, Edit3, Trash2 } from "lucide-react";
import Image from "next/image";

const mockProducts = [
  { id: "1", name: "Perfume Essencial Oud", brand: "Natura", category: "Perfumes", price: 219.90, stock: 4, img: "glam1" },
  { id: "2", name: "Batom Ultra Color", brand: "Avon", category: "Maquiagem", price: 29.90, stock: 15, img: "glam2" },
  { id: "3", name: "Creme de Mãos Castanha", brand: "Natura", category: "Corpo", price: 42.50, stock: 8, img: "glam3" },
  { id: "4", name: "Base Sérum Renew", brand: "Avon", category: "Maquiagem", price: 89.90, stock: 3, img: "glam4" },
  { id: "5", name: "Sabonete Líquido Erva Doce", brand: "Natura", category: "Banho", price: 34.90, stock: 12, img: "glam5" },
  { id: "6", name: "Máscara de Cílios No Limits", brand: "Avon", category: "Maquiagem", price: 45.90, stock: 6, img: "glam1" },
];

export default function ProdutosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeBrand, setActiveBrand] = useState<string | null>(null);

  const filteredProducts = mockProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = activeBrand ? p.brand === activeBrand : true;
    return matchesSearch && matchesBrand;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">Estoque & Catálogo</h1>
          <p className="text-muted-foreground mt-1">Organize seus produtos da Avon, Natura e outras marcas.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 size-4" />
          Novo Produto
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome do produto..."
            className="pl-10 h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeBrand === null ? "default" : "outline"}
            onClick={() => setActiveBrand(null)}
            className="h-10"
          >
            Todos
          </Button>
          <Button
            variant={activeBrand === "Natura" ? "default" : "outline"}
            onClick={() => setActiveBrand("Natura")}
            className="h-10"
          >
            Natura
          </Button>
          <Button
            variant={activeBrand === "Avon" ? "default" : "outline"}
            onClick={() => setActiveBrand("Avon")}
            className="h-10"
          >
            Avon
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="border-none shadow-sm group hover:shadow-md transition-all">
            <div className="relative aspect-square overflow-hidden bg-muted rounded-t-xl">
              <Image
                src={`https://picsum.photos/seed/${product.img}/400/400`}
                alt={product.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                data-ai-hint="beauty product"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge className={product.brand === "Natura" ? "bg-orange-500 hover:bg-orange-600 border-none" : "bg-blue-800 hover:bg-blue-900 border-none"}>
                  {product.brand}
                </Badge>
              </div>
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">{product.name}</CardTitle>
                  <CardDescription>{product.category}</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">R$ {product.price.toFixed(2)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="size-4" />
                <span>Estoque: <strong>{product.stock} un.</strong></span>
              </div>
            </CardContent>
            <CardFooter className="pt-0 flex gap-2">
              <Button variant="secondary" className="flex-1" size="sm">
                <Edit3 className="mr-2 size-3" />
                Editar
              </Button>
              <Button variant="ghost" className="text-destructive hover:bg-destructive/10" size="sm">
                <Trash2 className="size-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-24 bg-card rounded-xl border-dashed border-2">
          <ShoppingBag className="size-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-medium">Nenhum produto cadastrado</h3>
          <p className="text-muted-foreground">Adicione seu primeiro produto para começar as vendas.</p>
          <Button className="mt-6 bg-primary">Cadastrar Produto Agora</Button>
        </div>
      )}
    </div>
  );
}
