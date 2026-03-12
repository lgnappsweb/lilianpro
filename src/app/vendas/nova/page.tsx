
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
  Trash2,
  Plus,
  ReceiptText,
  User,
  Package,
  CreditCard,
  Calendar as CalendarIcon,
  ClipboardCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
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
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState(0);
  const [additionalFee, setAdditionalFee] = useState(0);

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
    setSelectedItems([...selectedItems, { id: `temp-${Date.now()}`, productId: "", quantity: 1, price: 0, name: "" }]);
  };

  const removeItem = (id: string) => {
    if (selectedItems.length > 1) {
      setSelectedItems(selectedItems.filter(item => item.id !== id));
    }
  };

  const subtotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [selectedItems]);

  const finalTotal = Math.max(0, subtotal - discount + additionalFee);

  const isReady = useMemo(() => {
    return !!selectedClientId && selectedItems.some(item => !!item.productId);
  }, [selectedClientId, selectedItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !isReady) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Por favor, selecione a cliente e pelo menos um produto.",
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

  return (
    <div className="space-y-10 max-w-5xl mx-auto w-full animate-in fade-in duration-500 pb-32">
      <div className="px-2">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-primary font-headline">Nova Venda</h1>
        <p className="text-xl text-muted-foreground mt-2 font-bold opacity-60">Cadastre uma venda rapidamente no seu sistema.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        {/* 1. Selecionar Cliente */}
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/30 p-8">
            <CardTitle className="flex items-center gap-4 text-2xl md:text-3xl font-black">
              <User className="size-8 text-primary" />
              1. Selecionar Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-4">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Quem está comprando?</Label>
              <Select onValueChange={setSelectedClientId} value={selectedClientId}>
                <SelectTrigger className="h-16 text-xl font-bold rounded-2xl bg-background border-4 border-muted shadow-inner focus:border-primary/30 transition-all">
                  <SelectValue placeholder="Busque pelo nome da cliente..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-2xl border-2">
                  {clients?.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-lg font-bold p-4 focus:bg-primary/5">{c.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 2. Adicionar Produtos */}
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-muted/30 p-8">
            <CardTitle className="flex items-center gap-4 text-2xl md:text-3xl font-black">
              <Package className="size-8 text-primary" />
              2. Produtos
            </CardTitle>
            <Button type="button" variant="outline" size="lg" className="h-14 px-8 text-lg font-black border-4 border-primary/20 text-primary rounded-2xl hover:bg-primary/5 transition-all" onClick={addItem}>
              <Plus className="size-6 mr-2" />
              Adicionar Item
            </Button>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {selectedItems.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end animate-in slide-in-from-left-4 duration-500 bg-muted/10 p-8 rounded-[2rem] border-2 border-border/30 relative group">
                
                <div className={cn("space-y-3 col-span-1", item.productId ? "md:col-span-6" : "md:col-span-11")}>
                  <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Produto</Label>
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
                    <SelectTrigger className="h-14 text-lg font-black rounded-xl bg-background border-2 border-border shadow-sm group-hover:border-primary/20 transition-all">
                      <SelectValue placeholder="Escolha um produto..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl">
                      {products?.map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-base font-bold p-3">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {item.productId && (
                  <>
                    <div className="col-span-1 md:col-span-2 space-y-3">
                      <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground text-center block">Qtd</Label>
                      <Input
                        type="number"
                        min="1"
                        className="h-14 text-center text-xl font-black rounded-xl border-2 border-border bg-background"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...selectedItems];
                          newItems[index].quantity = parseInt(e.target.value) || 1;
                          setSelectedItems(newItems);
                        }}
                      />
                    </div>
                    <div className="col-span-1 md:col-span-3 space-y-3">
                      <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Total Item</Label>
                      <div className="h-14 flex items-center px-6 bg-primary/10 rounded-xl text-xl font-black text-primary border-2 border-primary/20 shadow-inner">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </>
                )}

                <div className="col-span-1 md:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-14 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="size-7" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 3. Pagamento */}
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/30 p-8">
            <CardTitle className="flex items-center gap-4 text-2xl md:text-3xl font-black">
              <CreditCard className="size-8 text-primary" />
              3. Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid gap-10 sm:grid-cols-2">
              <div className="space-y-4">
                <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-16 text-xl font-black rounded-2xl border-4 border-muted bg-background">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="pix" className="text-lg font-bold p-4">Pix</SelectItem>
                    <SelectItem value="dinheiro" className="text-lg font-bold p-4">Dinheiro</SelectItem>
                    <SelectItem value="cartao" className="text-lg font-bold p-4">Cartão</SelectItem>
                    <SelectItem value="fiado" className="text-lg font-bold p-4">Fiado / Prazo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Data de Vencimento</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
                  <Input type="date" className="h-16 pl-14 text-xl font-black rounded-2xl border-4 border-muted bg-background" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
              <div className="sm:col-span-2 space-y-4">
                <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Observações do Pedido</Label>
                <textarea 
                  className="w-full min-h-[140px] rounded-[1.5rem] border-4 border-muted bg-background px-6 py-5 text-xl font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 transition-all" 
                  placeholder="Informações adicionais da venda..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Resumo da Venda (Check-in) */}
        <Card className={cn(
          "border-none shadow-2xl rounded-[3rem] overflow-hidden transition-all duration-700 transform",
          isReady ? "bg-primary text-primary-foreground scale-[1.02]" : "bg-muted/50 text-muted-foreground opacity-50"
        )}>
          <CardHeader className="p-10 pb-4">
            <CardTitle className="flex items-center gap-4 text-3xl md:text-4xl font-black tracking-tighter">
              <ClipboardCheck className="size-10" />
              Resumo da Venda
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 pt-4 space-y-10">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className={cn(
                  "p-8 rounded-[2rem] border-2",
                  isReady ? "bg-white/10 border-white/20" : "bg-background border-muted"
                )}>
                  <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-2">Cliente Destino</p>
                  <p className="text-2xl font-black">{selectedClient?.fullName || "Aguardando seleção..."}</p>
                </div>

                <div className={cn(
                  "p-8 rounded-[2rem] border-2",
                  isReady ? "bg-white/10 border-white/20" : "bg-background border-muted"
                )}>
                  <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-4 flex items-center gap-2">
                    <Package className="size-4" /> Itens no carrinho
                  </p>
                  <div className="space-y-3">
                    {selectedItems.filter(i => i.productId).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-lg font-bold border-b border-white/10 pb-2 last:border-0 last:pb-0">
                        <span className="opacity-90">{item.quantity}x {item.name}</span>
                        <span className="font-black">R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {selectedItems.filter(i => i.productId).length === 0 && (
                      <p className="text-lg italic opacity-40 font-bold">Nenhum produto adicionado.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest opacity-60">Desconto Aplicado (R$)</Label>
                    <Input
                      type="number"
                      className={cn(
                        "h-14 text-xl font-black rounded-xl border-2",
                        isReady ? "bg-white/10 border-white/20 text-white" : "bg-background"
                      )}
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest opacity-60">Taxas Adicionais (R$)</Label>
                    <Input
                      type="number"
                      className={cn(
                        "h-14 text-xl font-black rounded-xl border-2",
                        isReady ? "bg-white/10 border-white/20 text-white" : "bg-background"
                      )}
                      value={additionalFee}
                      onChange={(e) => setAdditionalFee(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className={cn(
                  "p-10 rounded-[2.5rem] shadow-2xl text-center border-4",
                  isReady ? "bg-white text-primary border-white" : "bg-background text-muted-foreground border-muted"
                )}>
                  <p className="text-xs font-black uppercase tracking-[0.3em] mb-2 opacity-60">Total Final</p>
                  <p className="text-5xl md:text-7xl font-black tracking-tighter">R$ {finalTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-10 pt-0">
            <Button 
              type="submit" 
              size="lg"
              className={cn(
                "w-full h-24 text-2xl font-black rounded-[2rem] shadow-2xl transition-all active:scale-95",
                isReady 
                  ? "bg-white text-primary hover:bg-white/90 scale-[1.01] hover:shadow-primary/20" 
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              disabled={!isReady}
            >
              <ReceiptText className="mr-4 size-10" />
              FINALIZAR VENDA
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
