'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/client';

const loginSchema = z.object({
  email: z.string().email('E-mail invalido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  async function onSubmit(data: LoginForm) {
    setIsLoading(true);

    try {
      const result = await signIn(data.email, data.password);

      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      toast.success('Login realizado com sucesso!');
      router.push('/dashboard');
    } catch {
      toast.error('Credenciais invalidas. Tente novamente.');
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-0 shadow-none lg:border lg:shadow-sm">
      <CardHeader className="space-y-1 px-0 lg:px-6">
        <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
        <CardDescription>
          Digite seu e-mail e senha para acessar sua conta
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 px-0 lg:px-6">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="********"
                {...register('password')}
                className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
              />
              <button
                type="button"
                className="absolute right-0 top-0 flex h-full px-3 hover:bg-accent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="remember" {...register('remember')} />
            <Label htmlFor="remember" className="text-sm font-normal">
              Manter-me conectado
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 px-0 lg:px-6">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar
          </Button>

          <p className="text-sm text-muted-foreground">
            Nao tem uma conta?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Cadastre-se
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
