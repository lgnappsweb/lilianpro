
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
    <div className="space-y-6 max-w-4xl mx-auto w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary font-headline">Nova Venda</h1>
        <p className="text-sm text-muted-foreground mt-1">Cadastre uma venda rapidamente.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="size-4 text-primary" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="grid gap-2">
                <Select onValueChange={setSelectedClientId} value={selectedClientId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="size-4 text-primary" />
                Produtos
              </CardTitle>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={addItem}>
                <Plus className="size-3 mr-1" />
                Item
              </Button>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
              {selectedItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end animate-in slide-in-from-left-2 duration-300">
                  <div className="col-span-12 sm:col-span-6 space-y-1">
                    {index === 0 && <Label className="text-[10px] sm:text-xs">Produto</Label>}
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
                      <SelectTrigger className="text-xs h-9">
                        <SelectValue placeholder="Produto..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4 sm:col-span-2 space-y-1">
                    {index === 0 && <Label className="text-[10px] sm:text-xs">Qtd</Label>}
                    <Input
                      type="number"
                      min="1"
                      className="h-9 text-xs"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...selectedItems];
                        newItems[index].quantity = parseInt(e.target.value) || 1;
                        setSelectedItems(newItems);
                      }}
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-3 space-y-1">
                    {index === 0 && <Label className="text-[10px] sm:text-xs">Total</Label>}
                    <div className="h-9 flex items-center px-2 bg-muted rounded-md text-[10px] font-medium truncate">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="size-4 text-primary" />
                Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Forma</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="h-9 text-xs">
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
                <div className="space-y-1">
                  <Label className="text-xs">Vencimento</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                    <Input type="date" className="h-9 pl-8 text-xs" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs">Observações</Label>
                  <textarea 
                    className="w-full min-h-[60px] rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
                    placeholder="Detalhes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm md:sticky md:top-24 bg-primary text-primary-foreground">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3">
              <div className="flex justify-between text-xs">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-primary-foreground/80">Desconto (R$)</Label>
                <Input
                  type="number"
                  className="h-8 bg-white/10 border-white/20 text-white text-xs"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-primary-foreground/80">Taxa (R$)</Label>
                <Input
                  type="number"
                  className="h-8 bg-white/10 border-white/20 text-white text-xs"
                  value={additionalFee}
                  onChange={(e) => setAdditionalFee(parseFloat(e.target.value) || 0)}
                />
              </div>
              <Separator className="bg-white/20" />
              <div className="flex justify-between items-center py-2">
                <span className="font-semibold text-sm">Total</span>
                <span className="text-xl font-bold">R$ {finalTotal.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter className="p-4 sm:p-6 pt-0 sm:pt-0">
              <Button type="submit" className="w-full bg-white text-primary hover:bg-white/90 font-bold h-11 text-sm">
                <ReceiptText className="mr-2 size-4" />
                Finalizar
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
