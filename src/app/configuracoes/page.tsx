
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  Palette,
  Smartphone,
  Type,
  Sun,
  Moon,
  Save,
  Loader2,
  Sparkles,
  CheckCircle2,
  Pipette,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const ELITE_COLORS = [
  { name: "Rosa Glam", hex: "#C2185B" },
  { name: "Verde Elite", hex: "#16a34a" },
  { name: "Âmbar Luxo", hex: "#78350f" },
  { name: "Azul Profissional", hex: "#1e40af" },
  { name: "Roxo Premium", hex: "#6b21a8" },
  { name: "Preto Absoluto", hex: "#000000" },
];

export default function ConfiguracoesPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    appName: "LilianPro",
    primaryColor: "#C2185B",
    themeMode: "light" as "light" | "dark",
  });

  const settingsRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid, "config", "settings");
  }, [db, user]);

  const { data: settings, isLoading: isFetching } = useDoc(settingsRef);

  useEffect(() => {
    if (settings) {
      setFormData({
        appName: settings.appName || "LilianPro",
        primaryColor: settings.primaryColor || "#C2185B",
        themeMode: (settings.themeMode as "light" | "dark") || "light",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    if (!user || !db || !settingsRef) return;

    setIsLoading(true);
    try {
      setDocumentNonBlocking(settingsRef, formData, { merge: true });
      
      // Atualização imediata do cache local para evitar lag visual
      localStorage.setItem('glam_app_name', formData.appName);
      document.title = `${formData.appName} - Controle de Vendas`;
      
      toast({
        title: "Ajustes salvos!",
        description: "As alterações foram aplicadas em todo o sistema.",
      });
      router.push("/");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível atualizar suas preferências.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground">
        <Loader2 className="size-16 animate-spin text-primary" />
        <p className="text-2xl font-black animate-pulse uppercase tracking-widest text-center">Carregando ajustes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 w-full pb-20">
      <div className="flex flex-col items-center text-center gap-6 px-2 mb-10">
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-6">
            <Settings className="size-16 sm:size-24 text-primary" />
            <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-primary font-headline uppercase leading-none italic drop-shadow-xl whitespace-nowrap px-2">AJUSTES</h1>
          </div>
          <p className="text-xs sm:text-xl text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-widest text-center">Customize sua plataforma elite</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Coluna 1: Campos de Configuração */}
        <div className="lg:col-span-7 space-y-10">
          {/* Nome do App */}
          <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-muted/80 p-8 border-b-2">
              <CardTitle className="flex flex-row items-center gap-3 text-2xl font-black px-2 uppercase tracking-widest">
                <Type className="size-7 text-primary" />
                IDENTIDADE
              </CardTitle>
              <CardDescription className="text-sm font-bold opacity-60 uppercase tracking-widest px-2">Como seu negócio aparecerá em todo lugar</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <Label htmlFor="appName" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block">Nome do Aplicativo</Label>
                <Input
                  id="appName"
                  className="h-16 sm:h-20 text-xl sm:text-3xl font-black rounded-xl sm:rounded-3xl border-4 border-muted focus:border-primary transition-all"
                  value={formData.appName}
                  onChange={(e) => setFormData(prev => ({ ...prev, appName: e.target.value }))}
                  placeholder="Ex: Lilian Beauty"
                />
              </div>
            </CardContent>
          </Card>

          {/* Cores */}
          <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-muted/80 p-8 border-b-2">
              <CardTitle className="flex flex-row items-center gap-3 text-2xl font-black px-2 uppercase tracking-widest">
                <Palette className="size-7 text-primary" />
                PALETA ELITE
              </CardTitle>
              <CardDescription className="text-sm font-bold opacity-60 uppercase tracking-widest px-2">A cor principal que define sua marca</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block">Cores Sugeridas</Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                  {ELITE_COLORS.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, primaryColor: color.hex }))}
                      className={cn(
                        "size-14 sm:size-16 rounded-2xl border-4 transition-all relative flex items-center justify-center",
                        formData.primaryColor === color.hex ? "border-primary scale-110 shadow-xl" : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: color.hex }}
                    >
                      {formData.primaryColor === color.hex && <CheckCircle2 className="size-6 text-white drop-shadow-md" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seletor Visual de Qualquer Cor */}
              <div className="space-y-4 pt-8 border-t-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block">Personalizar Qualquer Cor</Label>
                <div className="flex items-center gap-6">
                  {/* Visual Color Picker Container */}
                  <div className="relative group cursor-pointer">
                    <input
                      type="color"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value.toUpperCase() }))}
                    />
                    <div 
                      className="size-20 sm:size-24 rounded-3xl border-8 border-muted shadow-2xl transition-transform group-hover:scale-110 flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                        <Pipette className="size-8 text-white drop-shadow-md" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="relative w-full">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-2xl">#</span>
                      <Input
                        type="text"
                        className="h-16 sm:h-20 pl-12 text-2xl sm:text-3xl font-black rounded-2xl border-4 border-muted uppercase focus:border-primary transition-all placeholder:text-muted-foreground/30"
                        value={formData.primaryColor.replace('#', '')}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                          setFormData(prev => ({ ...prev, primaryColor: `#${val.toUpperCase()}` }));
                        }}
                        placeholder="FFFFFF"
                      />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 opacity-60">Toque no quadrado para o seletor visual ou digite o código HEX.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modo Escuro/Claro */}
          <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-muted/80 p-8 border-b-2">
              <CardTitle className="flex flex-row items-center gap-3 text-2xl font-black px-2 uppercase tracking-widest">
                <Sun className="size-7 text-primary" />
                INTERFACE
              </CardTitle>
              <CardDescription className="text-sm font-bold opacity-60 uppercase tracking-widest px-2">Aparência do sistema</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex items-center justify-between p-6 rounded-3xl border-4 border-muted bg-muted/10">
                <div className="flex items-center gap-4">
                  {formData.themeMode === 'light' ? <Sun className="size-8 text-primary" /> : <Moon className="size-8 text-primary" />}
                  <div>
                    <p className="text-xl font-black uppercase tracking-tighter italic">{formData.themeMode === 'light' ? 'Modo Claro' : 'Modo Escuro'}</p>
                    <p className="text-xs font-bold opacity-60">Toque para alternar o visual</p>
                  </div>
                </div>
                <Switch
                  checked={formData.themeMode === 'dark'}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, themeMode: checked ? 'dark' : 'light' }))}
                  className="scale-150 data-[state=checked]:bg-primary"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2: Prévia e Ação */}
        <div className="lg:col-span-5 space-y-10 sticky top-10">
          <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-muted/20 relative">
            <div className="absolute inset-0 bg-primary/5 -z-10" />
            <CardHeader className="p-8 text-center border-b-2 bg-muted/80">
              <CardTitle className="text-xl font-black flex items-center justify-center gap-3 uppercase tracking-widest">
                <Smartphone className="size-6 text-primary" />
                PRÉVIA ELITE
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex justify-center">
              {/* Mock do Celular */}
              <div className={cn(
                "w-[280px] h-[500px] rounded-[3rem] border-[12px] border-slate-900 shadow-[0_40px_80px_rgba(0,0,0,0.3)] overflow-hidden transition-all duration-500",
                formData.themeMode === 'dark' ? "bg-slate-950" : "bg-white"
              )}>
                {/* Status Bar */}
                <div className="h-6 bg-slate-900 flex justify-end items-center px-6 gap-1">
                  <div className="size-1 rounded-full bg-white/40" />
                  <div className="size-1 rounded-full bg-white/40" />
                </div>
                
                {/* App Content Preview */}
                <div className="p-4 space-y-6">
                  {/* Mock Header */}
                  <div className="flex flex-col items-center gap-3 pt-4">
                    <div className="size-10 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: formData.primaryColor }}>
                      <Sparkles className="size-6" />
                    </div>
                    <p className={cn("text-2xl font-black italic tracking-tighter truncate w-full text-center px-4", formData.themeMode === 'dark' ? "text-white" : "text-slate-900")} style={{ color: formData.primaryColor }}>
                      {formData.appName}
                    </p>
                  </div>

                  {/* Mock Card */}
                  <div className={cn("p-4 rounded-2xl shadow-sm border-2", formData.themeMode === 'dark' ? "bg-slate-900 border-white/5" : "bg-white border-slate-100")}>
                    <div className="flex justify-between mb-4">
                      <div className="size-8 rounded-lg bg-primary/10" style={{ backgroundColor: `${formData.primaryColor}20` }} />
                      <div className="h-4 w-20 rounded bg-muted/20" />
                    </div>
                    <div className="h-8 w-full rounded-lg bg-primary/10 mb-2" style={{ backgroundColor: `${formData.primaryColor}10` }} />
                    <div className="h-4 w-2/3 rounded bg-muted/10" />
                  </div>

                  {/* Mock Buttons */}
                  <div className="h-12 w-full rounded-2xl shadow-lg flex items-center justify-center text-white font-black text-xs uppercase tracking-widest" style={{ backgroundColor: formData.primaryColor }}>
                    BOTAO ELITE
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-8 pt-0 flex flex-col gap-4">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="w-full h-20 sm:h-24 text-xl sm:text-2xl font-black rounded-2xl sm:rounded-[2.5rem] bg-primary text-white hover:bg-primary/90 shadow-2xl transition-all active:scale-95 uppercase tracking-widest gap-4"
              >
                {isLoading ? (
                  <Loader2 className="size-10 animate-spin" />
                ) : (
                  <>
                    <Save className="size-8" />
                    SALVAR TUDO
                  </>
                )}
              </Button>
              <p className="text-[10px] font-black text-center text-muted-foreground uppercase tracking-widest opacity-60">Você será redirecionado para a home após salvar.</p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
