
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
  UserPlus,
  User,
  Phone,
  MapPin,
  Map,
  Info,
  Save,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useRouter } from "next/navigation";

export default function NovoClientePage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    city: "",
    neighborhood: "",
    address: "",
    notes: "",
  });

  const formatPhone = (value: string) => {
    if (!value) return "";
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 2) return `(${cleaned}`;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, [name]: formatPhone(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    if (!formData.fullName || !formData.phone) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha pelo menos o nome e o WhatsApp.",
      });
      return;
    }

    setIsLoading(true);

    const clientId = `cli-${Date.now()}`;
    const clientData = {
      ...formData,
      id: clientId,
      adminId: user.uid,
      registrationDate: new Date().toISOString(),
    };

    try {
      addDocumentNonBlocking(collection(db, "users", user.uid, "clients"), clientData);
      
      toast({
        title: "Cliente cadastrada!",
        description: `${formData.fullName} foi adicionada ao seu catálogo.`,
      });
      
      router.push("/clientes");
    } catch (error) {
      console.error("Error adding client:", error);
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: "Ocorreu um problema ao salvar os dados da cliente.",
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
            <UserPlus className="size-16 sm:size-24 text-primary" />
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap">NOVO CLIENTE</h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest">ADICIONE UM NOVO CLIENTE AO SEU CATÁLOGO</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/30 p-8 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-2xl sm:text-3xl font-black">
              <User className="size-8 text-primary" />
              Identificação & Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 sm:p-12 space-y-8">
            <div className="space-y-4">
              <Label htmlFor="fullName" className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 size-6 text-muted-foreground/30 hidden sm:block" />
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Ex: Maria Oliveira"
                  className="h-16 sm:h-20 sm:pl-16 text-xl sm:text-3xl font-black rounded-xl sm:rounded-3xl border-4 border-muted bg-background focus:border-primary transition-all placeholder:text-muted-foreground/40"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="phone" className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">WhatsApp / Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 size-6 text-muted-foreground/30 hidden sm:block" />
                <Input
                  id="phone"
                  name="phone"
                  maxLength={15}
                  placeholder="(00) 00000-0000"
                  className="h-16 sm:h-20 sm:pl-16 text-xl sm:text-3xl font-black rounded-xl sm:rounded-3xl border-4 border-muted bg-background focus:border-primary transition-all placeholder:text-muted-foreground/40"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/30 p-8 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-2xl sm:text-3xl font-black">
              <MapPin className="size-8 text-primary" />
              Localização & Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 sm:p-12 space-y-8">
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label htmlFor="city" className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Cidade</Label>
                <div className="relative">
                  <Map className="absolute left-5 top-1/2 -translate-y-1/2 size-6 text-muted-foreground/30 hidden sm:block" />
                  <Input
                    id="city"
                    name="city"
                    placeholder="Ex: São Paulo"
                    className="h-16 sm:h-20 sm:pl-16 text-xl sm:text-2xl font-black rounded-xl sm:rounded-3xl border-4 border-muted bg-background focus:border-primary transition-all placeholder:text-muted-foreground/40"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="neighborhood" className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Bairro</Label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 size-6 text-muted-foreground/30 hidden sm:block" />
                  <Input
                    id="neighborhood"
                    name="neighborhood"
                    placeholder="Ex: Centro"
                    className="h-16 sm:h-20 sm:pl-16 text-xl sm:text-2xl font-black rounded-xl sm:rounded-3xl border-4 border-muted bg-background focus:border-primary transition-all placeholder:text-muted-foreground/40"
                    value={formData.neighborhood}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="address" className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Referência / Endereço</Label>
              <div className="relative">
                <Info className="absolute left-5 top-1/2 -translate-y-1/2 size-6 text-muted-foreground/30 hidden sm:block" />
                <Input
                  id="address"
                  name="address"
                  placeholder="Ex: Próximo à padaria central"
                  className="h-16 sm:h-20 sm:pl-16 text-xl sm:text-2xl font-black rounded-xl sm:rounded-3xl border-4 border-muted bg-background focus:border-primary transition-all placeholder:text-muted-foreground/40"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/30 p-8 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-2xl sm:text-3xl font-black">
              <Info className="size-8 text-primary" />
              Observações & Descrição
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 sm:p-12">
            <div className="space-y-4">
              <Label htmlFor="notes" className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Notas Importantes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Preferências, horários de entrega ou detalhes especiais..."
                className="min-h-[200px] text-xl sm:text-2xl font-bold rounded-[1.5rem] sm:rounded-[2.5rem] border-4 border-muted bg-background p-8 focus:border-primary transition-all shadow-inner placeholder:text-muted-foreground/40"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        <div className="p-4 sm:p-0">
          <Button 
            type="submit" 
            size="lg"
            className="w-full h-24 sm:h-32 text-2xl sm:text-4xl font-black rounded-[1.5rem] sm:rounded-[3rem] bg-primary text-white hover:bg-primary/90 shadow-2xl transition-all active:scale-95 uppercase tracking-widest gap-6"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="size-10 sm:size-14 animate-spin" />
            ) : (
              <>
                <Save className="size-10 sm:size-14" />
                SALVAR CLIENTE
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
