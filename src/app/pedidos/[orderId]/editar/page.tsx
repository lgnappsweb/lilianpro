
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  Trash2,
  Plus,
  Loader2,
  Tag,
  Search,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  Save,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { doc, collection, getDocs, getDoc } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface SaleItem {
  id?: string;
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

export default function EditarVendaPage() {
  const { orderId } = useParams();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);

  // Busca Ciclos
  const cyclesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "cycles");
  }, [db, user]);
  const { data: cycles } = useCollection(cyclesQuery);

  // Busca Dados Originais do Pedido
  const orderRef = useMemoFirebase(() => {
    if (!db || !user || !orderId) return null;
    return doc(db, "users", user.uid, "orders", orderId as string);
  }, [db, user, orderId]);
  const { data: orderDataOriginal } = useDoc(orderRef);

  // Busca Itens Originais do Pedido
  const itemsQuery = useMemoFirebase(() => {
    if (!db || !user || !orderId) return null;
    return collection(db, "users", user.uid, "orders", orderId as string, "orderItems");
  }, [db, user, orderId]);
  const { data: itemsOriginal } = useCollection(itemsQuery);

  // --- ESTADO DO FORM ---
  const [clientData, setClientData] = useState({
    fullName: "",
    phone: "",
    city: "",
    neighborhood: "",
    address: "",
    notes: "",
  });

  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saleNotes, setSaleNotes] = useState("");
  const [discount, setDiscount] = useState(0);
  const [additionalFee, setAdditionalFee] = useState(0);
  const [currentCycleId, setCurrentCycleId] = useState("");

  const maskCurrency = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    const number = parseFloat(digits) / 100;
    return number.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const unmaskCurrency = (value: string) => {
    if (!value) return 0;
    const cleaned = value.toString().replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  };

  // Carregar dados detalhados (inclusive do cliente e produtos)
  useEffect(() => {
    const loadAllData = async () => {
      if (!orderDataOriginal || !itemsOriginal || !user || !db) return;

      try {
        // 1. Carregar dados do Cliente
        const clientSnap = await getDoc(doc(db, "users", user.uid, "clients", orderDataOriginal.clientId));
        if (clientSnap.exists()) {
          const c = clientSnap.data();
          setClientData({
            fullName: c.fullName || "",
            phone: c.phone || "",
            city: c.city || "",
            neighborhood: c.neighborhood || "",
            address: c.address || "",
            notes: c.notes || "",
          });
        } else {
          setClientData(prev => ({ ...prev, fullName: orderDataOriginal.clientName }));
        }

        // 2. Carregar Pedido
        setPaymentMethod(orderDataOriginal.paymentMethod || "");
        setDueDate(orderDataOriginal.dueDate || "");
        setSaleNotes(orderDataOriginal.notes || "");
        setDiscount(Number(orderDataOriginal.discountAmount) || 0);
        setAdditionalFee(Number(orderDataOriginal.additionalFeeAmount) || 0);
        setCurrentCycleId(orderDataOriginal.cycleId || "");

        // 3. Carregar Itens com Detalhes dos Produtos
        const mappedItems: SaleItem[] = [];
        for (const item of itemsOriginal) {
          const prodSnap = await getDoc(doc(db, "users", user.uid, "products", item.productId));
          const p = prodSnap.exists() ? prodSnap.data() : null;

          mappedItems.push({
            id: item.productId,
            tempId: item.id,
            name: item.productName || "",
            brand: p?.brand || "",
            category: p?.category || "",
            catalogPrice: p ? maskCurrency((Number(p.catalogPrice) * 100).toFixed(0)) : "0,00",
            costPrice: p ? maskCurrency((Number(p.costPrice) * 100).toFixed(0)) : "0,00",
            salePrice: maskCurrency((Number(item.unitPrice) * 100).toFixed(0)),
            productCode: p?.productCode || "",
            description: p?.description || ""
          });
        }
        setSaleItems(mappedItems);
        setIsFetchingData(false);
      } catch (e) {
        console.error("Erro ao carregar dados para edição:", e);
        setIsFetchingData(false);
      }
    };

    loadAllData();
  }, [orderDataOriginal, itemsOriginal, user, db]);

  const handleItemChange = (tempId: string, field: keyof SaleItem, value: string) => {
    setSaleItems(prev => prev.map(item => {
      if (item.tempId !== tempId) return item;
      const updatedItem = { ...item, [field]: value };
      
      // Lógica de cálculo automático de custo (igual Nova Venda)
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

  const subtotal = useMemo(() => saleItems.reduce((acc, item) => acc + unmaskCurrency(item.salePrice), 0), [saleItems]);
  const finalTotal = Math.max(0, subtotal - discount + additionalFee);

  const activeCycle = useMemo(() => {
    if (!cycles || !currentCycleId) return null;
    return cycles.find(c => c.id === currentCycleId);
  }, [cycles, currentCycleId]);

  const isReady = useMemo(() => {
    return (
      clientData.fullName &&
      clientData.phone &&
      saleItems.length > 0 &&
      saleItems.every(item => item.name && item.brand && item.salePrice) &&
      paymentMethod &&
      currentCycleId
    );
  }, [clientData, saleItems, paymentMethod, currentCycleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !isReady || !orderId) return;

    setIsLoading(true);

    try {
      // 1. Atualizar Pedido
      const orderRef = doc(db, "users", user.uid, "orders", orderId as string);
      const updatedOrder = {
        clientName: clientData.fullName,
        paymentMethod,
        paymentStatus: paymentMethod === "a prazo" ? "Pendente" : "Pago",
        dueDate: dueDate || null,
        notes: saleNotes,
        totalAmount: subtotal,
        discountAmount: discount,
        additionalFeeAmount: additionalFee,
        finalAmount: finalTotal,
        cycleId: currentCycleId,
      };
      setDocumentNonBlocking(orderRef, updatedOrder, { merge: true });

      // 2. Atualizar Dados da Cliente (Opcional, mas recomendado já que permitimos editar no card 1)
      const clientRef = doc(db, "users", user.uid, "clients", orderDataOriginal?.clientId);
      setDocumentNonBlocking(clientRef, clientData, { merge: true });

      // 3. Limpar Itens Antigos do Pedido
      const itemsSnap = await getDocs(collection(db, "users", user.uid, "orders", orderId as string, "orderItems"));
      for (const itemDoc of itemsSnap.docs) {
        deleteDocumentNonBlocking(doc(db, "users", user.uid, "orders", orderId as string, "orderItems", itemDoc.id));
      }

      // 4. Salvar Novos Itens e Atualizar Produtos
      saleItems.forEach((item, index) => {
        const productId = item.id || `prod-${Date.now()}-${index}`;
        const itemId = `item-${Date.now()}-${index}`;
        
        // Atualiza o produto global
        setDocumentNonBlocking(doc(db, "users", user.uid, "products", productId), {
          id: productId, name: item.name, brand: item.brand, category: item.category,
          catalogPrice: unmaskCurrency(item.catalogPrice), costPrice: unmaskCurrency(item.costPrice),
          salePrice: unmaskCurrency(item.salePrice), productCode: item.productCode,
          description: item.description, adminId: user.uid
        }, { merge: true });

        // Salva o novo item da ordem
        setDocumentNonBlocking(doc(db, "users", user.uid, "orders", orderId as string, "orderItems", itemId), {
          id: itemId, adminId: user.uid, orderId: orderId, productId: productId,
          productName: item.name, quantity: 1, unitPrice: unmaskCurrency(item.salePrice), subtotal: unmaskCurrency(item.salePrice)
        }, { merge: true });
      });

      toast({ title: "Pedido Atualizado!", description: "As correções foram salvas com sucesso." });
      router.push(`/pedidos/${orderId}`);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao atualizar venda." });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingData) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground">
        <Loader2 className="size-16 animate-spin text-primary" />
        <p className="text-2xl font-black animate-pulse uppercase tracking-widest text-center">Abrindo pedido para edição completa...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 w-full animate-in fade-in duration-500 pb-32">
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <RefreshCw className="size-16 sm:size-24 text-primary" />
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap px-2">AJUSTAR VENDA</h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">CORRIJA ITENS, VALORES OU PAGAMENTOS</p>
          
          <div className="mt-6 flex items-center justify-center gap-2">
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary font-black uppercase tracking-widest px-6 py-2 gap-2 rounded-xl text-xs sm:text-sm">
              <RefreshCw className="size-4" />
              EDITANDO NO CICLO: {activeCycle?.name || "NÃO DEFINIDO"}
            </Badge>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        {/* CARD 1: IDENTIFICAÇÃO (MESMO DA NOVA VENDA) */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/80 p-4 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-xl sm:text-3xl font-black text-left uppercase px-2">
              <User className="size-6 sm:size-8 text-primary" />
              1. Identificação da Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid sm:grid-cols-2">
              <Input placeholder="Nome Completo" className="h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted focus:border-primary px-4 placeholder:text-muted-foreground/30" value={clientData.fullName} onChange={(e) => setClientData(p => ({ ...p, fullName: e.target.value }))} required />
              <Input placeholder="WhatsApp" className="h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted focus:border-primary px-4 placeholder:text-muted-foreground/30" value={clientData.phone} onChange={(e) => setClientData(p => ({ ...p, phone: e.target.value }))} required />
            </div>
            <div className="grid sm:grid-cols-2">
              <Input placeholder="Cidade" className="h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted focus:border-primary px-4 placeholder:text-muted-foreground/30" value={clientData.city} onChange={(e) => setClientData(p => ({ ...p, city: e.target.value }))} />
              <Input placeholder="Bairro" className="h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted focus:border-primary px-4 placeholder:text-muted-foreground/30" value={clientData.neighborhood} onChange={(e) => setClientData(p => ({ ...p, neighborhood: e.target.value }))} />
            </div>
            <Input placeholder="Endereço / Referência" className="h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted focus:border-primary px-4 bg-background placeholder:text-muted-foreground/30" value={clientData.address} onChange={(e) => setClientData(p => ({ ...p, address: e.target.value }))} />
            <Textarea placeholder="Notas do Perfil (Preferências, horários...)" className="min-h-[120px] text-lg sm:text-xl font-bold rounded-none border-none focus:border-primary px-4 bg-background py-4 placeholder:text-muted-foreground/30" value={clientData.notes} onChange={(e) => setClientData(p => ({ ...p, notes: e.target.value }))} />
          </CardContent>
        </Card>

        {/* CARD 2: PRODUTOS VENDIDOS (REPLICA COMPLETA) */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/80 p-4 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-xl sm:text-3xl font-black text-left uppercase px-2">
              <Package className="size-6 sm:size-8 text-primary" />
              2. Detalhes do Produto Ajustado
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y-8 divide-muted/30">
              {saleItems.map((item, index) => (
                <div key={item.tempId} className="relative">
                  <div className="bg-primary/5 px-4 h-12 flex items-center justify-between text-xs font-black text-primary uppercase tracking-widest border-b-4 border-primary/10">
                    <span>Item #{(index + 1).toString().padStart(2, '0')}</span>
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeItem(item.tempId)} className="h-8 rounded-xl font-black text-[9px]">REMOVER</Button>
                  </div>
                  <Input placeholder="Nome do Produto" className="h-16 text-xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted focus:border-primary px-4 placeholder:text-muted-foreground/30" value={item.name} onChange={(e) => handleItemChange(item.tempId, "name", e.target.value)} required />
                  <div className="grid sm:grid-cols-2">
                    <Select onValueChange={(val) => handleItemChange(item.tempId, "brand", val)} value={item.brand}>
                      <SelectTrigger className="h-16 text-xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted px-4"><SelectValue placeholder="Marca..." /></SelectTrigger>
                      <SelectContent className="font-black"><SelectItem value="VERDE (N)">VERDE (N)</SelectItem><SelectItem value="ROSA (A)">ROSA (A)</SelectItem><SelectItem value="MARROM (C&E)">MARROM (C&E)</SelectItem></SelectContent>
                    </Select>
                    <Input placeholder="Categoria" className="h-16 text-xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted px-4 placeholder:text-muted-foreground/30" value={item.category} onChange={(e) => handleItemChange(item.tempId, "category", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3">
                    <div className="relative"><Input placeholder="00,00" className="h-16 text-center font-black bg-sky-100 border-b-4 border-sky-400" value={item.catalogPrice} onChange={(e) => handleItemChange(item.tempId, "catalogPrice", maskCurrency(e.target.value))} /><span className="absolute top-1 left-1 text-[7px] font-black uppercase text-sky-700/60">Revista</span></div>
                    <div className="relative"><Input placeholder="00,00" className="h-16 text-center font-black bg-orange-100 border-b-4 border-orange-400" value={item.costPrice} onChange={(e) => handleItemChange(item.tempId, "costPrice", maskCurrency(e.target.value))} /><span className="absolute top-1 left-1 text-[7px] font-black uppercase text-orange-700/60">Custo</span></div>
                    <div className="relative"><Input placeholder="00,00" className="h-16 text-center font-black bg-green-100 border-none" value={item.salePrice} onChange={(e) => handleItemChange(item.tempId, "salePrice", maskCurrency(e.target.value))} required /><span className="absolute top-1 left-1 text-[7px] font-black uppercase text-green-700/60">Venda</span></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 bg-muted/20">
              <Button type="button" onClick={addItem} className="w-full h-16 bg-primary text-white font-black rounded-xl gap-4 shadow-xl">ADICIONAR PRODUTO</Button>
            </div>
          </CardContent>
        </Card>

        {/* CARD 3: CICLO E PAGAMENTO */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/80 p-4 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-xl sm:text-3xl font-black text-left uppercase px-2">
              <CreditCard className="size-6 sm:size-8 text-primary" />
              3. Ciclo e Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6 border-b-4 border-muted bg-primary/5">
              <Label className="text-[10px] font-black uppercase opacity-60 px-2">Vincular a qual Ciclo?</Label>
              <Select onValueChange={setCurrentCycleId} value={currentCycleId}>
                <SelectTrigger className="h-16 text-xl font-black rounded-xl border-4 border-muted mt-2">
                  <SelectValue placeholder="Selecione o ciclo..." />
                </SelectTrigger>
                <SelectContent className="font-black">
                  {cycles?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 border-b-4 border-muted">
              {[
                { id: 'pix', label: 'Pix', icon: Smartphone, color: "bg-sky-500" },
                { id: 'dinheiro', label: 'Dinheiro', icon: Banknote, color: "bg-emerald-500" },
                { id: 'a prazo', label: 'A Prazo', icon: HandCoins, color: "bg-amber-500" },
              ].map((option) => (
                <button key={option.id} type="button" onClick={() => setPaymentMethod(option.id)} className={cn("flex flex-col items-center justify-center p-2 transition-all gap-1 h-20 sm:h-32 border-r-4 border-muted last:border-r-0", paymentMethod === option.id ? `${option.color} text-white shadow-inner` : "bg-background text-muted-foreground")}>
                  <option.icon className="size-8 sm:size-12" /><span className="text-[9px] font-black uppercase">{option.label}</span>
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2">
              <div className="border-b-4 sm:border-b-0 sm:border-r-4 border-muted p-4">
                <Label className="text-[10px] font-black uppercase opacity-60 flex items-center gap-2">Vencimento <Badge variant="secondary" className="text-[8px] h-4 font-black">FIXO DIA 05</Badge></Label>
                <Input type="date" className="h-12 text-xl font-black border-none" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="p-4"><Label className="text-[10px] font-black uppercase opacity-60">Notas da Venda</Label><Input placeholder="Ex: Ajuste de valor, item esquecido..." className="h-12 text-xl font-black border-none placeholder:text-muted-foreground/30" value={saleNotes} onChange={(e) => setSaleNotes(e.target.value)} /></div>
            </div>
          </CardContent>
        </Card>

        {/* CARD 4: CHECK-IN ELITE */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] bg-slate-900 text-white border-4 border-primary/20 p-8 space-y-8">
          <CardTitle className="text-xl sm:text-3xl font-black uppercase italic flex items-center gap-3 text-[#39FF14]"><CheckCircle2 className="size-8" /> Check-in de Ajuste</CardTitle>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className={cn("size-10 rounded-xl border-4 flex items-center justify-center shrink-0", clientData.fullName ? "border-[#39FF14] bg-[#39FF14]/20" : "border-white/10")}>{clientData.fullName ? <CheckCircle2 className="size-5 text-[#39FF14]" /> : <Circle className="size-5 text-white/10" />}</div>
              <div className="truncate"><p className="text-[8px] font-black uppercase text-[#39FF14]">Cliente Confirmada</p><p className="text-xl sm:text-2xl font-black italic truncate tracking-tighter">{clientData.fullName || "AGUARDANDO NOME..."}</p></div>
            </div>
            <div className="flex items-center gap-4">
              <div className={cn("size-10 rounded-xl border-4 flex items-center justify-center shrink-0", saleItems.length > 0 ? "border-[#39FF14] bg-[#39FF14]/20" : "border-white/10")}>{saleItems.length > 0 ? <CheckCircle2 className="size-5 text-[#39FF14]" /> : <Circle className="size-5 text-white/10" />}</div>
              <div className="truncate"><p className="text-[8px] font-black uppercase text-[#39FF14]">Itens Revisados</p><p className="text-xl sm:text-2xl font-black italic truncate tracking-tighter">{saleItems.length} PRODUTO(S) NA LISTA</p></div>
            </div>
            <div className="flex items-center gap-4">
              <div className={cn("size-10 rounded-xl border-4 flex items-center justify-center shrink-0", currentCycleId ? "border-[#39FF14] bg-[#39FF14]/20" : "border-red-500 bg-red-500/20")}>{currentCycleId ? <CheckCircle2 className="size-5 text-[#39FF14]" /> : <AlertTriangle className="size-5 text-red-500" />}</div>
              <div className="truncate"><p className="text-[8px] font-black uppercase text-[#39FF14]">Destino do Faturamento</p><p className="text-xl sm:text-2xl font-black italic truncate tracking-tighter">{activeCycle?.name || "NENHUM CICLO SELECIONADO"}</p></div>
            </div>
          </div>
        </Card>

        {/* CARD 5: FINALIZAÇÃO (CONSOLIDADO) */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] bg-primary text-primary-foreground p-8 space-y-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="flex justify-between border-b-2 border-white/10 pb-1"><span className="text-xs font-black uppercase opacity-60">Subtotal Bruto</span><span className="text-2xl font-black italic">R$ {subtotal.toFixed(2)}</span></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60 italic">Desconto (R$)</Label><Input type="number" className="h-14 bg-white/10 border-4 border-white/20 text-white font-black text-center" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} /></div>
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60 italic">Taxas (R$)</Label><Input type="number" className="h-14 bg-white/10 border-4 border-white/20 text-white font-black text-center" value={additionalFee} onChange={(e) => setAdditionalFee(parseFloat(e.target.value) || 0)} /></div>
              </div>
            </div>
            <div className="p-6 rounded-[2rem] bg-white text-primary text-center border-8 border-white animate-in zoom-in duration-500 shadow-2xl">
              <p className="text-[10px] font-black uppercase opacity-60 mb-1">VALOR FINAL RECALCULADO</p>
              <p className="text-5xl sm:text-7xl font-black italic text-green-600 tracking-tighter">R$ {finalTotal.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Button type="submit" className={cn("w-full h-24 sm:h-28 text-2xl sm:text-4xl font-black rounded-3xl bg-white text-primary hover:bg-white/90 border-8 border-white shadow-2xl transition-all active:scale-95 uppercase", (!isReady || isLoading) && "opacity-50")} disabled={!isReady || isLoading}>
              {isLoading ? <Loader2 className="animate-spin size-12" /> : <><Save className="mr-3 size-10" /> SALVAR ALTERAÇÕES</>}
            </Button>
            <Button asChild variant="ghost" className="w-full text-white/60 hover:text-white font-black uppercase tracking-widest text-xs">
              <Link href={`/pedidos/${orderId}`}><ArrowLeft className="mr-2 size-4" /> Cancelar e Voltar</Link>
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
