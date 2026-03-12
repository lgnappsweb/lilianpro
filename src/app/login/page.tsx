
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/firebase';
import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, LogIn } from 'lucide-react';

export default function LoginPage() {
  const auth = useAuth();
  // Definindo as credenciais solicitadas como padrão para o protótipo
  const [email, setEmail] = useState('litencarv@icloud.com');
  const [password, setPassword] = useState('Ltc1036');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    initiateEmailSignIn(auth, email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-none shadow-lg">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-2xl text-primary-foreground">
              <Sparkles className="size-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-headline font-bold text-primary">GlamGestão</CardTitle>
          <CardDescription>Acesse sua conta de administradora única</CardDescription>
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
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full h-11 text-lg font-semibold">
              <LogIn className="mr-2 size-5" />
              Entrar
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Acesso exclusivo para: litencarv@icloud.com
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
