
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

  // Consultas memoizadas
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

    // PADRÃO ELITE: Operação Non-blocking (salva em background)
    const orderRef = doc(db, "users", user.uid, "orders", orderId);
    addDocumentNonBlocking(collection(db, "users", user.uid, "orders"), orderData);

    // Salvar itens da ordem
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

    // PADRÃO ELITE: Feedback instantâneo e navegação sem esperar o await
    toast({
      title: "Venda registrada!",
      description: "A venda foi salva com sucesso e o estoque está sendo atualizado.",
    });
    router.push("/pedidos");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">Nova Venda</h1>
        <p className="text-muted-foreground mt-1">Registre uma nova venda de forma rápida e prática.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5 text-primary" />
                Informações da Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Label htmlFor="cliente">Selecionar Cliente</Label>
                <Select onValueChange={setSelectedClientId} value={selectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Busque uma cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>
                    ))}
                    <SelectItem value="new">+ Cadastrar Nova Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2">
                <Package className="size-5 text-primary" />
                Produtos
              </CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="size-4 mr-1" />
                Adicionar
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedItems.map((item, index) => (
                <div key={item.id} className="flex gap-4 items-end animate-in slide-in-from-left-2 duration-300">
                  <div className="flex-1 space-y-2">
                    {index === 0 && <Label>Produto</Label>}
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
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o produto..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.brand}) - R$ {Number(p.salePrice).toFixed(2)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20 space-y-2">
                    {index === 0 && <Label>Qtd</Label>}
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...selectedItems];
                        newItems[index].quantity = parseInt(e.target.value) || 1;
                        setSelectedItems(newItems);
                      }}
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    {index === 0 && <Label>Preço</Label>}
                    <div className="h-10 flex items-center px-3 bg-muted rounded-md text-sm font-medium">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-5 text-primary" />
                Pagamento & Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">Pix</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="fiado">Fiado / Prazo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data de Vencimento</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input type="date" className="pl-10" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Observações</Label>
                  <textarea 
                    className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
                    placeholder="Algum detalhe importante?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm sticky top-24 bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-xl">Resumo da Venda</CardTitle>
              <CardDescription className="text-primary-foreground/70">Confira os valores finais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-primary-foreground/80">Aplicar Desconto (R$)</Label>
                <Input
                  type="number"
                  className="h-8 bg-white/10 border-white/20 text-white"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-primary-foreground/80">Taxa Adicional (R$)</Label>
                <Input
                  type="number"
                  className="h-8 bg-white/10 border-white/20 text-white"
                  value={additionalFee}
                  onChange={(e) => setAdditionalFee(parseFloat(e.target.value) || 0)}
                />
              </div>
              <Separator className="bg-white/20" />
              <div className="flex justify-between items-center py-2">
                <span className="font-semibold text-lg">Total Final</span>
                <span className="text-2xl font-bold">R$ {finalTotal.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-white text-primary hover:bg-white/90 font-bold py-6 text-lg">
                <ReceiptText className="mr-2 size-5" />
                Finalizar Venda
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
