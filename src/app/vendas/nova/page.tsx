
"use client";

import React, { useState, useMemo } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function NovaVendaPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedItems, setSelectedItems] = useState([
    { id: `temp-${Date.now()}`, productId: "", quantity: 1, price: 0, name: "" }
  ]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState(0);
  const [additionalFee, setAdditionalFee] = useState(0);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  const clientsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "clients");
  }, [db, user]);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "products");
  }, [db, user]);

  const { data: clients } = useCollection(clientsQuery);
  const { data: products } = useCollection(productsQuery);

  const selectedClient = useMemo(() => {
    return clients?.find(c => c.id === selectedClientId);
  }, [clients, selectedClientId]);

  const addItem = () => {
    setSelectedItems([{ id: `temp-${Date.now()}-${Math.random()}`, productId: "", quantity: 1, price: 0, name: "" }, ...selectedItems]);
  };

  const removeItem = () => {
    if (itemToDeleteId) {
      setSelectedItems(selectedItems.filter(item => item.id !== itemToDeleteId));
      setItemToDeleteId(null);
    }
  };

  const subtotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [selectedItems]);

  const finalTotal = Math.max(0, subtotal - discount + additionalFee);

  const isReady = useMemo(() => {
    return !!selectedClientId && selectedItems.some(item => !!item.productId) && !!paymentMethod;
  }, [selectedClientId, selectedItems, paymentMethod]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !isReady) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Por favor, selecione a cliente, produtos e forma de pagamento.",
      });
      return;
    }

    const orderId = `ord-${Date.now()}`;
    const orderData = {
      id: orderId,
      adminId: user.uid,
      clientId: selectedClientId,
      orderDate: new Date().toISOString(),
      totalAmount: subtotal,
      discountAmount: discount,
      additionalFeeAmount: additionalFee,
      finalAmount: finalTotal,
      paymentMethod,
      paymentStatus: paymentMethod === "fiado" ? "Pendente" : "Pago",
      dueDate: dueDate || null,
      notes,
    };

    addDocumentNonBlocking(collection(db, "users", user.uid, "orders"), orderData);

    selectedItems.forEach((item) => {
      if (!item.productId) return;
      const itemId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const itemData = {
        id: itemId,
        adminId: user.uid,
        orderId: orderId,
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.price * item.quantity,
      };
      addDocumentNonBlocking(collection(db, "users", user.uid, "orders", orderId, "orderItems"), itemData);
    });

    toast({
      title: "Venda registrada!",
      description: "A venda foi salva com sucesso.",
    });
    router.push("/pedidos");
  };

  const hasItems = selectedItems.some(item => !!item.productId);

  return (
    <div className="space-y-6 sm:space-y-10 w-full animate-in fade-in duration-500 pb-32">
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex items-center justify-center gap-4 mb-2">
            <ShoppingBag className="size-10 sm:size-16 text-primary" />
            <h1 className="text-4xl md:text-8xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-sm">NOVA VENDA</h1>
          </div>
          <p className="text-sm sm:text-xl text-muted-foreground mt-3 font-bold opacity-60 uppercase tracking-widest">Cadastre uma venda rapidamente no seu sistema.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 sm:gap-10">
        {/* 1. Cliente */}
        <Card className="border-none shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/30 p-6 sm:p-8 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-2xl sm:text-3xl font-black text-left">
              <User className="size-8 sm:size-10 text-primary" />
              1. Selecionar Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-10">
            <div className="space-y-4 text-left">
              <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Quem está comprando?</Label>
              <Select onValueChange={setSelectedClientId} value={selectedClientId}>
                <SelectTrigger className="h-14 sm:h-20 text-lg sm:text-2xl font-black rounded-xl sm:rounded-3xl border-4 border-muted bg-background">
                  <SelectValue placeholder="Busque pelo nome..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-2xl border-2">
                  {clients?.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-base sm:text-xl font-bold p-3 sm:p-4 focus:bg-primary/5">{c.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 2. Produtos */}
        <Card className="border-none shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/30 p-6 sm:p-8 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-2xl sm:text-3xl font-black text-left">
              <Package className="size-8 sm:size-10 text-primary" />
              2. Produtos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-10 space-y-6 sm:space-y-10">
            <Button type="button" variant="outline" size="lg" className="w-full h-14 sm:h-20 text-base sm:text-2xl font-black border-4 border-primary/20 text-primary rounded-xl sm:rounded-3xl hover:bg-primary/5 transition-all shadow-lg active:scale-95" onClick={addItem}>
              <Plus className="size-6 sm:size-8 mr-2" />
              Adicionar Item
            </Button>

            {selectedItems.map((item, index) => (
              <div key={item.id} className="flex flex-col gap-4 animate-in slide-in-from-left-4 duration-500 bg-muted/10 p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] border-4 border-border/30 relative group">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-4 right-4 size-10 sm:size-14 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-all"
                  onClick={() => setItemToDeleteId(item.id)}
                >
                  <Trash2 className="size-6 sm:size-8" />
                </Button>

                <div className="space-y-2 pr-12 text-left">
                  <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Escolha o Produto</Label>
                  <Select onValueChange={(val) => {
                    const product = products?.find(p => p.id === val);
                    if (product) {
                      const newItems = [...selectedItems];
                      newItems[index].productId = val;
                      newItems[index].price = product.salePrice;
                      newItems[index].name = product.name;
                      setSelectedItems(newItems);
                    }
                  }} value={item.productId}>
                    <SelectTrigger className="h-14 sm:h-16 text-sm sm:text-xl font-black rounded-xl sm:rounded-2xl bg-background border-2 border-border shadow-sm group-hover:border-primary/20 transition-all">
                      <SelectValue placeholder="Selecione o item..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl">
                      {products?.map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-sm sm:text-lg font-bold p-3">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {item.productId && (
                  <div className="grid grid-cols-2 gap-4 sm:gap-8">
                    <div className="space-y-2 text-left">
                      <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        className="h-14 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-xl sm:rounded-2xl border-2 border-border bg-background"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...selectedItems];
                          newItems[index].quantity = parseInt(e.target.value) || 1;
                          setSelectedItems(newItems);
                        }}
                      />
                    </div>
                    <div className="space-y-2 text-left">
                      <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Subtotal</Label>
                      <div className="h-14 sm:h-16 flex items-center justify-center bg-primary/10 rounded-xl sm:rounded-2xl text-xl sm:text-2xl font-black text-primary border-2 border-primary/20 shadow-inner">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 3. Pagamento */}
        <Card className="border-none shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/30 p-6 sm:p-8 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-2xl sm:text-3xl font-black text-left">
              <CreditCard className="size-8 sm:size-10 text-primary" />
              3. Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-10">
            <div className="grid gap-6 sm:gap-10 sm:grid-cols-2">
              <div className="space-y-4 sm:col-span-2 text-left">
                <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Forma de Pagamento</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { id: 'pix', label: 'Pix', icon: Smartphone },
                    { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
                    { id: 'cartao', label: 'Cartão', icon: CreditCard },
                    { id: 'fiado', label: 'Fiado', icon: HandCoins },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPaymentMethod(option.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border-4 transition-all gap-4",
                        paymentMethod === option.id
                          ? "bg-primary text-primary-foreground border-primary shadow-xl scale-105"
                          : "bg-background text-muted-foreground border-muted hover:border-primary/20"
                      )}
                    >
                      <option.icon className={cn("size-8 sm:size-12", paymentMethod === option.id ? "text-white" : "text-primary")} />
                      <span className="text-xs sm:text-2xl font-black uppercase tracking-tight">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4 text-left">
                <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Vencimento (Fiado)</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-5 top-1/2 -translate-y-1/2 size-6 text-muted-foreground hidden sm:block" />
                  <Input type="date" className="h-14 sm:h-20 sm:pl-16 text-base sm:text-2xl font-black rounded-xl sm:rounded-3xl border-4 border-muted bg-background" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
              <div className="sm:col-span-2 space-y-4 text-left">
                <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block">Notas Adicionais</Label>
                <textarea 
                  className="w-full min-h-[120px] sm:min-h-[150px] rounded-[1.5rem] sm:rounded-[2.5rem] border-4 border-muted bg-background px-6 sm:px-8 py-6 sm:py-8 text-base sm:text-2xl font-bold focus-visible:outline-none focus-visible:ring-8 focus-visible:ring-primary/10 transition-all shadow-inner" 
                  placeholder="Ex: Entrega agendada..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Checklist do Pedido (Resumo) */}
        <Card className="border-none shadow-xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden bg-slate-900 text-white">
          <CardHeader className="p-8 sm:p-10 border-b border-white/10">
            <CardTitle className="flex flex-row items-center gap-3 text-2xl sm:text-3xl font-black text-left">
              <ShoppingBag className="size-8 sm:size-10 text-[#39FF14]" />
              4. Check-in da Venda
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 sm:p-12 space-y-10">
            <div className="space-y-8">
              {/* Etapa 1: Cliente */}
              <div className="flex items-start gap-6 group">
                <div className={cn("size-10 sm:size-14 rounded-full border-4 flex items-center justify-center transition-all duration-500 shrink-0 shadow-lg", selectedClientId ? "bg-[#39FF14]/20 border-[#39FF14]" : "border-white/20 bg-white/5")}>
                  {selectedClientId ? <CheckCircle2 className="size-6 sm:size-10 text-[#39FF14] animate-in zoom-in duration-300" /> : <Circle className="size-6 sm:size-10 text-white/20" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mb-1 transition-colors", selectedClientId ? "text-[#39FF14]" : "text-white/40")}>Cliente Selecionada</p>
                  <p className={cn("text-xl sm:text-3xl font-black truncate transition-colors", selectedClientId ? "text-white" : "text-white/20")}>
                    {selectedClient?.fullName || "Aguardando seleção..."}
                  </p>
                </div>
              </div>

              {/* Etapa 2: Produtos */}
              <div className="flex items-start gap-6 group">
                <div className={cn("size-10 sm:size-14 rounded-full border-4 flex items-center justify-center transition-all duration-500 shrink-0 shadow-lg", hasItems ? "bg-[#39FF14]/20 border-[#39FF14]" : "border-white/20 bg-white/5")}>
                  {hasItems ? <CheckCircle2 className="size-6 sm:size-10 text-[#39FF14] animate-in zoom-in duration-300" /> : <Circle className="size-6 sm:size-10 text-white/20" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mb-3 transition-colors", hasItems ? "text-[#39FF14]" : "text-white/40")}>Itens no Pedido</p>
                  <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-hide pr-4">
                    {selectedItems.filter(i => i.productId).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-base sm:text-xl font-bold border-b border-white/10 pb-2 last:border-0 last:pb-0 animate-in slide-in-from-left-2">
                        <span className="text-white/80">{item.quantity}x {item.name}</span>
                        <span className="font-black text-[#39FF14]">R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {!hasItems && <p className="text-lg italic text-white/20">Nenhum item adicionado ainda...</p>}
                  </div>
                </div>
              </div>

              {/* Etapa 3: Pagamento */}
              <div className="flex items-start gap-6 group">
                <div className={cn("size-10 sm:size-14 rounded-full border-4 flex items-center justify-center transition-all duration-500 shrink-0 shadow-lg", paymentMethod ? "bg-[#39FF14]/20 border-[#39FF14]" : "border-white/20 bg-white/5")}>
                  {paymentMethod ? <CheckCircle2 className="size-6 sm:size-10 text-[#39FF14] animate-in zoom-in duration-300" /> : <Circle className="size-6 sm:size-10 text-white/20" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mb-1 transition-colors", paymentMethod ? "text-[#39FF14]" : "text-white/40")}>Forma de Pagamento</p>
                  <p className={cn("text-xl sm:text-3xl font-black uppercase transition-colors", paymentMethod ? "text-white" : "text-white/20")}>
                    {paymentMethod || "Aguardando..."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Finalização Financeira (Cores do Sistema) */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[3rem] overflow-hidden bg-primary text-primary-foreground">
          <CardHeader className="p-8 sm:p-12 pb-4">
             <CardTitle className="flex flex-row items-center gap-4 text-3xl sm:text-5xl font-black tracking-tighter uppercase text-left">
              <ReceiptText className="size-10 sm:size-14" />
              5. Finalização
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 sm:p-12 pt-4 space-y-10">
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
               <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3 text-left">
                      <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] opacity-60 block">Desconto (R$)</Label>
                      <Input
                        type="number"
                        className="h-14 sm:h-20 text-center text-xl sm:text-3xl font-black rounded-xl sm:rounded-3xl border-4 bg-white/10 border-white/20 text-white shadow-lg"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-3 text-left">
                      <Label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] opacity-60 block">Taxas (R$)</Label>
                      <Input
                        type="number"
                        className="h-14 sm:h-20 text-center text-xl sm:text-3xl font-black rounded-xl sm:rounded-3xl border-4 bg-white/10 border-white/20 text-white shadow-lg"
                        value={additionalFee}
                        onChange={(e) => setAdditionalFee(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
               </div>

               <div className="p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-2xl text-center border-8 bg-white text-primary border-white animate-in zoom-in-95 duration-500">
                  <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.4em] mb-4 opacity-60">Total a Pagar</p>
                  <p className="text-4xl sm:text-8xl font-black tracking-tighter leading-none">R$ {finalTotal.toFixed(2)}</p>
                </div>
            </div>
          </CardContent>
          <CardFooter className="p-8 sm:p-12 pt-0">
             <Button 
              type="submit" 
              size="lg"
              className={cn(
                "w-full h-20 sm:h-28 text-xl sm:text-3xl font-black rounded-2xl sm:rounded-[2.5rem] shadow-2xl transition-all active:scale-95 uppercase tracking-widest bg-white text-primary hover:bg-white/90 shadow-white/20",
                !isReady && "opacity-50 cursor-not-allowed"
              )}
              disabled={!isReady}
            >
              <Plus className="mr-3 sm:mr-6 size-8 sm:size-12" />
              CONCLUIR VENDA
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Alerta de Confirmação para Remover Item */}
      <AlertDialog open={!!itemToDeleteId} onOpenChange={(open) => !open && setItemToDeleteId(null)}>
        <AlertDialogContent className="rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 border-4 shadow-2xl max-w-xl mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl sm:text-4xl font-black tracking-tight text-primary text-left">Remover este item?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg sm:text-2xl font-bold mt-4 text-muted-foreground text-left">
              Você tem certeza que deseja retirar este produto da venda atual?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-4 mt-8 sm:mt-12">
            <AlertDialogCancel className="h-14 sm:h-20 px-8 text-lg sm:text-2xl font-black rounded-xl sm:rounded-2xl border-4">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={removeItem} className="h-14 sm:h-20 px-8 text-lg sm:text-2xl font-black bg-destructive text-white hover:bg-destructive/90 rounded-xl sm:rounded-2xl shadow-xl">
              Sim, Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
