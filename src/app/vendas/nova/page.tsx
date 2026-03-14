
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
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
  ReceiptText,
  User,
  Package,
  CreditCard,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Smartphone,
  Banknote,
  HandCoins,
  CheckCircle2,
  Circle,
  ShoppingBag,
  DollarSign,
  Tag,
  MapPin,
  Map,
  Info,
  Hash,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function NovaVendaPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);

  // --- ESTADO DO CLIENTE ---
  const [clientData, setClientData] = useState({
    fullName: "",
    phone: "",
    city: "",
    neighborhood: "",
    address: "",
    notes: "",
  });

  // --- ESTADO DO PRODUTO ---
  const [productData, setProductData] = useState({
    name: "",
    brand: "",
    category: "",
    catalogPrice: "",
    costPrice: "",
    salePrice: "",
    productCode: "",
    description: "",
  });

  // --- ESTADO DO PAGAMENTO E TOTAIS ---
  const [paymentMethod, setPaymentMethod] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saleNotes, setSaleNotes] = useState("");
  const [discount, setDiscount] = useState(0);
  const [additionalFee, setAdditionalFee] = useState(0);

  // Busca categorias para o formulário de produto
  const categoriesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "categories");
  }, [db, user]);
  const { data: categories, isLoading: categoriesLoading } = useCollection(categoriesQuery);

  // Define data atual no fuso horário do Brasil
  useEffect(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    setDueDate(formatter.format(now));
  }, []);

  // --- MÁSCARAS E UTILITÁRIOS ---
  const formatPhone = (value: string) => {
    if (!value) return "";
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 2) return `(${cleaned}`;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  const maskCurrency = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    const number = parseFloat(digits) / 100;
    return number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const unmaskCurrency = (value: string) => {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
  };

  // Cálculo automático de custo do produto
  useEffect(() => {
    const catalog = unmaskCurrency(productData.catalogPrice);
    if (catalog === 0 || !productData.brand) return;

    let discountPct = 0;
    if (productData.brand === "VERDE (N)") discountPct = 0.30;
    else if (productData.brand === "ROSA (A)") discountPct = 0.35;
    else if (productData.brand === "MARROM (C&E)") discountPct = 0.15;

    if (discountPct > 0) {
      const calculatedCost = catalog * (1 - discountPct);
      setProductData(prev => ({
        ...prev,
        costPrice: maskCurrency((calculatedCost * 100).toFixed(0)),
      }));
    }
  }, [productData.brand, productData.catalogPrice]);

  // --- LOGICA DE TOTAIS ---
  const subtotal = useMemo(() => {
    return unmaskCurrency(productData.salePrice);
  }, [productData.salePrice]);

  const finalTotal = Math.max(0, subtotal - discount + additionalFee);

  const isReady = useMemo(() => {
    return (
      clientData.fullName &&
      clientData.phone &&
      productData.name &&
      productData.brand &&
      productData.salePrice &&
      paymentMethod
    );
  }, [clientData, productData, paymentMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !isReady) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Preencha os campos obrigatórios do cliente, produto e pagamento.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const clientId = `cli-${Date.now()}`;
      const productId = `prod-${Date.now()}`;
      const orderId = `ord-${Date.now()}`;

      // 1. Salvar Novo Cliente
      const finalClientData = {
        ...clientData,
        id: clientId,
        adminId: user.uid,
        registrationDate: new Date().toISOString(),
      };
      setDocumentNonBlocking(doc(db, "users", user.uid, "clients", clientId), finalClientData, { merge: true });

      // 2. Salvar Novo Produto
      const finalProductData = {
        ...productData,
        id: productId,
        adminId: user.uid,
        catalogPrice: unmaskCurrency(productData.catalogPrice),
        costPrice: unmaskCurrency(productData.costPrice),
        salePrice: unmaskCurrency(productData.salePrice),
      };
      setDocumentNonBlocking(doc(db, "users", user.uid, "products", productId), finalProductData, { merge: true });

      // 3. Salvar Pedido
      const orderData = {
        id: orderId,
        adminId: user.uid,
        clientId: clientId,
        clientName: clientData.fullName,
        orderDate: new Date().toISOString(),
        totalAmount: subtotal,
        discountAmount: discount,
        additionalFeeAmount: additionalFee,
        finalAmount: finalTotal,
        paymentMethod,
        paymentStatus: paymentMethod === "a prazo" ? "Pendente" : "Pago",
        dueDate: dueDate || null,
        notes: saleNotes,
        isDeleted: false,
      };
      setDocumentNonBlocking(doc(db, "users", user.uid, "orders", orderId), orderData, { merge: true });

      // 4. Salvar Item do Pedido
      const itemId = `item-${Date.now()}`;
      const itemData = {
        id: itemId,
        adminId: user.uid,
        orderId: orderId,
        productId: productId,
        productName: productData.name,
        quantity: 1,
        unitPrice: unmaskCurrency(productData.salePrice),
        subtotal: unmaskCurrency(productData.salePrice),
      };
      setDocumentNonBlocking(doc(db, "users", user.uid, "orders", orderId, "orderItems", itemId), itemData, { merge: true });

      toast({
        title: "Venda e Cadastros Concluídos!",
        description: `Cliente, Produto e Venda de R$ ${finalTotal.toFixed(2)} foram salvos.`,
      });
      
      router.push("/pedidos");
    } catch (error) {
      console.error("Erro na venda rápida:", error);
      toast({
        variant: "destructive",
        title: "Erro ao processar",
        description: "Ocorreu um problema ao salvar os dados da venda rápida.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10 w-full animate-in fade-in duration-500 pb-32">
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <ShoppingBag className="size-16 sm:size-24 text-primary" />
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-sm whitespace-nowrap px-2">NOVA VENDA</h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">Cadastre cliente, produto e venda de uma só vez.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        
        {/* 1. CADASTRO RÁPIDO DE CLIENTE */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/80 p-8 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-2xl sm:text-3xl font-black text-left px-2">
              <User className="size-8 text-primary" />
              1. Identificação da Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 sm:p-12 space-y-8">
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-4 text-left">
                <Label htmlFor="fullName" className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 size-6 text-muted-foreground/30 hidden sm:block" />
                  <Input
                    id="fullName"
                    placeholder="Ex: Maria Oliveira"
                    className="h-16 text-xl font-black rounded-xl border-4 border-muted focus:border-primary sm:pl-16"
                    value={clientData.fullName}
                    onChange={(e) => setClientData(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-4 text-left">
                <Label htmlFor="phone" className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">WhatsApp</Label>
                <div className="relative">
                  <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 size-6 text-muted-foreground/30 hidden sm:block" />
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    className="h-16 text-xl font-black rounded-xl border-4 border-muted focus:border-primary sm:pl-16"
                    value={clientData.phone}
                    onChange={(e) => setClientData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-4 text-left">
                <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Cidade</Label>
                <div className="relative">
                  <Map className="absolute left-5 top-1/2 -translate-y-1/2 size-6 text-muted-foreground/30 hidden sm:block" />
                  <Input
                    placeholder="Ex: São Paulo"
                    className="h-16 text-xl font-black rounded-xl border-4 border-muted sm:pl-16"
                    value={clientData.city}
                    onChange={(e) => setClientData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-4 text-left">
                <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Bairro</Label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 size-6 text-muted-foreground/30 hidden sm:block" />
                  <Input
                    placeholder="Ex: Centro"
                    className="h-16 text-xl font-black rounded-xl border-4 border-muted sm:pl-16"
                    value={clientData.neighborhood}
                    onChange={(e) => setClientData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 text-left">
              <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Endereço / Referência</Label>
              <Input
                placeholder="Ex: Rua das Flores, 123 - Próximo ao mercado"
                className="h-16 text-xl font-black rounded-xl border-4 border-muted"
                value={clientData.address}
                onChange={(e) => setClientData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. CADASTRO RÁPIDO DE PRODUTO */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/80 p-8 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-2xl sm:text-3xl font-black text-left px-2">
              <Package className="size-8 text-primary" />
              2. Detalhes do Produto Vendido
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 sm:p-12 space-y-10">
            <div className="space-y-4 text-left">
              <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Nome do Produto</Label>
              <Input
                placeholder="Ex: Perfume Kaiak 100ml"
                className="h-16 text-xl font-black rounded-xl border-4 border-muted"
                value={productData.name}
                onChange={(e) => setProductData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-4 text-left">
                <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Marca</Label>
                <Select onValueChange={(val) => setProductData(prev => ({ ...prev, brand: val }))} value={productData.brand}>
                  <SelectTrigger className="h-16 text-xl font-black rounded-xl border-4 border-muted">
                    <SelectValue placeholder="Selecione a marca..." />
                  </SelectTrigger>
                  <SelectContent className="font-bold">
                    <SelectItem value="VERDE (N)">VERDE (N)</SelectItem>
                    <SelectItem value="ROSA (A)">ROSA (A)</SelectItem>
                    <SelectItem value="MARROM (C&E)">MARROM (C&E)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4 text-left">
                <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Categoria</Label>
                <Select onValueChange={(val) => setProductData(prev => ({ ...prev, category: val }))} value={productData.category}>
                  <SelectTrigger className="h-16 text-xl font-black rounded-xl border-4 border-muted">
                    <SelectValue placeholder="Selecione a categoria..." />
                  </SelectTrigger>
                  <SelectContent className="font-bold">
                    {categories?.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-8">
              <div className="space-y-4 text-left">
                <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Preço Revista (R$)</Label>
                <Input
                  placeholder="0,00"
                  className="h-16 text-xl font-black rounded-xl border-4 border-muted"
                  value={productData.catalogPrice}
                  onChange={(e) => setProductData(prev => ({ ...prev, catalogPrice: maskCurrency(e.target.value) }))}
                />
              </div>
              <div className="space-y-4 text-left">
                <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Preço Custo (R$)</Label>
                <Input
                  placeholder="0,00"
                  className="h-16 text-xl font-black rounded-xl border-4 border-muted"
                  value={productData.costPrice}
                  onChange={(e) => setProductData(prev => ({ ...prev, costPrice: maskCurrency(e.target.value) }))}
                />
              </div>
              <div className="space-y-4 text-left">
                <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-primary block">Preço Venda (R$)</Label>
                <Input
                  placeholder="0,00"
                  className="h-16 text-xl font-black rounded-xl border-4 border-primary/30 bg-primary/5"
                  value={productData.salePrice}
                  onChange={(e) => setProductData(prev => ({ ...prev, salePrice: maskCurrency(e.target.value) }))}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. PAGAMENTO */}
        <Card className="border-none shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/90 p-8 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-2xl sm:text-3xl font-black text-left px-2">
              <CreditCard className="size-8 sm:size-10 text-primary" />
              3. Forma de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 sm:p-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { id: 'pix', label: 'Pix', icon: Smartphone },
                { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
                { id: 'cartao', label: 'Cartão', icon: CreditCard },
                { id: 'a prazo', label: 'A Prazo', icon: HandCoins },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPaymentMethod(option.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-2xl border-4 transition-all gap-3",
                    paymentMethod === option.id
                      ? "bg-primary text-white border-primary shadow-lg scale-105"
                      : "bg-background border-muted hover:border-primary/20 text-muted-foreground"
                  )}
                >
                  <option.icon className="size-8" />
                  <span className="text-xs sm:text-lg font-black uppercase">{option.label}</span>
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-4 text-left">
                <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Data de Vencimento</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-5 top-1/2 -translate-y-1/2 size-6 text-muted-foreground hidden sm:block" />
                  <Input 
                    type="date" 
                    className="h-16 text-xl font-black rounded-xl border-4 border-muted sm:pl-16 bg-background" 
                    value={dueDate} 
                    onChange={(e) => setDueDate(e.target.value)} 
                  />
                </div>
              </div>
              <div className="space-y-4 text-left">
                <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Notas da Venda</Label>
                <Input
                  placeholder="Observações internas..."
                  className="h-16 text-xl font-bold rounded-xl border-4 border-muted"
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. CHECK-IN DA VENDA */}
        <Card className="border-none shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden bg-slate-900 text-white">
          <CardHeader className="p-8 border-b border-white/10 bg-white/5">
            <CardTitle className="flex flex-row items-center gap-3 text-2xl sm:text-3xl font-black text-left px-2">
              <ShoppingBag className="size-8 text-[#39FF14]" />
              4. Check-in da Venda
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 sm:p-12 space-y-8">
            <div className="flex items-start gap-6">
              <div className={cn("size-10 rounded-full border-4 flex items-center justify-center shrink-0", clientData.fullName ? "bg-[#39FF14]/20 border-[#39FF14]" : "border-white/20")}>
                {clientData.fullName ? <CheckCircle2 className="size-6 text-[#39FF14]" /> : <Circle className="size-6 text-white/20" />}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#39FF14]">Cliente Selecionada</p>
                <p className="text-xl sm:text-3xl font-black italic">{clientData.fullName || "Aguardando preenchimento..."}</p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className={cn("size-10 rounded-full border-4 flex items-center justify-center shrink-0", productData.name ? "bg-[#39FF14]/20 border-[#39FF14]" : "border-white/20")}>
                {productData.name ? <CheckCircle2 className="size-6 text-[#39FF14]" /> : <Circle className="size-6 text-white/20" />}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#39FF14]">Item no Pedido</p>
                <p className="text-xl sm:text-3xl font-black italic">{productData.name || "Aguardando preenchimento..."}</p>
                {productData.salePrice && (
                  <p className="text-lg font-bold text-white/60">Valor: R$ {productData.salePrice}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className={cn("size-10 rounded-full border-4 flex items-center justify-center shrink-0", paymentMethod ? "bg-[#39FF14]/20 border-[#39FF14]" : "border-white/20")}>
                {paymentMethod ? <CheckCircle2 className="size-6 text-[#39FF14]" /> : <Circle className="size-6 text-white/20" />}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#39FF14]">Forma de Pagamento</p>
                <p className="text-xl sm:text-3xl font-black italic uppercase">{paymentMethod || "Aguardando..."}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. FINALIZAÇÃO */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden bg-primary text-primary-foreground">
          <CardHeader className="p-8 sm:p-12 pb-4 bg-white/10">
             <CardTitle className="flex flex-row items-center gap-4 text-3xl sm:text-5xl font-black tracking-tighter uppercase text-left px-2 italic">
              <DollarSign className="size-10" />
              5. Finalização
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 sm:p-12 pt-4 space-y-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
               <div className="space-y-8">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-xs font-black uppercase tracking-widest opacity-60">Subtotal</span>
                    <span className="text-xl sm:text-2xl font-black">R$ {subtotal.toFixed(2)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3 text-left">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 block">Desconto (R$)</Label>
                      <Input
                        type="number"
                        className="h-14 text-center text-xl font-black rounded-xl border-4 bg-white/10 border-white/20 text-white"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-3 text-left">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 block">Taxas (R$)</Label>
                      <Input
                        type="number"
                        className="h-14 text-center text-xl font-black rounded-xl border-4 bg-white/10 border-white/20 text-white"
                        value={additionalFee}
                        onChange={(e) => setAdditionalFee(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
               </div>

               <div className="p-10 rounded-[2rem] shadow-2xl text-center border-8 bg-white text-primary border-white animate-in zoom-in-95 duration-500">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-60">Total Final Recebido</p>
                  <p className="text-5xl sm:text-8xl font-black tracking-tighter leading-none px-2 italic">R$ {finalTotal.toFixed(2)}</p>
                </div>
            </div>
          </CardContent>
          <CardFooter className="p-8 sm:p-12 pt-0">
             <Button 
              type="submit" 
              size="lg"
              className={cn(
                "w-full h-24 sm:h-32 text-xl sm:text-4xl font-black rounded-2xl sm:rounded-[3rem] shadow-2xl transition-all active:scale-95 uppercase tracking-widest bg-white text-primary hover:bg-white/90",
                (!isReady || isLoading) && "opacity-50 cursor-not-allowed"
              )}
              disabled={!isReady || isLoading}
            >
              {isLoading ? (
                <ReceiptText className="animate-spin size-12" />
              ) : (
                <>
                  <CheckCircle2 className="mr-4 size-10" />
                  CONCLUIR VENDA
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
