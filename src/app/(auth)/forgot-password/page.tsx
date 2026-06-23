'use client';

import Link from 'next/link';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(data: ForgotPasswordForm) {
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setEmailSent(true);
      toast.success('E-mail de recuperação enviado!');
    } catch {
      toast.error('Erro ao enviar e-mail. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  if (emailSent) {
    return (
      <Card className="border-0 shadow-none lg:border lg:shadow-sm">
        <CardHeader className="space-y-1 px-0 lg:px-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-center text-2xl font-bold">Verifique seu e-mail</CardTitle>
          <CardDescription className="text-center">
            Enviamos um link de recuperação para o e-mail informado.
            Clique no link para redefinir sua senha.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col space-y-4 px-0 lg:px-6">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para login
          </Link>

          <p className="text-center text-sm text-muted-foreground">
            Não recebeu o e-mail?{' '}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => setEmailSent(false)}
            >
              Tentar novamente
            </button>
          </p>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-none lg:border lg:shadow-sm">
      <CardHeader className="space-y-1 px-0 lg:px-6">
        <CardTitle className="text-2xl font-bold">Esqueceu a senha?</CardTitle>
        <CardDescription>
          Digite seu e-mail e enviaremos um link para redefinir sua senha
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
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 px-0 lg:px-6">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar link de recuperação
          </Button>

          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline inline-flex items-center">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Voltar para login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
