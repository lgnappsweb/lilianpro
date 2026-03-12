
"use client";

import React, { useState } from "react";
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
  Tag,
  Save,
  Loader2,
  Info,
  Type,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const SUGESTOES_CATEGORIAS = {
  "VERDE (N)": [
    "Perfumaria Feminina", "Perfumaria Masculina", "Perfumaria Unissex",
    "Corpo e Banho (Tododia)", "Rosto (Chronos)", "Maquiagem (Una)", 
    "Maquiagem (Faces)", "Cabelos (Lumina)", "Cabelos (Plant)",
    "Mamãe e Bebê", "Naturé (Infantil)", "Sabonetes", "Desodorantes", 
    "Óleos (Sève)", "Ekos (Corpo)", "Ekos (Mãos e Pés)", "Ekos (Banho)",
    "Homen (Barba e Bigode)", "Homen (Cuidados)", "Kits & Presentes", 
    "Refis", "Crer Para Ver", "Acessórios Natura", "Proteção Solar (Fotoequilíbrio)"
  ],
  "ROSA (A)": [
    "Perfumaria Feminina", "Perfumaria Masculina", "Maquiagem (Color Trend)", 
    "Maquiagem (Avon True)", "Maquiagem (Power Stay)", "Maquiagem (Olhos)",
    "Maquiagem (Lábios)", "Maquiagem (Rosto)", "Esmaltes e Unhas",
    "Rosto (Renew Anti-idade)", "Renew (Limpeza Facial)", "Renew (Olhos)",
    "Cuidados Diários (Care)", "Corpo (Encanto)", "Cabelos (Advance Techniques)", 
    "Higiene Íntima", "Proteção Solar (Sun+)", "Desodorantes Roll-on",
    "Desodorantes Aerossol", "Kits de Presente Avon", "Acessórios de Beleza",
    "Bijuterias e Folheados", "Moda & Casa (Avon)"
  ],
  "MARROM (C&E)": [
    "Cozinha e Utensílios", "Potes e Vasilhas", "Panelas e Frigideiras",
    "Mesa Posta (Toalhas e Sousplat)", "Cama (Jogos de Lençol)", "Cama (Edredons e Mantas)",
    "Banho (Toalhas e Roupões)", "Organização Doméstica", "Decoração de Interiores",
    "Moda (Lingerie)", "Moda (Pijamas e Camisolas)", "Moda (Fitness)",
    "Calçados e Chinelos", "Relógios e Óculos", "Semijoias",
    "Infantil (Brinquedos)", "Infantil (Escolar)", "Papelaria e Livros",
    "Eletrônicos (Beleza e Saúde)", "Bem-estar e Saúde", "Utilidades Domésticas",
    "Limpeza Prática", "Ferramentas e Jardinagem"
  ]
};

export default function NovaCategoriaPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectSuggestion = (name: string) => {
    setFormData((prev) => ({ ...prev, name }));
    setIsSuggestionsOpen(false);
    toast({
      title: "Sugestão aplicada!",
      description: `Categoria definida como: ${name}`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    if (!formData.name) {
      toast({
        variant: "destructive",
        title: "Campo obrigatório",
        description: "Por favor, informe o nome da categoria.",
      });
      return;
    }

    setIsLoading(true);

    const categoryId = `cat-${Date.now()}`;
    const categoryData = {
      ...formData,
      id: categoryId,
      adminId: user.uid,
    };

    try {
      addDocumentNonBlocking(collection(db, "users", user.uid, "categories"), categoryData);
      
      toast({
        title: "Categoria criada!",
        description: `${formData.name} foi adicionada à sua lista.`,
      });
      
      router.push("/categorias");
    } catch (error) {
      console.error("Error adding category:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar",
        description: "Ocorreu um problema ao salvar a categoria.",
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
            <Tag className="size-16 sm:size-24 text-primary" />
            <h1 className="text-[2.6rem] sm:text-5xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap px-2">NOVA CATEGORIA</h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">ORGANIZE SEU CATÁLOGO COM NOVOS NICHOS</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/30 p-8 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-2xl sm:text-3xl font-black text-left px-2">
              <Type className="size-8 text-primary" />
              Dados da Categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 sm:p-12 space-y-10">
            <div className="space-y-6 text-left">
              <div className="space-y-4">
                <Label htmlFor="name" className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Nome da Categoria</Label>
                <div className="relative">
                  <Tag className="absolute left-5 top-1/2 -translate-y-1/2 size-6 text-muted-foreground/30 hidden sm:block" />
                  <Input
                    id="name"
                    name="name"
                    placeholder="Ex: Perfumaria, Maquiagem, Hidratantes"
                    className="h-16 sm:h-20 sm:pl-16 text-xl sm:text-3xl font-black rounded-xl sm:rounded-3xl border-4 border-muted bg-background focus:border-primary transition-all placeholder:text-muted-foreground/40"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Menu Expansivo de Sugestões */}
              <Collapsible
                open={isSuggestionsOpen}
                onOpenChange={setIsSuggestionsOpen}
                className="w-full space-y-4"
              >
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="outline" 
                    type="button"
                    className="w-full h-12 sm:h-14 rounded-2xl border-2 border-primary/20 bg-primary/5 text-primary font-black uppercase tracking-widest flex items-center justify-between px-6 hover:bg-primary/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="size-5" />
                      Sugestões Elite
                    </div>
                    <ChevronDown className={cn("size-6 transition-transform duration-300", isSuggestionsOpen && "rotate-180")} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-8 animate-in slide-in-from-top-4 duration-300 overflow-hidden">
                  {Object.entries(SUGESTOES_CATEGORIAS).map(([brand, categories]) => (
                    <div key={brand} className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 border-b-2 border-primary/10 pb-2">{brand}</h4>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                          <Button
                            key={cat}
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="rounded-full font-bold text-xs px-4 h-8 bg-muted hover:bg-primary hover:text-white transition-colors"
                            onClick={() => selectSuggestion(cat)}
                          >
                            {cat}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </div>

            <div className="space-y-4 text-left">
              <Label htmlFor="description" className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Descrição Curta</Label>
              <div className="relative">
                <Info className="absolute left-5 top-8 size-6 text-muted-foreground/30 hidden sm:block" />
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Explique o que compõe este nicho..."
                  className="min-h-[150px] sm:pl-16 text-xl sm:text-2xl font-bold rounded-xl sm:rounded-3xl border-4 border-muted bg-background p-8 focus:border-primary transition-all shadow-inner placeholder:text-muted-foreground/40"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
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
                SALVAR CATEGORIA
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
