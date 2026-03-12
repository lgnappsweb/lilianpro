
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
    <div className="space-y-6 max-w-4xl mx-auto w-full overflow-x-hidden animate-in fade-in duration-500 pb-20">
      <div className="px-1">
        <h1 className="text-2xl font-bold tracking-tight text-primary font-headline">Nova Venda</h1>
        <p className="text-sm text-muted-foreground mt-1">Cadastre os detalhes da transação passo a passo.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sessão Cliente */}
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-muted/30 py-4">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <User className="size-4 text-primary" />
              1. Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quem está comprando?</Label>
              <Select onValueChange={setSelectedClientId} value={selectedClientId}>
                <SelectTrigger className="h-11 text-sm font-medium rounded-lg bg-background border-muted shadow-sm">
                  <SelectValue placeholder="Busque pelo nome da cliente..." />
                </SelectTrigger>
                <SelectContent className="rounded-lg shadow-lg">
                  {clients?.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-sm font-medium p-2.5">{c.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sessão Produtos */}
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-muted/30 py-4">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Package className="size-4 text-primary" />
              2. Produtos
            </CardTitle>
            <Button type="button" variant="outline" size="sm" className="h-9 px-3 font-bold border-primary/20 text-primary" onClick={addItem}>
              <Plus className="size-3.5 mr-1" />
              Novo Item
            </Button>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {selectedItems.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end animate-in slide-in-from-left-2 duration-300 bg-muted/10 p-4 rounded-lg border border-border/30 relative">
                
                {/* Seletor de Produto */}
                <div className={cn("space-y-2 col-span-1", item.productId ? "md:col-span-6" : "md:col-span-11")}>
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Produto</Label>
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
                    <SelectTrigger className="text-xs h-10 rounded-md bg-background">
                      <SelectValue placeholder="Escolha um produto..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-md shadow-md">
                      {products?.map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-xs p-2.5">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Campos condicionais */}
                {item.productId && (
                  <>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center block">Qtd</Label>
                      <Input
                        type="number"
                        min="1"
                        className="h-10 text-center font-bold text-xs"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...selectedItems];
                          newItems[index].quantity = parseInt(e.target.value) || 1;
                          setSelectedItems(newItems);
                        }}
                      />
                    </div>
                    <div className="col-span-1 md:col-span-3 space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Subtotal</Label>
                      <div className="h-10 flex items-center px-3 bg-primary/5 rounded-md text-xs font-bold text-primary border border-primary/10">
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
                    className="size-10 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sessão Pagamento */}
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-muted/30 py-4">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <CreditCard className="size-4 text-primary" />
              3. Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-11 text-sm font-medium rounded-lg border-muted">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="pix">Pix</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="fiado">Fiado / Prazo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vencimento</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input type="date" className="h-11 pl-10 text-sm font-medium" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notas</Label>
                <textarea 
                  className="w-full min-h-[80px] rounded-lg border-muted bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary border" 
                  placeholder="Informações adicionais..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessão Check-in (Resumo Inteligente) */}
        <Card className={cn(
          "border-none shadow-xl rounded-2xl overflow-hidden transition-all duration-500",
          isReady ? "bg-green-600 text-white" : "bg-muted/50 text-muted-foreground"
        )}>
          <CardHeader className="p-6 pb-2">
            <CardTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
              <ClipboardCheck className="size-6" />
              4. Check-in da Venda
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-6">
            <div className="space-y-3">
              <div className={cn(
                "flex items-center gap-3 p-3 rounded-xl border",
                isReady ? "bg-white/10 border-white/20" : "bg-background/50 border-muted"
              )}>
                <CheckCircle2 className={cn("size-5", selectedClient ? (isReady ? "text-green-300" : "text-green-600") : "opacity-30")} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Cliente</p>
                  <p className="text-sm font-bold">{selectedClient?.fullName || "Aguardando seleção..."}</p>
                </div>
              </div>

              <div className={cn(
                "p-4 rounded-xl border space-y-2",
                isReady ? "bg-white/10 border-white/20" : "bg-background/50 border-muted"
              )}>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-1">
                  <Package className="size-3" /> Itens selecionados
                </p>
                <div className="space-y-1.5">
                  {selectedItems.filter(i => i.productId).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-medium border-b border-white/5 pb-1 last:border-0 last:pb-0">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-bold">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  {selectedItems.filter(i => i.productId).length === 0 && (
                    <p className="text-xs italic opacity-50">Nenhum produto adicionado ainda.</p>
                  )}
                </div>
              </div>
            </div>

            <Separator className={isReady ? "bg-white/20" : "bg-muted"} />

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className={cn("text-[10px] font-bold uppercase tracking-widest", isReady ? "text-white/70" : "text-muted-foreground")}>Desconto (R$)</Label>
                <Input
                  type="number"
                  className={cn(
                    "h-10 text-sm font-bold rounded-lg border",
                    isReady ? "bg-white/20 border-white/30 text-white" : "bg-background border-muted"
                  )}
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label className={cn("text-[10px] font-bold uppercase tracking-widest", isReady ? "text-white/70" : "text-muted-foreground")}>Taxas (R$)</Label>
                <Input
                  type="number"
                  className={cn(
                    "h-10 text-sm font-bold rounded-lg border",
                    isReady ? "bg-white/20 border-white/30 text-white" : "bg-background border-muted"
                  )}
                  value={additionalFee}
                  onChange={(e) => setAdditionalFee(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className={cn(
              "p-6 rounded-2xl shadow-inner text-center border",
              isReady ? "bg-white text-green-700 border-white/20" : "bg-background text-muted-foreground border-muted"
            )}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5 opacity-60">Total Final</p>
              <p className="text-3xl font-black tracking-tight">R$ {finalTotal.toFixed(2)}</p>
            </div>
          </CardContent>
          <CardFooter className="p-6 pt-0">
            <Button 
              type="submit" 
              size="lg"
              className={cn(
                "w-full h-14 text-base font-bold rounded-xl shadow-md transition-all",
                isReady 
                  ? "bg-white text-green-700 hover:bg-green-50 scale-[1.02]" 
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              disabled={!isReady}
            >
              <ReceiptText className="mr-2 size-5" />
              FINALIZAR VENDA
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
