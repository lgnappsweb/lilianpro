
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
        <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">Nova Venda</h1>
        <p className="text-muted-foreground mt-2">Cadastre os detalhes da transação passo a passo.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sessão Cliente */}
        <Card className="border-none shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <User className="size-5 text-primary" />
              1. Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quem está comprando?</Label>
              <Select onValueChange={setSelectedClientId} value={selectedClientId}>
                <SelectTrigger className="h-12 text-base font-medium rounded-xl bg-background border-muted shadow-sm">
                  <SelectValue placeholder="Busque pelo nome da cliente..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg">
                  {clients?.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-base font-medium p-3">{c.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sessão Produtos */}
        <Card className="border-none shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Package className="size-5 text-primary" />
              2. Produtos
            </CardTitle>
            <Button type="button" variant="outline" size="sm" className="h-10 px-4 font-bold border-primary/20 text-primary" onClick={addItem}>
              <Plus className="size-4 mr-1" />
              Novo Item
            </Button>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {selectedItems.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end animate-in slide-in-from-left-2 duration-300 bg-muted/10 p-4 rounded-xl border border-border/30 relative">
                
                {/* Seletor de Produto */}
                <div className={cn("space-y-2 col-span-1", item.productId ? "md:col-span-6" : "md:col-span-11")}>
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Produto</Label>
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
                    <SelectTrigger className="text-sm h-11 rounded-lg bg-background">
                      <SelectValue placeholder="Escolha um produto..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg shadow-md">
                      {products?.map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-sm p-3">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Campos condicionais */}
                {item.productId && (
                  <>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center block">Qtd</Label>
                      <Input
                        type="number"
                        min="1"
                        className="h-11 text-center font-bold"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...selectedItems];
                          newItems[index].quantity = parseInt(e.target.value) || 1;
                          setSelectedItems(newItems);
                        }}
                      />
                    </div>
                    <div className="col-span-1 md:col-span-3 space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subtotal</Label>
                      <div className="h-11 flex items-center px-4 bg-primary/5 rounded-lg text-sm font-bold text-primary border border-primary/10">
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
                    className="size-11 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="size-5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sessão Pagamento */}
        <Card className="border-none shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <CreditCard className="size-5 text-primary" />
              3. Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-12 text-base font-medium rounded-xl border-muted">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="pix">Pix</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="fiado">Fiado / Prazo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vencimento</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input type="date" className="h-12 pl-10 text-base font-medium" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notas</Label>
                <textarea 
                  className="w-full min-h-[100px] rounded-xl border-muted bg-background px-4 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary border" 
                  placeholder="Informações adicionais..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessão Check-in (Resumo Inteligente) */}
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-primary text-primary-foreground">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
              <ClipboardCheck className="size-8" />
              4. Check-in da Venda
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl border border-white/20">
                <CheckCircle2 className={cn("size-6", selectedClient ? "text-green-400" : "text-white/30")} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Cliente</p>
                  <p className="text-lg font-bold">{selectedClient?.fullName || "Aguardando seleção..."}</p>
                </div>
              </div>

              <div className="bg-white/10 p-5 rounded-2xl border border-white/20 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-1">
                  <Package className="size-3" /> Itens
                </p>
                <div className="space-y-2">
                  {selectedItems.filter(i => i.productId).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm font-medium border-b border-white/10 pb-1 last:border-0">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-bold">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="bg-white/20" />

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70">Desconto (R$)</Label>
                <Input
                  type="number"
                  className="h-12 bg-white/20 border-white/30 text-white text-xl font-bold rounded-xl"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70">Taxas (R$)</Label>
                <Input
                  type="number"
                  className="h-12 bg-white/20 border-white/30 text-white text-xl font-bold rounded-xl"
                  value={additionalFee}
                  onChange={(e) => setAdditionalFee(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="bg-white text-primary p-8 rounded-3xl shadow-lg text-center border-2 border-white/20">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Total a Receber</p>
              <p className="text-5xl font-black tracking-tighter">R$ {finalTotal.toFixed(2)}</p>
            </div>
          </CardContent>
          <CardFooter className="p-8 pt-0">
            <Button 
              type="submit" 
              size="lg"
              className="w-full h-16 bg-white text-primary hover:bg-pink-50 text-xl font-black rounded-xl shadow-md"
              disabled={!selectedClientId || selectedItems.some(i => !i.productId)}
            >
              <ReceiptText className="mr-3 size-6" />
              FINALIZAR VENDA
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
