
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Save,
  Loader2,
  Tag,
  ShoppingBag,
  DollarSign,
  Hash,
  Info,
  Plus,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NovoProdutoPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "",
    catalogPrice: "",
    costPrice: "",
    salePrice: "",
    productCode: "",
    description: "",
  });

  const categoriesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "categories");
  }, [db, user]);

  const { data: categories, isLoading: categoriesLoading } = useCollection(categoriesQuery);

  // Lógica de cálculo automático baseada na marca e preço de revista
  useEffect(() => {
    const catalog = parseFloat(formData.catalogPrice);
    if (isNaN(catalog) || !formData.brand) return;

    let discount = 0;
    if (formData.brand === "VERDE (N)") discount = 0.30;
    else if (formData.brand === "ROSA (A)") discount = 0.35;
    else if (formData.brand === "MARROM (C&E)") discount = 0.15;

    if (discount > 0) {
      const calculatedCost = catalog * (1 - discount);
      setFormData(prev => ({
        ...prev,
        costPrice: calculatedCost.toFixed(2),
        // Por padrão, o preço de venda sugerido é o preço de revista
        salePrice: catalog.toFixed(2)
      }));
    }
  }, [formData.brand, formData.catalogPrice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    if (!formData.name || !formData.brand || !formData.salePrice) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha o nome, marca e preço final.",
      });
      return;
    }

    setIsLoading(true);

    const productId = `prod-${Date.now()}`;
    const productData = {
      ...formData,
      id: productId,
      adminId: user.uid,
      catalogPrice: Number(formData.catalogPrice) || 0,
      costPrice: Number(formData.costPrice) || 0,
      salePrice: Number(formData.salePrice) || 0,
      imageUrl: `https://picsum.photos/seed/${productId}/500/500`,
    };

    try {
      addDocumentNonBlocking(collection(db, "users", user.uid, "products"), productData);
      
      toast({
        title: "Produto cadastrado!",
        description: `${formData.name} agora faz parte do seu estoque.`,
      });
      
      router.push("/produtos");
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Ocorreu um problema ao cadastrar o produto.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 w-full pb-20">
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <Package className="size-16 sm:size-24 text-primary" />
            <h1 className="text-5xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap px-2">NOVO PRODUTO</h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">ADICIONE UM NOVO ITEM AO SEU CATÁLOGO ELITE</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/30 p-6 sm:p-8 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-xl sm:text-3xl font-black text-left px-2 whitespace-nowrap">
              <Tag className="size-6 sm:size-8 text-primary shrink-0" />
              Identificação & Marca
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 sm:p-12 space-y-10">
            <div className="space-y-4 text-left">
              <Label htmlFor="name" className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Nome do Produto</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ex: Kaiak Oceano Masculino 100ml"
                className="h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-xl sm:rounded-3xl border-4 border-muted bg-background focus:border-primary transition-all placeholder:text-muted-foreground/40"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-4 text-left">
                <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Marca do Produto</Label>
                <Select onValueChange={(val) => setFormData(prev => ({ ...prev, brand: val }))} value={formData.brand}>
                  <SelectTrigger className="h-16 sm:h-20 text-lg sm:text-xl font-black rounded-xl sm:rounded-3xl border-4 border-muted bg-background">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-2xl border-2">
                    <SelectItem value="VERDE (N)" className="font-bold">VERDE (N)</SelectItem>
                    <SelectItem value="ROSA (A)" className="font-bold">ROSA (A)</SelectItem>
                    <SelectItem value="MARROM (C&E)" className="font-bold">MARROM (C&E)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 text-left">
                <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Categoria</Label>
                <div className="flex gap-2">
                  <Select onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))} value={formData.category}>
                    <SelectTrigger className="h-16 sm:h-20 text-lg sm:text-xl font-black rounded-xl sm:rounded-3xl border-4 border-muted bg-background flex-1">
                      <SelectValue placeholder={categoriesLoading ? "Carregando..." : "Selecione..."} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl shadow-2xl border-2">
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name} className="font-bold">{cat.name}</SelectItem>
                      ))}
                      {!categoriesLoading && categories?.length === 0 && (
                         <div className="p-4 text-center text-xs font-bold text-muted-foreground">Nenhuma categoria encontrada</div>
                      )}
                    </SelectContent>
                  </Select>
                  <Button asChild variant="outline" className="h-16 sm:h-20 w-16 sm:w-20 rounded-xl sm:rounded-3xl border-4 border-muted text-primary hover:bg-primary/5">
                    <Link href="/categorias/novo"><Plus className="size-8" /></Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/30 p-6 sm:p-8 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-xl sm:text-3xl font-black text-left px-2 whitespace-nowrap">
              <DollarSign className="size-6 sm:size-8 text-primary shrink-0" />
              Preços & Referência
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 sm:p-12 space-y-10">
            <div className="grid sm:grid-cols-3 gap-8">
              <div className="space-y-4 text-left">
                <Label htmlFor="catalogPrice" className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Preço de Revista (R$)</Label>
                <div className="relative">
                  <Input
                    id="catalogPrice"
                    name="catalogPrice"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="h-16 text-xl font-black rounded-xl border-4 border-muted bg-background focus:border-primary"
                    value={formData.catalogPrice}
                    onChange={handleChange}
                  />
                  {formData.brand && (
                    <div className="absolute -top-3 right-4 bg-primary text-white text-[8px] font-black px-2 py-1 rounded-full animate-in zoom-in">
                      CÁLCULO AUTO ATIVO
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4 text-left">
                <Label htmlFor="costPrice" className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Preço de Custo (R$)</Label>
                <Input
                  id="costPrice"
                  name="costPrice"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  className="h-16 text-xl font-black rounded-xl border-4 border-muted bg-background"
                  value={formData.costPrice}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-4 text-left">
                <Label htmlFor="salePrice" className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-primary block flex items-center gap-2">
                  <ShoppingBag className="size-3" /> Preço Revendedora (Final)
                </Label>
                <Input
                  id="salePrice"
                  name="salePrice"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  className="h-16 text-xl font-black rounded-xl border-4 border-primary/20 bg-primary/5 focus:border-primary"
                  value={formData.salePrice}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-4 text-left">
              <Label htmlFor="productCode" className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Código de Referência / SKU</Label>
              <div className="relative">
                <Hash className="absolute left-5 top-1/2 -translate-y-1/2 size-6 text-muted-foreground/30 hidden sm:block" />
                <Input
                  id="productCode"
                  name="productCode"
                  placeholder="Ex: 54321"
                  className="h-16 sm:h-20 sm:pl-16 text-xl sm:text-2xl font-black rounded-xl sm:rounded-3xl border-4 border-muted bg-background"
                  value={formData.productCode}
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/30 p-6 sm:p-8 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-xl sm:text-3xl font-black text-left px-2 whitespace-nowrap">
              <Info className="size-6 sm:size-8 text-primary shrink-0" />
              Descrição & Notas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 sm:p-12 text-left">
            <div className="space-y-4">
              <Label htmlFor="description" className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Descrição do Produto</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Detalhes sobre fragrância, validade, benefícios..."
                className="min-h-[200px] text-lg sm:text-2xl font-bold rounded-[1.5rem] sm:rounded-[2.5rem] border-4 border-muted bg-background p-8 focus:border-primary transition-all shadow-inner placeholder:text-muted-foreground/40"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        <div className="p-4 sm:p-0">
          <Button 
            type="submit" 
            size="lg"
            className="w-full h-24 sm:h-32 text-lg sm:text-4xl font-black rounded-[1.5rem] sm:rounded-[3rem] bg-primary text-white hover:bg-primary/90 shadow-2xl transition-all active:scale-95 uppercase tracking-widest gap-6"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="size-10 sm:size-14 animate-spin" />
            ) : (
              <>
                <Save className="size-10 sm:size-14" />
                SALVAR PRODUTO
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
