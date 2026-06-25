'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <div className="flex flex-1 items-center justify-center p-8 bg-background min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[400px]"
      >
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Calendar className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-foreground">Socio Desk</span>
        </div>

        <Card className="border-0 shadow-none lg:border lg:shadow-sm bg-transparent dark:bg-transparent lg:bg-card">
            <CardHeader className="space-y-1 px-0 lg:px-6">
              <div className="label mb-2 text-muted-foreground">Entrar</div>
              <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">Bem-vindo de volta</CardTitle>
              <CardDescription className="text-muted-foreground">
                Digite suas credenciais para acessar sua conta
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-5 px-0 lg:px-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    {...register('email')}
                    className={`h-11 px-4 bg-background dark:bg-input dark:border-border dark:text-white dark:placeholder:text-muted-foreground bg-background border-border focus:border-primary focus:ring-primary/10 ${
                      errors.email ? 'border-destructive' : ''
                    }`}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground">
                      Senha
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
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
                      className={`h-11 px-4 pr-11 bg-background dark:bg-input dark:border-border dark:text-white dark:placeholder:text-muted-foreground bg-background border-border focus:border-primary focus:ring-primary/10 ${
                        errors.password ? 'border-destructive' : ''
                      }`}
                    />
                    <button
                      type="button"
                      className="absolute right-0 top-0 flex h-full px-4 dark:hover:bg-muted hover:bg-zinc-100 rounded-r-lg transition-colors"
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

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    {...register('remember')}
                    className="dark:border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground">
                    Manter-me conectado
                  </Label>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 px-0 lg:px-6">
                <Button
                  type="submit"
                  className="h-11 w-full bg-primary hover:bg-primary/80 text-primary-foreground font-medium shadow-sm transition-all active:scale-[0.98]"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>

                <p className="text-sm text-muted-foreground">
                  Nao tem uma conta?{' '}
                  <Link href="/register" className="font-medium text-primary hover:text-primary/80 transition-colors">
                    Cadastre-se
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
    </div>
  );
}
