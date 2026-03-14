
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
  Smartphone,
  Banknote,
  HandCoins,
  CheckCircle2,
  Circle,
  DollarSign,
  ReceiptText,
  Trash2,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SaleItem {
  tempId: string;
  name: string;
  brand: string;
  category: string;
  catalogPrice: string;
  costPrice: string;
  salePrice: string;
  productCode: string;
  description: string;
}

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

  // --- ESTADO DOS PRODUTOS (LISTA) ---
  const [saleItems, setSaleItems] = useState<SaleItem[]>([
    {
      tempId: `item-${Date.now()}`,
      name: "",
      brand: "",
      category: "",
      catalogPrice: "",
      costPrice: "",
      salePrice: "",
      productCode: "",
      description: ""
    }
  ]);

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

  // Funções de Gerenciamento de Itens
  const addItem = () => {
    setSaleItems([...saleItems, {
      tempId: `item-${Date.now()}-${Math.random()}`,
      name: "",
      brand: "",
      category: "",
      catalogPrice: "",
      costPrice: "",
      salePrice: "",
      productCode: "",
      description: ""
    }]);
  };

  const removeItem = (tempId: string) => {
    setSaleItems(saleItems.filter(item => item.tempId !== tempId));
  };

  const handleItemChange = (tempId: string, field: keyof SaleItem, value: string) => {
    setSaleItems(prev => prev.map(item => {
      if (item.tempId !== tempId) return item;
      
      const updatedItem = { ...item, [field]: value };

      // Cálculo automático de custo se mudar marca ou preço de revista
      if (field === "catalogPrice" || field === "brand") {
        const catalog = unmaskCurrency(updatedItem.catalogPrice);
        const brand = updatedItem.brand;
        if (catalog > 0 && brand) {
          let discountPct = 0;
          if (brand === "VERDE (N)") discountPct = 0.30;
          else if (brand === "ROSA (A)") discountPct = 0.35;
          else if (brand === "MARROM (C&E)") discountPct = 0.15;

          if (discountPct > 0) {
            const calculatedCost = catalog * (1 - discountPct);
            updatedItem.costPrice = maskCurrency((calculatedCost * 100).toFixed(0));
          }
        }
      }
      return updatedItem;
    }));
  };

  // --- LOGICA DE TOTAIS ---
  const subtotal = useMemo(() => {
    return saleItems.reduce((acc, item) => acc + unmaskCurrency(item.salePrice), 0);
  }, [saleItems]);

  const finalTotal = Math.max(0, subtotal - discount + additionalFee);

  const isReady = useMemo(() => {
    return (
      clientData.fullName &&
      clientData.phone &&
      saleItems.length > 0 &&
      saleItems.every(item => item.name && item.brand && item.salePrice) &&
      paymentMethod
    );
  }, [clientData, saleItems, paymentMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !isReady) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Preencha os campos obrigatórios do cliente, produtos e pagamento.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const clientId = `cli-${Date.now()}`;
      const orderId = `ord-${Date.now()}`;

      // 1. Salvar Novo Cliente
      const finalClientData = {
        ...clientData,
        id: clientId,
        adminId: user.uid,
        registrationDate: new Date().toISOString(),
      };
      setDocumentNonBlocking(doc(db, "users", user.uid, "clients", clientId), finalClientData, { merge: true });

      // 2. Salvar Pedido Root
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

      // 3. Salvar Produtos e Itens do Pedido
      saleItems.forEach((item, index) => {
        const productId = `prod-${Date.now()}-${index}`;
        const itemId = `item-${Date.now()}-${index}`;

        // Salvar Produto no Catálogo
        const finalProductData = {
          id: productId,
          name: item.name,
          brand: item.brand,
          category: item.category,
          catalogPrice: unmaskCurrency(item.catalogPrice),
          costPrice: unmaskCurrency(item.costPrice),
          salePrice: unmaskCurrency(item.salePrice),
          productCode: item.productCode,
          description: item.description,
          adminId: user.uid,
        };
        setDocumentNonBlocking(doc(db, "users", user.uid, "products", productId), finalProductData, { merge: true });

        // Salvar Item dentro do Pedido
        const orderItemData = {
          id: itemId,
          adminId: user.uid,
          orderId: orderId,
          productId: productId,
          productName: item.name,
          quantity: 1,
          unitPrice: unmaskCurrency(item.salePrice),
          subtotal: unmaskCurrency(item.salePrice),
        };
        setDocumentNonBlocking(doc(db, "users", user.uid, "orders", orderId, "orderItems", itemId), orderItemData, { merge: true });
      });

      toast({
        title: "Venda Concluída com Sucesso!",
        description: `Cadastro de cliente e ${saleItems.length} produtos realizado.`,
      });
      
      router.push("/pedidos");
    } catch (error) {
      console.error("Erro na venda rápida:", error);
      toast({
        variant: "destructive",
        title: "Erro ao processar",
        description: "Ocorreu um problema ao salvar os dados da venda múltipla.",
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
            <CardTitle className="flex flex-row items-center gap-2 text-lg sm:text-2xl font-black text-left uppercase px-1">
              <User className="size-5 sm:size-6 text-primary" />
              1. Identificação da Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-0">
            <div className="grid sm:grid-cols-2">
              <Input
                placeholder="Nome Completo"
                className="h-14 sm:h-16 text-lg sm:text-xl font-black rounded-none border-x-0 border-t-0 border-b-2 border-muted focus:border-primary w-full px-4"
                value={clientData.fullName}
                onChange={(e) => setClientData(prev => ({ ...prev, fullName: e.target.value }))}
                required
              />
              <Input
                placeholder="WhatsApp"
                className="h-14 sm:h-16 text-lg sm:text-xl font-black rounded-none border-x-0 border-t-0 border-b-2 border-muted focus:border-primary w-full px-4"
                value={clientData.phone}
                onChange={(e) => setClientData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                required
              />
            </div>

            <div className="grid sm:grid-cols-2">
              <Input
                placeholder="Cidade"
                className="h-14 sm:h-16 text-lg sm:text-xl font-black rounded-none border-x-0 border-t-0 border-b-2 border-muted focus:border-primary w-full px-4"
                value={clientData.city}
                onChange={(e) => setClientData(prev => ({ ...prev, city: e.target.value }))}
              />
              <Input
                placeholder="Bairro"
                className="h-14 sm:h-16 text-lg sm:text-xl font-black rounded-none border-x-0 border-t-0 border-b-2 border-muted focus:border-primary w-full px-4"
                value={clientData.neighborhood}
                onChange={(e) => setClientData(prev => ({ ...prev, neighborhood: e.target.value }))}
              />
            </div>

            <Input
              placeholder="Endereço / Referência"
              className="h-14 sm:h-16 text-lg sm:text-xl font-black rounded-none border-none focus:border-primary w-full px-4"
              value={clientData.address}
              onChange={(e) => setClientData(prev => ({ ...prev, address: e.target.value }))}
            />
          </CardContent>
        </Card>

        {/* 2. PRODUTOS VENDIDOS (LISTA DINÂMICA) */}
        <Card className="border-none shadow-2xl rounded-[1rem] sm:rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-muted/80 p-3 sm:p-4 border-b-2 flex flex-row items-center justify-between">
            <CardTitle className="flex flex-row items-center gap-2 text-lg sm:text-2xl font-black text-left uppercase px-1">
              <Package className="size-5 sm:size-6 text-primary" />
              2. Detalhes do Produto Vendido
            </CardTitle>
            <Button 
              type="button" 
              onClick={addItem}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white font-black rounded-full px-4 gap-2 h-10 sm:h-12"
            >
              <Plus className="size-4" /> ADICIONAR ITEM
            </Button>
          </CardHeader>
          <CardContent className="p-0 space-y-0">
            {saleItems.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground italic font-bold">
                Nenhum produto adicionado. Clique em "ADICIONAR ITEM" acima.
              </div>
            ) : (
              <div className="divide-y-4 divide-primary/10">
                {saleItems.map((item, index) => (
                  <div key={item.tempId} className="p-0 space-y-0 relative group">
                    {/* Botão de Remover Item */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.tempId)}
                      className="absolute right-2 top-2 z-10 size-8 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    >
                      <Trash2 className="size-4" />
                    </button>

                    <div className="bg-primary/5 px-4 py-1 text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/10">
                      Item #{index + 1}
                    </div>

                    <Input
                      placeholder="Nome do Produto"
                      className="h-14 sm:h-16 text-lg sm:text-xl font-black rounded-none border-x-0 border-t-0 border-b-2 border-muted focus:border-primary w-full px-4"
                      value={item.name}
                      onChange={(e) => handleItemChange(item.tempId, "name", e.target.value)}
                      required
                    />

                    <div className="grid sm:grid-cols-2">
                      <Select 
                        onValueChange={(val) => handleItemChange(item.tempId, "brand", val)} 
                        value={item.brand}
                      >
                        <SelectTrigger className="h-14 sm:h-16 text-lg sm:text-xl font-black rounded-none border-x-0 border-t-0 border-b-2 border-muted w-full px-4">
                          <SelectValue placeholder="Marca..." />
                        </SelectTrigger>
                        <SelectContent className="font-bold">
                          <SelectItem value="VERDE (N)">VERDE (N)</SelectItem>
                          <SelectItem value="ROSA (A)">ROSA (A)</SelectItem>
                          <SelectItem value="MARROM (C&E)">MARROM (C&E)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Categoria"
                        className="h-14 sm:h-16 text-lg sm:text-xl font-black rounded-none border-x-0 border-t-0 border-b-2 border-muted focus:border-primary w-full px-4"
                        value={item.category}
                        onChange={(e) => handleItemChange(item.tempId, "category", e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-3">
                      <Input
                        placeholder="Preço Revista"
                        className="h-14 text-base font-black rounded-none border-x-0 border-t-0 border-b-2 border-sky-200 focus:border-sky-500 w-full px-4 bg-sky-50 text-sky-900"
                        value={item.catalogPrice}
                        onChange={(e) => handleItemChange(item.tempId, "catalogPrice", maskCurrency(e.target.value))}
                      />
                      <Input
                        placeholder="Preço Custo"
                        className="h-14 text-base font-black rounded-none border-x-0 border-t-0 border-b-2 border-orange-200 focus:border-orange-500 w-full px-4 bg-orange-50 text-orange-900"
                        value={item.costPrice}
                        onChange={(e) => handleItemChange(item.tempId, "costPrice", maskCurrency(e.target.value))}
                      />
                      <Input
                        placeholder="Preço Venda"
                        className="h-14 text-base font-black rounded-none border-none focus:border-green-500 w-full px-4 bg-green-50 text-green-900"
                        value={item.salePrice}
                        onChange={(e) => handleItemChange(item.tempId, "salePrice", maskCurrency(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. PAGAMENTO */}
        <Card className="border-none shadow-xl rounded-[1rem] sm:rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-muted/80 p-3 sm:p-4 border-b-2">
            <CardTitle className="flex flex-row items-center gap-2 text-lg sm:text-2xl font-black text-left uppercase px-1">
              <CreditCard className="size-5 sm:size-6 text-primary" />
              3. Forma de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-0">
            <div className="grid grid-cols-4 border-b-2 border-muted">
              {[
                { id: 'pix', label: 'Pix', icon: Smartphone, color: "bg-sky-500", iconColor: "text-sky-500" },
                { id: 'dinheiro', label: 'Din.', icon: Banknote, color: "bg-emerald-500", iconColor: "text-emerald-500" },
                { id: 'cartao', label: 'Card', icon: CreditCard, color: "bg-violet-500", iconColor: "text-violet-500" },
                { id: 'a prazo', label: 'Prazo', icon: HandCoins, color: "bg-amber-500", iconColor: "text-amber-500" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPaymentMethod(option.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 transition-all gap-1 h-16 sm:h-20 border-r last:border-r-0",
                    paymentMethod === option.id
                      ? `${option.color} text-white shadow-inner`
                      : "bg-background text-muted-foreground hover:bg-muted/20"
                  )}
                >
                  <option.icon className={cn("size-5 sm:size-6", paymentMethod === option.id ? "text-white" : option.iconColor)} />
                  <span className={cn("text-[8px] sm:text-[10px] font-black uppercase", paymentMethod === option.id ? "text-white" : "text-muted-foreground")}>{option.label}</span>
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2">
              <div className="border-b-2 sm:border-b-0 sm:border-r-2 border-muted">
                <Label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground px-4 pt-2 block">Data de Vencimento</Label>
                <Input 
                  type="date" 
                  className="h-12 text-lg font-black border-none bg-transparent w-full px-4" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
                />
              </div>
              <Input
                placeholder="Notas da Venda"
                className="h-16 text-lg font-bold border-none w-full px-4"
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
              />
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
          <CardContent className="p-4 space-y-3">
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
              <div className={cn("size-7 rounded-full border-2 flex items-center justify-center shrink-0", saleItems.length > 0 ? "bg-[#39FF14]/20 border-[#39FF14]" : "border-white/20")}>
                {saleItems.length > 0 ? <CheckCircle2 className="size-4 text-[#39FF14]" /> : <Circle className="size-4 text-white/20" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-black uppercase tracking-widest text-[#39FF14]">Item no Pedido</p>
                <p className="text-base sm:text-xl font-black italic truncate">
                  {saleItems.length > 0 ? `${saleItems.length} item(s) no carrinho` : "Aguardando preenchimento..."}
                </p>
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
          <CardContent className="p-4 space-y-4">
            <div className="grid lg:grid-cols-2 gap-6 items-center">
               <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-white/10 pb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Subtotal</span>
                    <span className="text-xl font-black">R$ {subtotal.toFixed(2)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[8px] font-black uppercase tracking-widest opacity-60 px-1">Desconto (R$)</Label>
                      <Input
                        type="number"
                        className="h-12 text-center text-lg font-black rounded-lg border-2 bg-white/10 border-white/20 text-white w-full"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1">
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

               <div className="p-6 rounded-[1.5rem] shadow-xl text-center bg-white text-primary border-4 border-white">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 opacity-60">Total Final Recebido</p>
                  <p className="text-4xl sm:text-6xl font-black tracking-tighter leading-none italic">R$ {finalTotal.toFixed(2)}</p>
                </div>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0">
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
