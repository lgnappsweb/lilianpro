
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
  CheckCircle2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !selectedClientId || selectedItems.some(i => !i.productId)) {
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
    <div className="space-y-8 max-w-4xl mx-auto w-full overflow-x-hidden animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-primary font-headline">Nova Venda</h1>
        <p className="text-xl text-muted-foreground mt-2 font-medium">Cadastre e revise sua venda passo a passo.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sessão Cliente */}
        <Card className="border-none shadow-lg rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-4 bg-muted/20">
            <CardTitle className="flex items-center gap-4 text-2xl font-black">
              <User className="size-8 text-primary" />
              1. Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid gap-4">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Quem está comprando?</Label>
              <Select onValueChange={setSelectedClientId} value={selectedClientId}>
                <SelectTrigger className="h-16 text-xl font-bold rounded-2xl bg-background border-muted shadow-inner">
                  <SelectValue placeholder="Busque pelo nome da cliente..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-xl p-2">
                  {clients?.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-xl font-medium p-4 rounded-xl">{c.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sessão Produtos */}
        <Card className="border-none shadow-lg rounded-[2.5rem] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-8 pb-4 bg-muted/20">
            <CardTitle className="flex items-center gap-4 text-2xl font-black">
              <Package className="size-8 text-primary" />
              2. Produtos
            </CardTitle>
            <Button type="button" variant="outline" className="h-12 px-6 text-base font-black rounded-xl border-primary/20 text-primary hover:bg-primary/5" onClick={addItem}>
              <Plus className="size-5 mr-2" />
              Novo Item
            </Button>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {selectedItems.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end animate-in slide-in-from-left-4 duration-500 bg-muted/5 p-6 rounded-[2rem] border border-border/30 relative">
                
                {/* Seletor de Produto */}
                <div className={cn("space-y-3 col-span-1", item.productId ? "md:col-span-6" : "md:col-span-11")}>
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Produto</Label>
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
                    <SelectTrigger className="text-lg h-14 font-bold rounded-xl bg-background shadow-inner">
                      <SelectValue placeholder="Escolha um produto..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl shadow-xl p-2">
                      {products?.map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-lg font-medium p-4 rounded-xl">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Campos condicionais */}
                {item.productId && (
                  <>
                    <div className="col-span-1 md:col-span-2 space-y-3 animate-in zoom-in-95 duration-300">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground text-center block">Qtd</Label>
                      <Input
                        type="number"
                        min="1"
                        className="h-14 text-2xl font-black text-center rounded-xl bg-background shadow-inner border-primary/20"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...selectedItems];
                          newItems[index].quantity = parseInt(e.target.value) || 1;
                          setSelectedItems(newItems);
                        }}
                      />
                    </div>
                    <div className="col-span-1 md:col-span-3 space-y-3 animate-in zoom-in-95 duration-300">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Item</Label>
                      <div className="h-14 flex items-center px-4 bg-primary/5 rounded-xl text-xl font-black text-primary border border-primary/10">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </>
                )}

                {/* Remover */}
                <div className="col-span-1 md:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-14 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="size-7" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sessão Pagamento */}
        <Card className="border-none shadow-lg rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-4 bg-muted/20">
            <CardTitle className="flex items-center gap-4 text-2xl font-black">
              <CreditCard className="size-8 text-primary" />
              3. Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-16 text-xl font-bold rounded-2xl bg-background shadow-inner border-muted">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-xl p-2">
                    <SelectItem value="pix" className="text-xl font-medium p-4 rounded-xl">Pix</SelectItem>
                    <SelectItem value="dinheiro" className="text-xl font-medium p-4 rounded-xl">Dinheiro</SelectItem>
                    <SelectItem value="cartao" className="text-xl font-medium p-4 rounded-xl">Cartão</SelectItem>
                    <SelectItem value="fiado" className="text-xl font-medium p-4 rounded-xl">Fiado / Prazo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Data de Vencimento</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-6 text-primary/40" />
                  <Input type="date" className="h-16 pl-14 text-xl font-bold rounded-2xl bg-background shadow-inner border-muted" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
              <div className="sm:col-span-2 space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Observações do Pedido</Label>
                <textarea 
                  className="w-full min-h-[120px] rounded-2xl border-muted bg-background px-6 py-4 text-xl font-medium shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary border" 
                  placeholder="Ex: Cliente vai retirar na quarta-feira..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessão Check-in (Resumo Inteligente) */}
        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-primary text-primary-foreground">
          <CardHeader className="p-10 pb-4">
            <CardTitle className="flex items-center gap-4 text-3xl font-black uppercase tracking-tighter">
              <ClipboardCheck className="size-10" />
              4. Check-in da Venda
            </CardTitle>
            <p className="text-lg opacity-80 font-bold">Confira todos os dados antes de finalizar</p>
          </CardHeader>
          <CardContent className="p-10 pt-6 space-y-10">
            
            {/* Lista de Conferência */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-white/10 p-5 rounded-2xl border border-white/20">
                <CheckCircle2 className={cn("size-8", selectedClient ? "text-green-400" : "text-white/30")} />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest opacity-60">Cliente</p>
                  <p className="text-2xl font-black">{selectedClient?.fullName || "Aguardando seleção..."}</p>
                </div>
              </div>

              <div className="bg-white/10 p-6 rounded-3xl border border-white/20 space-y-4">
                <p className="text-xs font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                  <Package className="size-4" /> Itens no Carrinho
                </p>
                <div className="space-y-3">
                  {selectedItems.filter(i => i.productId).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-lg font-bold border-b border-white/10 pb-2 last:border-0">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-black">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  {selectedItems.filter(i => i.productId).length === 0 && (
                    <p className="italic opacity-50">Nenhum produto adicionado ainda.</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between bg-white/10 p-5 rounded-2xl border border-white/20">
                <div className="flex items-center gap-4">
                  <CreditCard className="size-7" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest opacity-60">Pagamento</p>
                    <p className="text-xl font-black capitalize">{paymentMethod}</p>
                  </div>
                </div>
                {dueDate && (
                  <div className="text-right">
                    <p className="text-xs font-black uppercase tracking-widest opacity-60">Vencimento</p>
                    <p className="text-xl font-black">{new Date(dueDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator className="bg-white/20" />

            {/* Ajustes Financeiros */}
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-primary-foreground/70">Desconto Aplicado (R$)</Label>
                <Input
                  type="number"
                  className="h-16 bg-white/20 border-white/30 text-white text-3xl font-black rounded-2xl shadow-inner placeholder:text-white/40 focus:bg-white/30"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-primary-foreground/70">Taxas Adicionais (R$)</Label>
                <Input
                  type="number"
                  className="h-16 bg-white/20 border-white/30 text-white text-3xl font-black rounded-2xl shadow-inner placeholder:text-white/40 focus:bg-white/30"
                  value={additionalFee}
                  onChange={(e) => setAdditionalFee(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Total Final */}
            <div className="bg-white text-primary p-10 rounded-[2.5rem] shadow-2xl text-center border-4 border-white/20 animate-in zoom-in-95 duration-500">
              <p className="text-sm font-black uppercase tracking-[0.3em] mb-2 opacity-60">Total Final a Receber</p>
              <p className="text-7xl font-black tracking-tighter drop-shadow-sm">R$ {finalTotal.toFixed(2)}</p>
            </div>
          </CardContent>
          <CardFooter className="p-10 pt-0">
            <Button 
              type="submit" 
              className="w-full h-20 bg-white text-primary hover:bg-pink-50 text-2xl font-black rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              disabled={!selectedClientId || selectedItems.some(i => !i.productId)}
            >
              <ReceiptText className="mr-4 size-8" />
              FINALIZAR VENDA
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
