
"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  ReceiptText,
  Trash2,
  Plus,
  Loader2,
  Info,
  Tag,
  Search,
  UserCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SaleItem {
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

export default function NovaVendaPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);

  // --- BUSCA DE CLIENTES EXISTENTES ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  const clientsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "clients");
  }, [db, user]);
  const { data: existingClients } = useCollection(clientsQuery);

  const filteredClients = useMemo(() => {
    if (!existingClients || !searchTerm) return [];
    return existingClients.filter(c => 
      c.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
  }, [existingClients, searchTerm]);

  // --- ESTADO DO CLIENTE (FORM) ---
  const [clientData, setClientData] = useState({
    fullName: "",
    phone: "",
    city: "",
    neighborhood: "",
    address: "",
    notes: "",
  });

  // --- ESTADO DOS PRODUTOS (LISTA) ---
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);

  // --- ESTADO DO PAGAMENTO E TOTAIS ---
  const [paymentMethod, setPaymentMethod] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saleNotes, setSaleNotes] = useState("");
  const [discount, setDiscount] = useState(0);
  const [additionalFee, setAdditionalFee] = useState(0);

  // Define data atual no fuso horário do Brasil para o vencimento padrão
  useEffect(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    setDueDate(formatter.format(now));
  }, []);

  // --- MÁSCARAS E UTILITÁRIOS ---
  const formatPhone = (value: string) => {
    if (!value) return "";
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 2) return `(${cleaned}`;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  const maskCurrency = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    const number = parseFloat(digits) / 100;
    return number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const unmaskCurrency = (value: string) => {
    if (!value) return 0;
    const cleaned = value.toString().replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  };

  // --- GERENCIAMENTO DE CLIENTE ---
  const handleSelectClient = (client: any) => {
    setSelectedClient(client);
    setClientData({
      fullName: client.fullName,
      phone: client.phone,
      city: client.city || "",
      neighborhood: client.neighborhood || "",
      address: client.address || "",
      notes: client.notes || "",
    });
    setSearchTerm("");
  };

  const handleClearClient = () => {
    setSelectedClient(null);
    setClientData({
      fullName: "",
      phone: "",
      city: "",
      neighborhood: "",
      address: "",
      notes: "",
    });
  };

  // --- GERENCIAMENTO DE ITENS ---
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

      // Cálculo automático de custo se mudar marca ou preço de revista
      if (field === "catalogPrice" || field === "brand") {
        const catalog = unmaskCurrency(updatedItem.catalogPrice);
        const brand = updatedItem.brand;
        if (catalog > 0 && brand) {
          let discountPct = 0;
          if (brand === "VERDE (N)") discountPct = 0.30;
          else if (brand === "ROSA (A)") discountPct = 0.35;
          else if (brand === "MARROM (C&E)") discountPct = 0.15;

          if (discountPct > 0) {
            const calculatedCost = catalog * (1 - discountPct);
            updatedItem.costPrice = maskCurrency((calculatedCost * 100).toFixed(0));
          }
        }
      }
      return updatedItem;
    }));
  };

  // --- LOGICA DE TOTAIS ---
  const subtotal = useMemo(() => {
    return saleItems.reduce((acc, item) => acc + unmaskCurrency(item.salePrice), 0);
  }, [saleItems]);

  const finalTotal = Math.max(0, subtotal - discount + additionalFee);

  const isReady = useMemo(() => {
    return (
      clientData.fullName &&
      clientData.phone &&
      saleItems.length > 0 &&
      saleItems.every(item => item.name && item.brand && item.salePrice) &&
      paymentMethod
    );
  }, [clientData, saleItems, paymentMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !isReady) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Preencha os campos obrigatórios do cliente, produtos e pagamento.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const finalClientId = selectedClient ? selectedClient.id : `cli-${Date.now()}`;
      const orderId = `ord-${Date.now()}`;

      // 1. Salvar Novo Cliente (se não for selecionado um existente)
      if (!selectedClient) {
        const finalClientData = {
          ...clientData,
          id: finalClientId,
          adminId: user.uid,
          registrationDate: new Date().toISOString(),
        };
        setDocumentNonBlocking(doc(db, "users", user.uid, "clients", finalClientId), finalClientData, { merge: true });
      }

      // 2. Salvar Pedido Root (Exatamente como funciona no app)
      const orderData = {
        id: orderId,
        adminId: user.uid,
        clientId: finalClientId,
        clientName: clientData.fullName,
        orderDate: new Date().toISOString(),
        totalAmount: subtotal,
        discountAmount: discount,
        additionalFeeAmount: additionalFee,
        finalAmount: finalTotal,
        paymentMethod,
        paymentStatus: paymentMethod === "a prazo" ? "Pendente" : "Pago",
        dueDate: dueDate || null,
        notes: saleNotes,
        isDeleted: false,
      };
      setDocumentNonBlocking(doc(db, "users", user.uid, "orders", orderId), orderData, { merge: true });

      // 3. Salvar Produtos e Itens do Pedido
      saleItems.forEach((item, index) => {
        const productId = `prod-${Date.now()}-${index}`;
        const itemId = `item-${Date.now()}-${index}`;

        // Salvar Produto no Catálogo (sempre salvamos como novo produto para esta venda rápida)
        const finalProductData = {
          id: productId,
          name: item.name,
          brand: item.brand,
          category: item.category,
          catalogPrice: unmaskCurrency(item.catalogPrice),
          costPrice: unmaskCurrency(item.costPrice),
          salePrice: unmaskCurrency(item.salePrice),
          productCode: item.productCode,
          description: item.description,
          adminId: user.uid,
        };
        setDocumentNonBlocking(doc(db, "users", user.uid, "products", productId), finalProductData, { merge: true });

        // Salvar Item detalhado dentro do Pedido (Exatamente como o app exige)
        const orderItemData = {
          id: itemId,
          adminId: user.uid,
          orderId: orderId,
          productId: productId,
          productName: item.name,
          quantity: 1,
          unitPrice: unmaskCurrency(item.salePrice),
          subtotal: unmaskCurrency(item.salePrice),
        };
        setDocumentNonBlocking(doc(db, "users", user.uid, "orders", orderId, "orderItems", itemId), orderItemData, { merge: true });
      });

      toast({
        title: "Venda Concluída!",
        description: `Registro salvo para ${clientData.fullName}.`,
      });
      
      router.push("/pedidos");
    } catch (error) {
      console.error("Erro na venda rápida:", error);
      toast({
        variant: "destructive",
        title: "Erro ao processar",
        description: "Ocorreu um problema ao salvar os dados da venda.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12 w-full animate-in fade-in duration-500 pb-32">
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <ShoppingBag className="size-16 sm:size-24 text-primary" />
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap px-2">NOVA VENDA</h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">CADASTRE CLIENTE, PRODUTO E VENDA DE UMA SÓ VEZ</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        
        {/* 1. IDENTIFICAÇÃO DA CLIENTE */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/80 p-6 sm:p-8 border-b-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex flex-row items-center gap-3 text-xl sm:text-3xl font-black text-left uppercase px-2">
              <User className="size-6 sm:size-8 text-primary" />
              1. Identificação da Cliente
            </CardTitle>
            {selectedClient && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClearClient}
                className="rounded-full font-black text-[10px] uppercase tracking-widest border-primary/20 text-primary"
              >
                Trocar Cliente
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0 space-y-0">
            {/* BUSCA DE CLIENTE */}
            {!selectedClient && (
              <div className="relative border-b-4 border-muted group">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 size-6 text-primary group-focus-within:scale-110 transition-transform" />
                <Input
                  placeholder="Buscar cliente existente..."
                  className="h-20 sm:h-24 pl-20 pr-8 text-xl sm:text-2xl font-black rounded-none border-none focus:ring-0 w-full bg-primary/5 italic placeholder:text-primary/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {filteredClients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-background border-x-4 border-b-4 border-primary/20 shadow-2xl animate-in slide-in-from-top-2 duration-200">
                    {filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className="w-full p-6 text-left hover:bg-primary/10 border-b last:border-none flex items-center justify-between group/item"
                      >
                        <div>
                          <p className="font-black text-xl uppercase italic group-hover/item:text-primary transition-colors">{client.fullName}</p>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{client.phone}</p>
                        </div>
                        <UserCheck className="size-6 text-primary opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid sm:grid-cols-2">
              <Input
                placeholder="Nome Completo"
                className={cn(
                  "h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted focus:border-primary w-full px-8 bg-background",
                  selectedClient && "bg-muted/30 opacity-80"
                )}
                value={clientData.fullName}
                onChange={(e) => !selectedClient && setClientData(prev => ({ ...prev, fullName: e.target.value }))}
                readOnly={!!selectedClient}
                required
              />
              <Input
                placeholder="WhatsApp"
                className={cn(
                  "h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted focus:border-primary w-full px-8 bg-background",
                  selectedClient && "bg-muted/30 opacity-80"
                )}
                value={clientData.phone}
                onChange={(e) => !selectedClient && setClientData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                readOnly={!!selectedClient}
                required
              />
            </div>

            <div className="grid sm:grid-cols-2">
              <Input
                placeholder="Cidade"
                className={cn(
                  "h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted focus:border-primary w-full px-8 bg-background",
                  selectedClient && "bg-muted/30 opacity-80"
                )}
                value={clientData.city}
                onChange={(e) => !selectedClient && setClientData(prev => ({ ...prev, city: e.target.value }))}
                readOnly={!!selectedClient}
              />
              <Input
                placeholder="Bairro"
                className={cn(
                  "h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted focus:border-primary w-full px-8 bg-background",
                  selectedClient && "bg-muted/30 opacity-80"
                )}
                value={clientData.neighborhood}
                onChange={(e) => !selectedClient && setClientData(prev => ({ ...prev, neighborhood: e.target.value }))}
                readOnly={!!selectedClient}
              />
            </div>

            <Input
              placeholder="Endereço / Referência"
              className={cn(
                "h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-none border-none focus:border-primary w-full px-8 bg-background",
                selectedClient && "bg-muted/30 opacity-80"
              )}
              value={clientData.address}
              onChange={(e) => !selectedClient && setClientData(prev => ({ ...prev, address: e.target.value }))}
              readOnly={!!selectedClient}
            />
          </CardContent>
        </Card>

        {/* 2. PRODUTOS VENDIDOS */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/80 p-6 sm:p-8 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-xl sm:text-3xl font-black text-left uppercase px-2">
              <Package className="size-6 sm:size-8 text-primary" />
              2. Detalhes do Produto Vendido
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-0">
            {saleItems.length === 0 ? (
              <div className="p-16 sm:p-24 text-center space-y-6">
                <div className="flex justify-center">
                  <Package className="size-16 sm:size-24 text-muted-foreground opacity-20" />
                </div>
                <p className="text-muted-foreground italic font-black text-xl sm:text-2xl uppercase opacity-40 px-4">
                  Nenhum produto adicionado à venda.
                </p>
              </div>
            ) : (
              <div className="divide-y-8 divide-muted/30">
                {saleItems.map((item, index) => (
                  <div key={item.tempId} className="p-0 space-y-0 relative group">
                    
                    <div className="bg-primary/5 px-8 h-16 sm:h-20 flex items-center justify-between text-xs sm:text-xl font-black text-primary uppercase tracking-widest border-b-4 border-primary/10">
                      <span className="italic flex items-center gap-3">
                        <Tag className="size-5 hidden sm:block" />
                        Item #{(index + 1).toString().padStart(2, '0')}
                      </span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem(item.tempId)}
                        className="h-10 sm:h-12 px-4 sm:px-6 rounded-xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all text-[10px] sm:text-xs"
                      >
                        <Trash2 className="size-4 mr-2" /> APAGAR
                      </Button>
                    </div>

                    <Input
                      placeholder="Nome do Produto"
                      className="h-16 sm:h-20 text-xl sm:text-3xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted focus:border-primary w-full px-8 bg-background"
                      value={item.name}
                      onChange={(e) => handleItemChange(item.tempId, "name", e.target.value)}
                      required
                    />

                    <div className="grid sm:grid-cols-2">
                      <Select 
                        onValueChange={(val) => handleItemChange(item.tempId, "brand", val)} 
                        value={item.brand}
                      >
                        <SelectTrigger className="h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted w-full px-8 bg-background">
                          <SelectValue placeholder="Marca..." />
                        </SelectTrigger>
                        <SelectContent className="font-black text-lg">
                          <SelectItem value="VERDE (N)" className="font-black">VERDE (N)</SelectItem>
                          <SelectItem value="ROSA (A)" className="font-black">ROSA (A)</SelectItem>
                          <SelectItem value="MARROM (C&E)" className="font-black">MARROM (C&E)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Categoria"
                        className="h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted focus:border-primary w-full px-8 bg-background"
                        value={item.category}
                        onChange={(e) => handleItemChange(item.tempId, "category", e.target.value)}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2">
                      <Input
                        placeholder="Código/SKU"
                        className="h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted focus:border-primary w-full px-8 bg-background"
                        value={item.productCode}
                        onChange={(e) => handleItemChange(item.tempId, "productCode", e.target.value)}
                      />
                      <Input
                        placeholder="Descrição Breve"
                        className="h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted focus:border-primary w-full px-8 bg-background"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.tempId, "description", e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-3">
                      <div className="relative">
                        <Input
                          placeholder="00,00"
                          className="h-16 sm:h-20 text-xl sm:text-3xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-sky-400 focus:border-sky-600 w-full px-8 bg-sky-100 text-sky-900 placeholder:text-sky-900/30"
                          value={item.catalogPrice}
                          onChange={(e) => handleItemChange(item.tempId, "catalogPrice", maskCurrency(e.target.value))}
                        />
                        <span className="absolute top-2 left-8 text-[8px] font-black uppercase text-sky-600/60">Revista</span>
                      </div>
                      <div className="relative">
                        <Input
                          placeholder="00,00"
                          className="h-16 sm:h-20 text-xl sm:text-3xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-orange-400 focus:border-orange-600 w-full px-8 bg-orange-100 text-orange-900 placeholder:text-orange-900/30"
                          value={item.costPrice}
                          onChange={(e) => handleItemChange(item.tempId, "costPrice", maskCurrency(e.target.value))}
                        />
                        <span className="absolute top-2 left-8 text-[8px] font-black uppercase text-orange-600/60">Custo</span>
                      </div>
                      <div className="relative">
                        <Input
                          placeholder="00,00"
                          className="h-16 sm:h-20 text-xl sm:text-3xl font-black rounded-none border-none focus:border-green-600 w-full px-8 bg-green-100 text-green-900 placeholder:text-green-900/30"
                          value={item.salePrice}
                          onChange={(e) => handleItemChange(item.tempId, "salePrice", maskCurrency(e.target.value))}
                          required
                        />
                        <span className="absolute top-2 left-8 text-[8px] font-black uppercase text-green-600/60">Venda</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="p-4 bg-muted/20">
              <Button 
                type="button" 
                onClick={addItem}
                className="w-full h-20 sm:h-24 bg-primary text-white hover:bg-primary/90 font-black rounded-2xl sm:rounded-[2rem] gap-2 sm:gap-4 text-xs sm:text-2xl uppercase tracking-tighter sm:tracking-widest shadow-2xl transition-all active:scale-95"
              >
                <Plus className="size-6 sm:size-8" /> ADICIONAR NOVO PRODUTO
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 3. PAGAMENTO */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/80 p-6 sm:p-8 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-xl sm:text-3xl font-black text-left uppercase px-2">
              <CreditCard className="size-6 sm:size-8 text-primary" />
              3. Forma de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-0">
            <div className="grid grid-cols-4 border-b-4 border-muted">
              {[
                { id: 'pix', label: 'Pix', icon: Smartphone, color: "bg-sky-500", iconColor: "text-sky-500" },
                { id: 'dinheiro', label: 'Dinheiro', icon: Banknote, color: "bg-emerald-500", iconColor: "text-emerald-500" },
                { id: 'cartao', label: 'Cartão', icon: CreditCard, color: "bg-violet-500", iconColor: "text-violet-500" },
                { id: 'a prazo', label: 'A Prazo', icon: HandCoins, color: "bg-amber-500", iconColor: "text-amber-500" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPaymentMethod(option.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 transition-all gap-2 h-20 sm:h-32 border-r-4 border-muted last:border-r-0",
                    paymentMethod === option.id
                      ? `${option.color} text-white shadow-inner scale-100`
                      : "bg-background text-muted-foreground hover:bg-muted/20"
                  )}
                >
                  <option.icon className={cn("size-8 sm:size-12", paymentMethod === option.id ? "text-white" : option.iconColor)} />
                  <span className={cn("text-[10px] sm:text-xs font-black uppercase tracking-tighter", paymentMethod === option.id ? "text-white" : "text-muted-foreground")}>{option.label}</span>
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2">
              <div className="border-b-4 sm:border-b-0 sm:border-r-4 border-muted p-4 sm:p-6 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block px-2 italic">Data de Vencimento</Label>
                <Input 
                  type="date" 
                  className="h-16 text-xl sm:text-3xl font-black border-none bg-transparent w-full px-2" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
                />
              </div>
              <div className="p-4 sm:p-6 space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block px-2 italic">Notas da Venda</Label>
                <Input
                  placeholder="Ex: Entrega na recepção"
                  className="h-16 text-xl sm:text-2xl font-black border-none w-full px-2 bg-transparent"
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. CHECK-IN DA VENDA */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden bg-slate-900 text-white border-4 border-primary/20">
          <CardHeader className="p-6 sm:p-8 border-b border-white/10 bg-white/5">
            <CardTitle className="flex flex-row items-center gap-3 text-xl sm:text-3xl font-black text-left uppercase italic">
              <CheckCircle2 className="size-6 sm:size-8 text-[#39FF14]" />
              4. Check-in Elite
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 sm:p-12 space-y-8">
            <div className="flex items-center gap-6">
              <div className={cn("size-12 rounded-2xl border-4 flex items-center justify-center shrink-0 shadow-lg", clientData.fullName ? "bg-[#39FF14]/20 border-[#39FF14]" : "border-white/10")}>
                {clientData.fullName ? <CheckCircle2 className="size-6 text-[#39FF14]" /> : <Circle className="size-6 text-white/10" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#39FF14] mb-1">Cliente VIP</p>
                <p className="text-2xl sm:text-4xl font-black italic truncate tracking-tighter">{clientData.fullName || "AGUARDANDO NOME..."}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className={cn("size-12 rounded-2xl border-4 flex items-center justify-center shrink-0 shadow-lg", saleItems.length > 0 ? "bg-[#39FF14]/20 border-[#39FF14]" : "border-white/10")}>
                {saleItems.length > 0 ? <CheckCircle2 className="size-6 text-[#39FF14]" /> : <Circle className="size-6 text-white/10" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#39FF14] mb-1">Carrinho de Itens</p>
                <p className="text-2xl sm:text-4xl font-black italic truncate tracking-tighter">
                  {saleItems.length > 0 ? `${saleItems.length} PRODUTO(S) LISTADO(S)` : "SEM ITENS..."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className={cn("size-12 rounded-2xl border-4 flex items-center justify-center shrink-0 shadow-lg", paymentMethod ? "bg-[#39FF14]/20 border-[#39FF14]" : "border-white/10")}>
                {paymentMethod ? <CheckCircle2 className="size-6 text-[#39FF14]" /> : <Circle className="size-6 text-white/10" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#39FF14] mb-1">Pagamento</p>
                <p className="text-2xl sm:text-4xl font-black italic truncate capitalize tracking-tighter">{paymentMethod || "AGUARDANDO MÉTODO..."}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. FINALIZAÇÃO */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden bg-primary text-primary-foreground">
          <CardHeader className="p-6 sm:p-8 bg-white/10">
             <CardTitle className="flex flex-row items-center gap-3 text-2xl sm:text-4xl font-black uppercase italic">
              <div className="bg-white/20 p-2 rounded-2xl mr-2 shadow-inner">
                <DollarSign className="size-6 sm:size-10" />
              </div>
              5. Consolidado
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 sm:p-12 space-y-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
               <div className="space-y-6">
                  <div className="flex justify-between items-center border-b-2 border-white/10 pb-2">
                    <span className="text-xs font-black uppercase tracking-widest opacity-60">Subtotal de Itens</span>
                    <span className="text-3xl font-black italic">R$ {subtotal.toFixed(2)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 px-2 block italic">Desconto (R$)</Label>
                      <Input
                        type="number"
                        className="h-16 text-center text-2xl font-black rounded-2xl border-4 bg-white/10 border-white/20 text-white w-full focus:border-white transition-all"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 px-2 block italic">Taxas (R$)</Label>
                      <Input
                        type="number"
                        className="h-16 text-center text-2xl font-black rounded-2xl border-4 bg-white/10 border-white/20 text-white w-full focus:border-white transition-all"
                        value={additionalFee}
                        onChange={(e) => setAdditionalFee(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
               </div>

               <div className="p-10 rounded-[2.5rem] shadow-2xl text-center bg-white text-primary border-8 border-white animate-in zoom-in duration-500">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-60 text-primary">VALOR FINAL DA VENDA</p>
                  <p className="text-6xl sm:text-8xl font-black tracking-tighter leading-none italic px-4">R$ {finalTotal.toFixed(2)}</p>
                </div>
            </div>
          </CardContent>
          <CardFooter className="p-8 pt-0">
             <Button 
              type="submit" 
              size="lg"
              className={cn(
                "w-full h-24 sm:h-32 text-xl sm:text-5xl font-black rounded-2xl sm:rounded-[3rem] shadow-2xl transition-all active:scale-95 uppercase tracking-wide sm:tracking-widest bg-white text-primary hover:bg-white/90 border-8 border-white",
                (!isReady || isLoading) && "opacity-50 cursor-not-allowed"
              )}
              disabled={!isReady || isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin size-12 sm:size-20" />
              ) : (
                <>
                  <CheckCircle2 className="mr-4 size-8 sm:size-16" />
                  FECHAR VENDA
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
