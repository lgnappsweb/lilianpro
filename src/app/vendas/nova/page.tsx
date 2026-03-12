"use client";

import React, { useState } from "react";
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
  ArrowRight,
  ReceiptText,
  User,
  Package,
  CreditCard,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function NovaVendaPage() {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState([
    { id: "temp-1", productId: "", quantity: 1, price: 0 }
  ]);
  const [discount, setDiscount] = useState(0);

  const addItem = () => {
    setSelectedItems([...selectedItems, { id: `temp-${Date.now()}`, productId: "", quantity: 1, price: 0 }]);
  };

  const removeItem = (id: string) => {
    if (selectedItems.length > 1) {
      setSelectedItems(selectedItems.filter(item => item.id !== id));
    }
  };

  const calculateSubtotal = () => {
    return selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  };

  const subtotal = calculateSubtotal();
  const finalTotal = Math.max(0, subtotal - discount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Venda registrada!",
      description: "A venda foi salva com sucesso e o estoque atualizado.",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">Nova Venda</h1>
        <p className="text-muted-foreground mt-1">Registre uma nova venda de forma rápida e prática.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Form Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5 text-primary" />
                Informações da Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="cliente">Selecionar Cliente</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Busque uma cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Maria Oliveira</SelectItem>
                      <SelectItem value="3">Juliana Ferreira</SelectItem>
                      <SelectItem value="new">+ Cadastrar Nova Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                      const newItems = [...selectedItems];
                      newItems[index].productId = val;
                      newItems[index].price = val === "perfume" ? 219.90 : 29.90;
                      setSelectedItems(newItems);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o produto..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="perfume">Perfume Essencial Oud (Natura) - R$ 219,90</SelectItem>
                        <SelectItem value="batom">Batom Ultra Color (Avon) - R$ 29,90</SelectItem>
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
                  <Select defaultValue="pix">
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
                    <Input type="date" className="pl-10" />
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Observações</Label>
                  <textarea className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Algum detalhe importante?" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Summary Card */}
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
                  className="h-8 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
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
