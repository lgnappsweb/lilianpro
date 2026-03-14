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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingBag,
  User,
  Package,
  CreditCard,
  Calendar as CalendarIcon,
  Smartphone,
  Banknote,
  HandCoins,
  CheckCircle2,
  Circle,
  DollarSign,
  ReceiptText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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
    <div className="space-y-4 w-full animate-in fade-in duration-500 pb-32 max-w-full">
      <div className="flex flex-col items-center text-center gap-2 px-2 mb-4">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-2">
            <ShoppingBag className="size-10 sm:size-16 text-primary" />
            <h1 className="text-3xl sm:text-6xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-sm whitespace-nowrap px-2">NOVA VENDA</h1>
          </div>
          <p className="text-[10px] sm:text-sm text-muted-foreground mt-1 font-bold opacity-60 uppercase tracking-widest text-center">Cadastre cliente, produto e venda de uma só vez.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        {/* 1. CADASTRO RÁPIDO DE CLIENTE */}
        <Card className="border-none shadow-2xl rounded-[1rem] sm:rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-muted/80 p-3 sm:p-4 border-b-2">
            <CardTitle className="flex flex-row items-center gap-2 text-lg sm:text-2xl font-black text-left uppercase">
              <User className="size-5 sm:size-6 text-primary" />
              1. Identificação da Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-1 sm:p-2 space-y-2">
            <div className="grid sm:grid-cols-2 gap-1.5">
              <div className="space-y-0.5 text-left">
                <Label htmlFor="fullName" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Nome Completo</Label>
                <Input
                  id="fullName"
                  placeholder="Nome da cliente..."
                  className="h-14 sm:h-16 text-lg sm:text-xl font-black rounded-lg border-2 border-muted focus:border-primary w-full"
                  value={clientData.fullName}
                  onChange={(e) => setClientData(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-0.5 text-left">
                <Label htmlFor="phone" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">WhatsApp</Label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  className="h-14 sm:h-16 text-lg sm:text-xl font-black rounded-lg border-2 border-muted focus:border-primary w-full"
                  value={clientData.phone}
                  onChange={(e) => setClientData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-1.5">
              <div className="space-y-0.5 text-left">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Cidade</Label>
                <Input
                  placeholder="Cidade..."
                  className="h-14 sm:h-16 text-lg sm:text-xl font-black rounded-lg border-2 border-muted w-full"
                  value={clientData.city}
                  onChange={(e) => setClientData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div className="space-y-0.5 text-left">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Bairro</Label>
                <Input
                  placeholder="Bairro..."
                  className="h-14 sm:h-16 text-lg sm:text-xl font-black rounded-lg border-2 border-muted w-full"
                  value={clientData.neighborhood}
                  onChange={(e) => setClientData(prev => ({ ...prev, neighborhood: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-0.5 text-left">
              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Endereço / Referência</Label>
              <Input
                placeholder="Endereço completo..."
                className="h-14 sm:h-16 text-lg sm:text-xl font-black rounded-lg border-2 border-muted w-full"
                value={clientData.address}
                onChange={(e) => setClientData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. CADASTRO RÁPIDO DE PRODUTO */}
        <Card className="border-none shadow-2xl rounded-[1rem] sm:rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-muted/80 p-3 sm:p-4 border-b-2">
            <CardTitle className="flex flex-row items-center gap-2 text-lg sm:text-2xl font-black text-left uppercase">
              <Package className="size-5 sm:size-6 text-primary" />
              2. Detalhes do Produto Vendido
            </CardTitle>
          </CardHeader>
          <CardContent className="p-1 sm:p-2 space-y-2">
            <div className="space-y-0.5 text-left">
              <Label htmlFor="name" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Nome do Produto</Label>
              <Input
                placeholder="Nome do item..."
                className="h-14 sm:h-16 text-lg sm:text-xl font-black rounded-lg border-2 border-muted w-full"
                value={productData.name}
                onChange={(e) => setProductData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-1.5">
              <div className="space-y-0.5 text-left">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Marca</Label>
                <Select onValueChange={(val) => setProductData(prev => ({ ...prev, brand: val }))} value={productData.brand}>
                  <SelectTrigger className="h-14 sm:h-16 text-lg sm:text-xl font-black rounded-lg border-2 border-muted w-full">
                    <SelectValue placeholder="Selecione a marca..." />
                  </SelectTrigger>
                  <SelectContent className="font-bold">
                    <SelectItem value="VERDE (N)">VERDE (N)</SelectItem>
                    <SelectItem value="ROSA (A)">ROSA (A)</SelectItem>
                    <SelectItem value="MARROM (C&E)">MARROM (C&E)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-0.5 text-left">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Categoria</Label>
                <Input
                  placeholder="Categoria..."
                  className="h-14 sm:h-16 text-lg sm:text-xl font-black rounded-lg border-2 border-muted w-full"
                  value={productData.category}
                  onChange={(e) => setProductData(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <div className="space-y-0.5 text-left">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Preço Revista (R$)</Label>
                <Input
                  placeholder="0,00"
                  className="h-14 sm:h-16 text-lg font-black rounded-lg border-2 border-muted w-full"
                  value={productData.catalogPrice}
                  onChange={(e) => setProductData(prev => ({ ...prev, catalogPrice: maskCurrency(e.target.value) }))}
                />
              </div>
              <div className="space-y-0.5 text-left">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Preço Custo (R$)</Label>
                <Input
                  placeholder="0,00"
                  className="h-14 sm:h-16 text-lg font-black rounded-lg border-2 border-muted w-full"
                  value={productData.costPrice}
                  onChange={(e) => setProductData(prev => ({ ...prev, costPrice: maskCurrency(e.target.value) }))}
                />
              </div>
              <div className="space-y-0.5 text-left">
                <Label className="text-[9px] font-black uppercase tracking-widest text-primary px-1">Preço Venda (R$)</Label>
                <Input
                  placeholder="0,00"
                  className="h-14 sm:h-16 text-lg font-black rounded-lg border-2 border-primary/30 bg-primary/5 w-full"
                  value={productData.salePrice}
                  onChange={(e) => setProductData(prev => ({ ...prev, salePrice: maskCurrency(e.target.value) }))}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. PAGAMENTO */}
        <Card className="border-none shadow-xl rounded-[1rem] sm:rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-muted/90 p-3 sm:p-4 border-b-2">
            <CardTitle className="flex flex-row items-center gap-2 text-lg sm:text-2xl font-black text-left uppercase">
              <CreditCard className="size-5 sm:size-6 text-primary" />
              3. Forma de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-1 sm:p-2 space-y-2">
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {[
                { id: 'pix', label: 'Pix', icon: Smartphone },
                { id: 'dinheiro', label: 'Din.', icon: Banknote },
                { id: 'cartao', label: 'Card', icon: CreditCard },
                { id: 'a prazo', label: 'Prazo', icon: HandCoins },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPaymentMethod(option.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all gap-1 h-16 sm:h-20",
                    paymentMethod === option.id
                      ? "bg-primary text-white border-primary shadow-md scale-105"
                      : "bg-background border-muted text-muted-foreground"
                  )}
                >
                  <option.icon className="size-5 sm:size-6" />
                  <span className="text-[8px] sm:text-[10px] font-black uppercase">{option.label}</span>
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-1.5">
              <div className="space-y-0.5 text-left">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Data de Vencimento</Label>
                <Input 
                  type="date" 
                  className="h-14 sm:h-16 text-lg font-black rounded-lg border-2 border-muted bg-background w-full" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
                />
              </div>
              <div className="space-y-0.5 text-left">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Notas da Venda</Label>
                <Input
                  placeholder="Observações da venda..."
                  className="h-14 sm:h-16 text-lg font-bold rounded-lg border-2 border-muted w-full"
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. CHECK-IN DA VENDA */}
        <Card className="border-none shadow-xl rounded-[1rem] sm:rounded-[2rem] overflow-hidden bg-slate-900 text-white">
          <CardHeader className="p-3 border-b border-white/10 bg-white/5">
            <CardTitle className="flex flex-row items-center gap-2 text-lg font-black text-left uppercase">
              <CheckCircle2 className="size-5 text-[#39FF14]" />
              4. Check-in da Venda
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            <div className="flex items-center gap-3">
              <div className={cn("size-7 rounded-full border-2 flex items-center justify-center shrink-0", clientData.fullName ? "bg-[#39FF14]/20 border-[#39FF14]" : "border-white/20")}>
                {clientData.fullName ? <CheckCircle2 className="size-4 text-[#39FF14]" /> : <Circle className="size-4 text-white/20" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-black uppercase tracking-widest text-[#39FF14]">Cliente Selecionada</p>
                <p className="text-base sm:text-xl font-black italic truncate">{clientData.fullName || "Aguardando preenchimento..."}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={cn("size-7 rounded-full border-2 flex items-center justify-center shrink-0", productData.name ? "bg-[#39FF14]/20 border-[#39FF14]" : "border-white/20")}>
                {productData.name ? <CheckCircle2 className="size-4 text-[#39FF14]" /> : <Circle className="size-4 text-white/20" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-black uppercase tracking-widest text-[#39FF14]">Item no Pedido</p>
                <p className="text-base sm:text-xl font-black italic truncate">{productData.name || "Aguardando preenchimento..."}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={cn("size-7 rounded-full border-2 flex items-center justify-center shrink-0", paymentMethod ? "bg-[#39FF14]/20 border-[#39FF14]" : "border-white/20")}>
                {paymentMethod ? <CheckCircle2 className="size-4 text-[#39FF14]" /> : <Circle className="size-4 text-white/20" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-black uppercase tracking-widest text-[#39FF14]">Forma de Pagamento</p>
                <p className="text-base sm:text-xl font-black italic truncate capitalize">{paymentMethod || "Aguardando..."}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. FINALIZAÇÃO */}
        <Card className="border-none shadow-2xl rounded-[1rem] sm:rounded-[2rem] overflow-hidden bg-primary text-primary-foreground">
          <CardHeader className="p-3 bg-white/10">
             <CardTitle className="flex flex-row items-center gap-2 text-xl sm:text-2xl font-black uppercase italic">
              <DollarSign className="size-5 sm:size-6" />
              5. Finalização
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-4">
            <div className="grid lg:grid-cols-2 gap-4 items-center">
               <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-white/10 pb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Subtotal</span>
                    <span className="text-lg font-black">R$ {subtotal.toFixed(2)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="space-y-0.5">
                      <Label className="text-[8px] font-black uppercase tracking-widest opacity-60 px-1">Desconto (R$)</Label>
                      <Input
                        type="number"
                        className="h-12 text-center text-lg font-black rounded-lg border-2 bg-white/10 border-white/20 text-white w-full"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-[8px] font-black uppercase tracking-widest opacity-60 px-1">Taxas (R$)</Label>
                      <Input
                        type="number"
                        className="h-12 text-center text-lg font-black rounded-lg border-2 bg-white/10 border-white/20 text-white w-full"
                        value={additionalFee}
                        onChange={(e) => setAdditionalFee(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
               </div>

               <div className="p-4 sm:p-6 rounded-2xl shadow-xl text-center bg-white text-primary border-4 border-white">
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] mb-1 opacity-60">Total Final Recebido</p>
                  <p className="text-4xl sm:text-6xl font-black tracking-tighter leading-none italic">R$ {finalTotal.toFixed(2)}</p>
                </div>
            </div>
          </CardContent>
          <CardFooter className="p-3 pt-0">
             <Button 
              type="submit" 
              size="lg"
              className={cn(
                "w-full h-20 sm:h-24 text-xl sm:text-3xl font-black rounded-xl sm:rounded-2xl shadow-2xl transition-all active:scale-95 uppercase tracking-widest bg-white text-primary hover:bg-white/90",
                (!isReady || isLoading) && "opacity-50 cursor-not-allowed"
              )}
              disabled={!isReady || isLoading}
            >
              {isLoading ? (
                <ReceiptText className="animate-spin size-8 sm:size-10" />
              ) : (
                <>
                  <CheckCircle2 className="mr-2 size-6 sm:size-8" />
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
