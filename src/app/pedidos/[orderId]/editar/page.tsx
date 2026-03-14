
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { doc, collection, getDocs } from "firebase/firestore";
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
  const [paymentStatus, setPaymentStatus] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saleNotes, setSaleNotes] = useState("");
  const [discount, setDiscount] = useState(0);
  const [additionalFee, setAdditionalFee] = useState(0);
  const [currentCycleId, setCurrentCycleId] = useState("");

  // Popular dados quando carregados
  useEffect(() => {
    if (orderDataOriginal && itemsOriginal) {
      setPaymentMethod(orderDataOriginal.paymentMethod || "");
      setPaymentStatus(orderDataOriginal.paymentStatus || "");
      setDueDate(orderDataOriginal.dueDate || "");
      setSaleNotes(orderDataOriginal.notes || "");
      setDiscount(Number(orderDataOriginal.discountAmount) || 0);
      setAdditionalFee(Number(orderDataOriginal.additionalFeeAmount) || 0);
      setCurrentCycleId(orderDataOriginal.cycleId || "");
      
      // Dados do cliente (carregar do pedido para visualização)
      setClientData({
        fullName: orderDataOriginal.clientName || "",
        phone: "", // Telefone não fica no pedido, mas na ficha. Como é edição, focamos nos itens.
        city: "",
        neighborhood: "",
        address: "",
        notes: "",
      });

      // Mapear itens
      const mappedItems = itemsOriginal.map(item => ({
        id: item.id,
        tempId: item.id,
        name: item.productName || "",
        brand: "", // Marca não fica no OrderItem, precisaria buscar o produto. Mas deixamos vazio para o usuário preencher se necessário ou editamos apenas nome/valor.
        category: "",
        catalogPrice: "0,00",
        costPrice: "0,00",
        salePrice: Number(item.unitPrice).toFixed(2).replace(".", ","),
        productCode: "",
        description: ""
      }));
      setSaleItems(mappedItems);
      setIsFetchingData(false);
    }
  }, [orderDataOriginal, itemsOriginal]);

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
      return updatedItem;
    }));
  };

  const subtotal = useMemo(() => saleItems.reduce((acc, item) => acc + unmaskCurrency(item.salePrice), 0), [saleItems]);
  const finalTotal = Math.max(0, subtotal - discount + additionalFee);

  const isReady = useMemo(() => {
    return (
      saleItems.length > 0 &&
      saleItems.every(item => item.name && item.salePrice) &&
      paymentMethod &&
      currentCycleId
    );
  }, [saleItems, paymentMethod, currentCycleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !isReady || !orderId) return;

    setIsLoading(true);

    try {
      // 1. Atualizar Pedido
      const orderRef = doc(db, "users", user.uid, "orders", orderId as string);
      const updatedOrder = {
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

      // 2. Limpar Itens Antigos e Salvar Novos
      const itemsSnap = await getDocs(collection(db, "users", user.uid, "orders", orderId as string, "orderItems"));
      itemsSnap.forEach(itemDoc => {
        deleteDocumentNonBlocking(doc(db, "users", user.uid, "orders", orderId as string, "orderItems", itemDoc.id));
      });

      saleItems.forEach((item, index) => {
        const itemId = `item-${Date.now()}-${index}`;
        setDocumentNonBlocking(doc(db, "users", user.uid, "orders", orderId as string, "orderItems", itemId), {
          id: itemId,
          adminId: user.uid,
          orderId: orderId,
          productId: item.id || `prod-edited-${Date.now()}`, // Mantém ID se existir
          productName: item.name,
          quantity: 1,
          unitPrice: unmaskCurrency(item.salePrice),
          subtotal: unmaskCurrency(item.salePrice)
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
        <p className="text-2xl font-black animate-pulse uppercase tracking-widest text-center">Abrindo pedido para edição...</p>
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
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        {/* 1. CLIENTE (APENAS VISUALIZAÇÃO NA EDIÇÃO) */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden opacity-80">
          <CardHeader className="bg-muted/80 p-4 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-xl sm:text-3xl font-black text-left uppercase px-2">
              <User className="size-6 sm:size-8 text-primary" />
              1. Cliente do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
             <p className="text-3xl font-black text-primary uppercase italic tracking-tighter">{clientData.fullName}</p>
             <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">O CLIENTE NÃO PODE SER ALTERADO NA EDIÇÃO DO PEDIDO</p>
          </CardContent>
        </Card>

        {/* 2. PRODUTOS VENDIDOS */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/80 p-4 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-xl sm:text-3xl font-black text-left uppercase px-2">
              <Package className="size-6 sm:size-8 text-primary" />
              2. Itens do Carrinho
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
                  <Input placeholder="Nome do Produto" className="h-16 text-xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted focus:border-primary px-4" value={item.name} onChange={(e) => handleItemChange(item.tempId, "name", e.target.value)} required />
                  <div className="relative">
                    <Input placeholder="00,00" className="h-16 text-center text-2xl font-black bg-green-100 border-none" value={item.salePrice} onChange={(e) => handleItemChange(item.tempId, "salePrice", maskCurrency(e.target.value))} required />
                    <span className="absolute top-1 left-4 text-[10px] font-black uppercase text-green-700/60">Preço de Venda</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 bg-muted/20">
              <Button type="button" onClick={addItem} className="w-full h-16 bg-primary text-white font-black rounded-xl gap-4 shadow-xl">ADICIONAR OUTRO PRODUTO</Button>
            </div>
          </CardContent>
        </Card>

        {/* 3. CICLO E PAGAMENTO */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/80 p-4 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-xl sm:text-3xl font-black text-left uppercase px-2">
              <RefreshCw className="size-6 sm:size-8 text-primary" />
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
              <div className="border-b-4 sm:border-b-0 sm:border-r-4 border-muted p-4"><Label className="text-[10px] font-black uppercase opacity-60">Novo Vencimento</Label><Input type="date" className="h-12 text-xl font-black border-none" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
              <div className="p-4"><Label className="text-[10px] font-black uppercase opacity-60">Notas da Venda</Label><Input placeholder="Ex: Ajuste de valor, item esquecido..." className="h-12 text-xl font-black border-none placeholder:text-muted-foreground/30" value={saleNotes} onChange={(e) => setSaleNotes(e.target.value)} /></div>
            </div>
          </CardContent>
        </Card>

        {/* 4. FINALIZAÇÃO */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] bg-primary text-primary-foreground p-8 space-y-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="flex justify-between border-b-2 border-white/10 pb-1"><span className="text-xs font-black uppercase opacity-60">Subtotal</span><span className="text-2xl font-black italic">R$ {subtotal.toFixed(2)}</span></div>
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
          <Button type="submit" className={cn("w-full h-24 sm:h-28 text-2xl sm:text-4xl font-black rounded-3xl bg-white text-primary hover:bg-white/90 border-8 border-white shadow-2xl transition-all active:scale-95 uppercase", (!isReady || isLoading) && "opacity-50")} disabled={!isReady || isLoading}>
            {isLoading ? <Loader2 className="animate-spin size-12" /> : <><Save className="mr-3 size-10" /> SALVAR ALTERAÇÕES</>}
          </Button>
        </Card>
      </form>
    </div>
  );
}
