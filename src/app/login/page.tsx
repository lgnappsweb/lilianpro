
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, LogIn, Eye, EyeOff, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { doc } from "firebase/firestore";

export default function LoginPage() {
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('litencarv@icloud.com');
  const [password, setPassword] = useState('Ltc1036');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Busca configurações globais para o nome do app no login
  // Como no login não temos o UID do usuário nas regras, usamos um fallback ou buscamos de um adminId fixo se necessário.
  // Por simplicidade e segurança, usaremos o fallback "GlamGestão" se não estiver logado.
  const appName = "GlamGestão";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShowHelp(false);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      setShowHelp(true);
      
      let message = 'E-mail ou senha inválidos.';
      if (error.code === 'auth/invalid-credential') message = 'Credenciais inválidas.';
      else if (error.code === 'auth/operation-not-allowed') message = 'Provedor não ativado.';
      
      toast({ variant: 'destructive', title: 'Falha no Acesso', description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        {showHelp && (
          <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 animate-in fade-in slide-in-from-top-4 duration-300">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-bold">Ação Necessária no Firebase</AlertTitle>
            <AlertDescription className="text-xs space-y-2">
              <p>O Firebase não reconheceu este acesso.</p>
              <Button variant="link" className="p-0 h-auto text-xs font-bold underline" onClick={() => window.open('https://console.firebase.google.com/', '_blank')}>
                Abrir Console <ExternalLink className="ml-1 size-3" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-none shadow-lg">
          <CardHeader className="text-center space-y-1">
            <div className="flex justify-center mb-4">
              <div className="bg-primary p-3 rounded-2xl text-primary-foreground shadow-sm">
                <Sparkles className="size-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-headline font-bold text-primary italic uppercase tracking-tighter">{appName}</CardTitle>
            <CardDescription>Acesso administrativo exclusivo</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="litencarv@icloud.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full h-11 text-lg font-semibold" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 size-5 animate-spin" /> Validando...</> : <><LogIn className="mr-2 size-5" /> Entrar no Sistema</>}
              </Button>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Administradora Cadastrada</p>
                <p className="text-xs text-primary font-medium">litencarv@icloud.com</p>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
