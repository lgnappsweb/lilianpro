
"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
  Loader2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useRouter } from "next/navigation";

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
    <div className="space-y-8 max-w-5xl mx-auto w-full overflow-x-hidden animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary font-headline">Nova Venda</h1>
        <p className="text-lg text-muted-foreground mt-2 font-medium">Cadastre uma venda rapidamente no seu sistema.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
          <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
            <CardHeader className="p-6 pb-2 bg-muted/20">
              <CardTitle className="flex items-center gap-3 text-xl font-black">
                <User className="size-6 text-primary" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-3">
                <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Selecionar Cliente</Label>
                <Select onValueChange={setSelectedClientId} value={selectedClientId}>
                  <SelectTrigger className="h-14 text-lg font-bold rounded-2xl bg-background border-muted shadow-inner">
                    <SelectValue placeholder="Busque pelo nome da cliente..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-xl p-2">
                    {clients?.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-lg font-medium p-3 rounded-xl">{c.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-2 bg-muted/20">
              <CardTitle className="flex items-center gap-3 text-xl font-black">
                <Package className="size-6 text-primary" />
                Produtos
              </CardTitle>
              <Button type="button" variant="outline" size="sm" className="h-10 px-4 text-sm font-black rounded-xl border-primary/20 text-primary" onClick={addItem}>
                <Plus className="size-4 mr-2" />
                Adicionar Item
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {selectedItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-end animate-in slide-in-from-left-4 duration-500 bg-muted/10 p-4 rounded-2xl border border-border/30">
                  <div className="col-span-12 sm:col-span-6 space-y-2">
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
                    }}>
                      <SelectTrigger className="text-base h-12 font-bold rounded-xl bg-background shadow-inner">
                        <SelectValue placeholder="Escolha um produto..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl shadow-xl p-2">
                        {products?.map(p => (
                          <SelectItem key={p.id} value={p.id} className="text-base font-medium p-3 rounded-xl">{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4 sm:col-span-2 space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground text-center block">Qtd</Label>
                    <Input
                      type="number"
                      min="1"
                      className="h-12 text-lg font-black text-center rounded-xl bg-background shadow-inner"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...selectedItems];
                        newItems[index].quantity = parseInt(e.target.value) || 1;
                        setSelectedItems(newItems);
                      }}
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-3 space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Item</Label>
                    <div className="h-12 flex items-center px-4 bg-primary/10 rounded-xl text-lg font-black text-primary border border-primary/10">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-12 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="size-6" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
            <CardHeader className="p-6 pb-2 bg-muted/20">
              <CardTitle className="flex items-center gap-3 text-xl font-black">
                <CreditCard className="size-6 text-primary" />
                Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Forma de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="h-14 text-lg font-bold rounded-2xl bg-background shadow-inner">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl shadow-xl p-2">
                      <SelectItem value="pix" className="text-lg font-medium p-3 rounded-xl">Pix</SelectItem>
                      <SelectItem value="dinheiro" className="text-lg font-medium p-3 rounded-xl">Dinheiro</SelectItem>
                      <SelectItem value="cartao" className="text-lg font-medium p-3 rounded-xl">Cartão</SelectItem>
                      <SelectItem value="fiado" className="text-lg font-medium p-3 rounded-xl">Fiado / Prazo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Data de Vencimento</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-primary/60" />
                    <Input type="date" className="h-14 pl-12 text-lg font-bold rounded-2xl bg-background shadow-inner" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Observações do Pedido</Label>
                  <textarea 
                    className="w-full min-h-[100px] rounded-2xl border border-input bg-background px-4 py-3 text-lg font-medium shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" 
                    placeholder="Ex: Entrega agendada para sábado, presente para aniversário..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-2xl md:sticky md:top-24 bg-primary text-primary-foreground rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-black uppercase tracking-widest">Resumo da Venda</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="flex justify-between text-lg font-bold opacity-90">
                <span>Subtotal Itens</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-primary-foreground/70">Desconto Aplicado (R$)</Label>
                <Input
                  type="number"
                  className="h-12 bg-white/20 border-white/30 text-white text-xl font-black rounded-xl shadow-inner placeholder:text-white/40"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-primary-foreground/70">Taxas Adicionais (R$)</Label>
                <Input
                  type="number"
                  className="h-12 bg-white/20 border-white/30 text-white text-xl font-black rounded-xl shadow-inner placeholder:text-white/40"
                  value={additionalFee}
                  onChange={(e) => setAdditionalFee(parseFloat(e.target.value) || 0)}
                />
              </div>
              <Separator className="bg-white/20" />
              <div className="flex justify-between items-center py-4">
                <span className="font-bold text-xl uppercase tracking-widest">Total Final</span>
                <span className="text-4xl font-black drop-shadow-md">R$ {finalTotal.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter className="p-8 pt-0">
              <Button type="submit" className="w-full bg-white text-primary hover:bg-pink-50 font-black h-16 text-xl rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                <ReceiptText className="mr-3 size-7" />
                FINALIZAR VENDA
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
