"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  Trash2,
  Plus,
  Loader2,
  Tag,
  Search,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  Calendar,
} from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, setDocumentNonBlocking } from "@/firebase";
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
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);

  // Busca Ciclos e Ciclo Ativo
  const cyclesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "cycles");
  }, [db, user]);
  const { data: cycles } = useCollection(cyclesQuery);

  const settingsRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid, "config", "settings");
  }, [db, user]);
  const { data: settings } = useDoc(settingsRef);
  const activeCycleId = settings?.activeCycleId;

  const activeCycle = useMemo(() => {
    if (!cycles || !activeCycleId) return null;
    return cycles.find(c => c.id === activeCycleId);
  }, [cycles, activeCycleId]);

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
    ).sort((a, b) => (a.fullName || "").localeCompare(b.fullName || "")).slice(0, 5);
  }, [existingClients, searchTerm]);

  // --- ESTADO DO FORM ---
  const [clientData, setClientData] = useState({
    fullName: "",
    phone: "",
    city: "",
    neighborhood: "",
    address: "",
    notes: "",
  });

  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [saleNotes, setSaleNotes] = useState("");
  const [discount, setDiscount] = useState(0);
  const [additionalFee, setAdditionalFee] = useState(0);

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
    return number.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const unmaskCurrency = (value: string | number) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const cleaned = value.toString().replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  };

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

  const removeItem = () => {
    if (itemToRemove) {
      setSaleItems(saleItems.filter(item => item.tempId !== itemToRemove));
      setItemToRemove(null);
    }
  };

  const handleItemChange = (tempId: string, field: keyof SaleItem, value: string) => {
    setSaleItems(prev => prev.map(item => {
      if (item.tempId !== tempId) return item;
      const updatedItem = { ...item, [field]: value };
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

  const subtotal = useMemo(() => saleItems.reduce((acc, item) => acc + unmaskCurrency(item.salePrice), 0), [saleItems]);
  const finalTotal = Math.max(0, subtotal - discount + additionalFee);

  const isReady = useMemo(() => {
    return (
      clientData.fullName &&
      clientData.phone &&
      saleItems.length > 0 &&
      saleItems.every(item => item.name && item.brand && item.salePrice) &&
      paymentMethod &&
      activeCycleId
    );
  }, [clientData, saleItems, paymentMethod, activeCycleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !isReady) {
      toast({ variant: "destructive", title: "Dados incompletos", description: "Selecione um ciclo ativo e preencha os campos obrigatórios." });
      return;
    }

    setIsLoading(true);

    try {
      const finalClientId = selectedClient ? selectedClient.id : `cli-${Date.now()}`;
      const orderId = `ord-${Date.now()}`;

      const d = new Date(orderDate);
      d.setMonth(d.getMonth() + 1);
      const dueDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-05`;

      if (!selectedClient) {
        const finalClientData = { ...clientData, id: finalClientId, adminId: user.uid, registrationDate: new Date().toISOString() };
        setDocumentNonBlocking(doc(db, "users", user.uid, "clients", finalClientId), finalClientData, { merge: true });
      }

      const orderData = {
        id: orderId,
        adminId: user.uid,
        clientId: finalClientId,
        clientName: clientData.fullName,
        cycleId: activeCycleId,
        orderDate: new Date(orderDate).toISOString(),
        totalAmount: subtotal,
        discountAmount: discount,
        additionalFeeAmount: additionalFee,
        finalAmount: finalTotal,
        paymentMethod,
        paymentStatus: paymentMethod === "a prazo" ? "Pendente" : "Pago",
        dueDate: dueDate,
        notes: saleNotes,
        isDeleted: false,
      };
      setDocumentNonBlocking(doc(db, "users", user.uid, "orders", orderId), orderData, { merge: true });

      saleItems.forEach((item, index) => {
        const productId = `prod-${Date.now()}-${index}`;
        const itemId = `item-${Date.now()}-${index}`;
        
        setDocumentNonBlocking(doc(db, "users", user.uid, "products", productId), {
          id: productId, name: item.name, brand: item.brand, category: item.category,
          catalogPrice: unmaskCurrency(item.catalogPrice), costPrice: unmaskCurrency(item.costPrice),
          salePrice: unmaskCurrency(item.salePrice), productCode: item.productCode,
          description: item.description, adminId: user.uid
        }, { merge: true });

        setDocumentNonBlocking(doc(db, "users", user.uid, "orders", orderId, "orderItems", itemId), {
          id: itemId, adminId: user.uid, orderId: orderId, productId: productId,
          productName: item.name, quantity: 1, unitPrice: unmaskCurrency(item.salePrice), subtotal: unmaskCurrency(item.salePrice)
        }, { merge: true });
      });

      toast({ title: "Venda Concluída!", description: `Registrada no ciclo: ${activeCycle?.name}` });
      router.push("/pedidos");
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao salvar venda." });
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
            <h1 className="text-[2.2rem] sm:text-7xl md:text-8xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap px-2">NOVA VENDA</h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">CADASTRE CLIENTE, PRODUTO E VENDA DE UMA SÓ VEZ</p>
          
          {activeCycle ? (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary font-black uppercase tracking-widest px-6 py-2 gap-2 rounded-xl text-xs sm:text-sm">
                <RefreshCw className="size-4 animate-spin-slow" />
                VENDENDO NO: {activeCycle.name}
              </Badge>
            </div>
          ) : (
            <div className="mt-6">
              <Badge variant="destructive" className="font-black uppercase tracking-widest px-6 py-2 rounded-xl animate-pulse">
                SELECIONE UM CICLO NO PAINEL ANTES DE VENDER
              </Badge>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/80 p-4 border-b-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex flex-row items-center gap-3 text-xl sm:text-3xl font-black text-left uppercase px-2">
              <User className="size-6 sm:size-8 text-primary" />
              1. Identificação da Cliente
            </CardTitle>
            {selectedClient && (
              <Button type="button" variant="outline" onClick={() => setSelectedClient(null)} className="rounded-full font-black text-[10px] uppercase tracking-widest border-primary/20 text-primary">Trocar Cliente</Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {!selectedClient && (
              <div className="relative border-b-4 border-muted group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-6 text-primary" />
                <Input placeholder="Buscar cliente existente..." className="h-20 sm:h-24 pl-12 pr-4 text-xl sm:text-2xl font-black rounded-none border-none bg-primary/5 italic placeholder:text-primary/30" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                {filteredClients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-background border-x-4 border-b-4 border-primary/20 shadow-2xl">
                    {filteredClients.map((client) => (
                      <button key={client.id} type="button" onClick={() => handleSelectClient(client)} className="w-full p-6 text-left hover:bg-primary/10 border-b last:border-none flex items-center justify-between group/item">
                        <div>
                          <p className="font-black text-xl uppercase italic group-hover/item:text-primary">{client.fullName}</p>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{client.phone}</p>
                        </div>
                        <UserCheck className="size-6 text-primary opacity-0 group-hover/item:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="grid sm:grid-cols-2">
              <Input placeholder="Nome Completo" className={cn("h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted focus:border-primary px-4 placeholder:text-muted-foreground/30", selectedClient && "bg-muted/30 opacity-80")} value={clientData.fullName} onChange={(e) => !selectedClient && setClientData(p => ({ ...p, fullName: e.target.value }))} readOnly={!!selectedClient} required />
              <Input placeholder="WhatsApp" className={cn("h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted focus:border-primary px-4 placeholder:text-muted-foreground/30", selectedClient && "bg-muted/30 opacity-80")} value={clientData.phone} onChange={(e) => !selectedClient && setClientData(p => ({ ...p, phone: formatPhone(e.target.value) }))} readOnly={!!selectedClient} required />
            </div>
            <div className="grid sm:grid-cols-2">
              <Input placeholder="Cidade" className={cn("h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted focus:border-primary px-4 placeholder:text-muted-foreground/30", selectedClient && "bg-muted/30 opacity-80")} value={clientData.city} onChange={(e) => !selectedClient && setClientData(p => ({ ...p, city: e.target.value }))} readOnly={!!selectedClient} />
              <Input placeholder="Bairro" className={cn("h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted focus:border-primary px-4 placeholder:text-muted-foreground/30", selectedClient && "bg-muted/30 opacity-80")} value={clientData.neighborhood} onChange={(e) => !selectedClient && setClientData(p => ({ ...p, neighborhood: e.target.value }))} readOnly={!!selectedClient} />
            </div>
            <Input placeholder="Endereço / Referência" className={cn("h-16 sm:h-20 text-xl sm:text-2xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted focus:border-primary px-4 bg-background placeholder:text-muted-foreground/30", selectedClient && "bg-muted/30 opacity-80")} value={clientData.address} onChange={(e) => !selectedClient && setClientData(p => ({ ...p, address: e.target.value }))} readOnly={!!selectedClient} />
            <Textarea placeholder="Notas do Perfil (Preferências, horários...)" className={cn("min-h-[120px] text-lg sm:text-xl font-bold rounded-none border-none focus:border-primary px-4 bg-background py-4 placeholder:text-muted-foreground/30", selectedClient && "bg-muted/30 opacity-80")} value={clientData.notes} onChange={(e) => !selectedClient && setClientData(p => ({ ...p, notes: e.target.value }))} readOnly={!!selectedClient} />
          </CardContent>
        </Card>

        {/* 2. PRODUTOS VENDIDOS */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/80 p-4 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-xl sm:text-3xl font-black text-left uppercase px-2">
              <Package className="size-6 sm:size-8 text-primary" />
              2. Detalhes do Produto Vendido
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {saleItems.length === 0 ? (
              <div className="p-16 text-center">
                <Package className="size-16 mx-auto text-muted-foreground opacity-20 mb-4" />
                <p className="text-muted-foreground italic font-black uppercase opacity-40 px-4">Nenhum produto adicionado.</p>
              </div>
            ) : (
              <div className="divide-y-8 divide-muted/30">
                {saleItems.map((item, index) => (
                  <div key={item.tempId} className="relative">
                    <div className="bg-primary/5 px-4 h-12 flex items-center justify-between text-xs font-black text-primary uppercase tracking-widest border-b-4 border-primary/10">
                      <span>Item #{(index + 1).toString().padStart(2, '0')}</span>
                      <Button type="button" variant="destructive" size="sm" onClick={() => setItemToRemove(item.tempId)} className="h-8 rounded-xl font-black text-[9px]">REMOVER</Button>
                    </div>
                    <Input placeholder="Nome do Produto" className="h-16 text-xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted focus:border-primary px-4 placeholder:text-muted-foreground/30" value={item.name} onChange={(e) => handleItemChange(item.tempId, "name", e.target.value)} required />
                    <div className="grid sm:grid-cols-2">
                      <Select onValueChange={(val) => handleItemChange(item.tempId, "brand", val)} value={item.brand}>
                        <SelectTrigger className="h-16 text-xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted px-4"><SelectValue placeholder="Marca..." /></SelectTrigger>
                        <SelectContent className="font-black"><SelectItem value="VERDE (N)">VERDE (N)</SelectItem><SelectItem value="ROSA (A)">ROSA (A)</SelectItem><SelectItem value="MARROM (C&E)">MARROM (C&E)</SelectItem></SelectContent>
                      </Select>
                      <Input placeholder="Categoria" className="h-16 text-xl font-black rounded-none border-x-0 border-t-0 border-b-4 border-muted px-4 placeholder:text-muted-foreground/30" value={item.category} onChange={(e) => handleItemChange(item.tempId, "category", e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1">
                      <div className="relative border-b-4 border-muted/30"><Input placeholder="00,00" className="h-16 text-center text-2xl font-black text-black bg-sky-100 border-none" value={item.catalogPrice} onChange={(e) => handleItemChange(item.tempId, "catalogPrice", maskCurrency(e.target.value))} /><span className="absolute top-1 left-1 text-[7px] font-black uppercase text-sky-700/60">Revista</span></div>
                      <div className="relative border-b-4 border-muted/30"><Input placeholder="00,00" className="h-16 text-center text-2xl font-black text-black bg-orange-100 border-none" value={item.costPrice} onChange={(e) => handleItemChange(item.tempId, "costPrice", maskCurrency(e.target.value))} /><span className="absolute top-1 left-1 text-[7px] font-black uppercase text-orange-700/60">Custo</span></div>
                      <div className="relative"><Input placeholder="00,00" className="h-16 text-center text-2xl font-black text-black bg-green-100 border-none" value={item.salePrice} onChange={(e) => handleItemChange(item.tempId, "salePrice", maskCurrency(e.target.value))} required /><span className="absolute top-1 left-1 text-[7px] font-black uppercase text-green-700/60">Venda</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="p-2 bg-muted/20">
              <Button type="button" onClick={addItem} className="w-full h-16 bg-primary text-white font-black rounded-xl gap-4 shadow-xl">ADICIONAR PRODUTO</Button>
            </div>
          </CardContent>
        </Card>

        {/* 3. PAGAMENTO */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-muted/80 p-4 border-b-2">
            <CardTitle className="flex flex-row items-center gap-3 text-xl sm:text-3xl font-black text-left uppercase px-2">
              <CreditCard className="size-6 sm:size-8 text-primary" />
              3. Forma de Pagamento & Data
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-3 border-b-4 border-muted">
              {[
                { id: 'pix', label: 'Pix', icon: Smartphone, color: "bg-sky-500" },
                { id: 'dinheiro', label: 'Dinheiro', icon: Banknote, color: "bg-emerald-500" },
                { id: 'a prazo', label: 'A Prazo', icon: HandCoins, color: "bg-amber-500" },
              ].map((option) => (
                <button key={option.id} type="button" onClick={() => setPaymentMethod(option.id)} className={cn("flex flex-col items-center justify-center p-2 transition-all gap-1 h-20 sm:h-32 border-r-4 border-muted last:border-r-0", paymentMethod === option.id ? `${option.color} text-white shadow-inner` : "bg-background text-muted-foreground")}>
                  <option.icon className="size-8 sm:size-12" /><span className="text-[9px] font-black uppercase">{option.label}</span>
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2">
              <div className="border-b-4 sm:border-b-0 sm:border-r-4 border-muted p-4">
                <Label className="text-[10px] font-black uppercase opacity-60 flex items-center gap-2">
                  Data da Venda <Badge variant="secondary" className="text-[8px] h-4 font-black">VENCIMENTO AUTOMÁTICO DIA 05</Badge>
                </Label>
                <Input type="date" className="h-12 text-xl font-black border-none" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
              </div>
              <div className="p-4"><Label className="text-[10px] font-black uppercase opacity-60">Notas da Venda</Label><Input placeholder="Ex: Presente, troco..." className="h-12 text-xl font-black border-none placeholder:text-muted-foreground/30" value={saleNotes} onChange={(e) => setSaleNotes(e.target.value)} /></div>
            </div>
          </CardContent>
        </Card>

        {/* 4. CHECK-IN */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] bg-slate-900 text-white border-4 border-primary/20 p-8 space-y-8">
          <CardTitle className="text-xl sm:text-3xl font-black uppercase italic flex items-center gap-3 text-[#39FF14]"><CheckCircle2 className="size-8" /> Check-in Elite</CardTitle>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className={cn("size-10 rounded-xl border-4 flex items-center justify-center shrink-0", clientData.fullName ? "border-[#39FF14] bg-[#39FF14]/20" : "border-white/10")}>{clientData.fullName ? <CheckCircle2 className="size-5 text-[#39FF14]" /> : <Circle className="size-5 text-white/10" />}</div>
              <div className="truncate"><p className="text-[8px] font-black uppercase text-[#39FF14]">Cliente VIP</p><p className="text-xl sm:text-2xl font-black italic truncate tracking-tighter">{clientData.fullName || "AGUARDANDO NOME..."}</p></div>
            </div>
            <div className="flex items-center gap-4">
              <div className={cn("size-10 rounded-xl border-4 flex items-center justify-center shrink-0", saleItems.length > 0 ? "border-[#39FF14] bg-[#39FF14]/20" : "border-white/10")}>{saleItems.length > 0 ? <CheckCircle2 className="size-5 text-[#39FF14]" /> : <Circle className="size-5 text-white/10" />}</div>
              <div className="truncate"><p className="text-[8px] font-black uppercase text-[#39FF14]">Carrinho</p><p className="text-xl sm:text-2xl font-black italic truncate tracking-tighter">{saleItems.length} PRODUTO(S) LISTADO(S)</p></div>
            </div>
            <div className="flex items-center gap-4">
              <div className={cn("size-10 rounded-xl border-4 flex items-center justify-center shrink-0", activeCycleId ? "border-[#39FF14] bg-[#39FF14]/20" : "border-red-500 bg-red-500/20")}>{activeCycleId ? <CheckCircle2 className="size-5 text-[#39FF14]" /> : <AlertTriangle className="size-5 text-red-500" />}</div>
              <div className="truncate"><p className="text-[8px] font-black uppercase text-[#39FF14]">Ciclo de Venda</p><p className="text-xl sm:text-2xl font-black italic truncate tracking-tighter">{activeCycle?.name || "NENHUM CICLO SELECIONADO"}</p></div>
            </div>
          </div>
        </Card>

        {/* 5. FINALIZAÇÃO */}
        <Card className="border-none shadow-2xl rounded-[1.5rem] bg-primary text-primary-foreground p-8 space-y-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="flex justify-between border-b-2 border-white/10 pb-1"><span className="text-xs font-black uppercase opacity-60">Subtotal</span><span className="text-2xl font-black italic">R$ {subtotal.toFixed(2)}</span></div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60 italic">Desconto (R$)</Label><Input type="number" className="h-14 bg-white border-4 border-white text-black text-2xl font-black text-center" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} /></div>
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60 italic">Taxas (R$)</Label><Input type="number" className="h-14 bg-white border-4 border-white text-black text-2xl font-black text-center" value={additionalFee} onChange={(e) => setAdditionalFee(parseFloat(e.target.value) || 0)} /></div>
              </div>
            </div>
            <div className="p-6 rounded-[2rem] bg-white text-primary text-center border-8 border-white animate-in zoom-in duration-500 shadow-2xl">
              <p className="text-[10px] font-black uppercase opacity-60 mb-1">VALOR FINAL</p>
              <p className="text-5xl sm:text-7xl font-black italic text-green-600 tracking-tighter">R$ {finalTotal.toFixed(2)}</p>
            </div>
          </div>
          <Button type="submit" className={cn("w-full h-24 sm:h-28 text-2xl sm:text-4xl font-black rounded-3xl bg-white text-primary hover:bg-white/90 border-8 border-white shadow-2xl transition-all active:scale-95 uppercase", (!isReady || isLoading) && "opacity-50")} disabled={!isReady || isLoading}>
            {isLoading ? <Loader2 className="animate-spin size-12" /> : <><CheckCircle2 className="mr-3 size-10" /> FECHAR VENDA</>}
          </Button>
        </Card>
      </form>

      {/* Alerta de Confirmação para Remover Item do Carrinho */}
      <AlertDialog open={!!itemToRemove} onOpenChange={(open) => !open && setItemToRemove(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-8 sm:p-12 border-8 shadow-2xl max-w-2xl mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl sm:text-5xl font-black tracking-tighter text-primary uppercase leading-none text-left px-2">Remover do Carrinho?</AlertDialogTitle>
            <AlertDialogDescription className="text-xl sm:text-2xl font-bold mt-6 leading-relaxed text-muted-foreground text-left">
              Este produto será <strong className="text-primary font-black uppercase">excluído</strong> da lista atual de vendas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4 mt-12 flex-col sm:flex-row">
            <AlertDialogCancel className="h-16 sm:h-24 px-10 text-xl font-black rounded-2xl sm:rounded-3xl border-4 border-muted hover:bg-muted/50">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={removeItem} className="h-16 sm:h-24 px-10 text-xl font-black bg-destructive text-white hover:bg-destructive/90 rounded-2xl sm:rounded-3xl shadow-xl active:scale-95 transition-all">
              SIM, REMOVER AGORA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
