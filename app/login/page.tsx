'use client';

import { useState } from 'react';
import {
  Car,
  Loader2,
  Mail,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  resetPassword,
  signIn,
  signUp,
} from '@/lib/services/users';

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ResetFormData {
  email: string;
}

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: string }).code;
    switch (code) {
      case 'auth/invalid-api-key':
        return 'Невалідний API ключ Firebase. Перевірте .env.local';
      case 'auth/invalid-credential':
        return 'Невірний email або пароль';
      case 'auth/user-not-found':
        return 'Користувача не знайдено';
      case 'auth/too-many-requests':
        return 'Забагато спроб. Спробуйте пізніше';
      case 'auth/email-already-in-use':
        return 'Цей email вже використовується';
      case 'auth/invalid-email':
        return 'Невірний формат email';
      case 'auth/weak-password':
        return 'Слабкий пароль';
      default:
        if (error.name === 'AbortError') {
          return 'Запит скасовано. Перевірте налаштування Firebase.';
        }
        return error.message || 'Помилка';
    }
  }
  return 'Невідома помилка';
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const loginForm = useForm<LoginFormData>({
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormData>({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const resetForm = useForm<ResetFormData>({
    defaultValues: { email: '' },
  });

  const onLogin = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await signIn(data.email, data.password);
      toast.success('Вхід успішний');
      router.replace('/admin');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Паролі не співпадають');
      return;
    }

    if (data.password.length < 6) {
      toast.error('Пароль має бути не менше 6 символів');
      return;
    }

    setLoading(true);
    try {
      await signUp(data.email, data.password, data.name);
      toast.success('Реєстрація успішна');
      router.replace('/admin');
    } catch (error) {
      console.error('Register error:', error);
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const onReset = async (data: ResetFormData) => {
    setLoading(true);
    try {
      await resetPassword(data.email);
      setResetSent(true);
      toast.success('Інструкції надіслано на email');
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Toaster />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-zinc-900 to-zinc-950" />

      <Card className="relative w-full max-w-md bg-zinc-900/80 border-zinc-800 backdrop-blur">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Car className="h-7 w-7 text-amber-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">K24 Shop</CardTitle>
          <CardDescription className="text-zinc-500">
            Адмін-панель магазину автозапчастин
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
              <TabsTrigger value="login" className="data-[state=active]:bg-zinc-700">
                Вхід
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-zinc-700">
                Реєстрація
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4 mt-6">
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login_email" className="text-zinc-400">
                    Email
                  </Label>
                  <Input
                    id="login_email"
                    type="email"
                    placeholder="email@example.com"
                    {...loginForm.register('email', { required: true })}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login_password" className="text-zinc-400">
                    Пароль
                  </Label>
                  <Input
                    id="login_password"
                    type="password"
                    placeholder="••••••••"
                    {...loginForm.register('password', { required: true })}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Вхід...
                    </>
                  ) : (
                    'Увійти'
                  )}
                </Button>
              </form>

              {/* Forgot password */}
              <div className="pt-4 border-t border-zinc-800">
                <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
                  {!resetSent ? (
                    <div className="space-y-2">
                      <Label htmlFor="reset_email" className="text-zinc-400">
                        Забули пароль?
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="reset_email"
                          type="email"
                          placeholder="email@example.com"
                          {...resetForm.register('email', { required: true })}
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                          disabled={loading}
                        />
                        <Button
                          type="submit"
                          variant="outline"
                          disabled={loading}
                          className="border-zinc-700 text-zinc-400 hover:text-white shrink-0"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-sm text-emerald-500">
                      ✓ Інструкції надіслано на {resetForm.getValues('email')}
                    </div>
                  )}
                </form>
              </div>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="space-y-4 mt-6">
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register_name" className="text-zinc-400">
                    Ім&apos;я
                  </Label>
                  <Input
                    id="register_name"
                    type="text"
                    placeholder="Ваше ім'я"
                    {...registerForm.register('name', { required: true })}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register_email" className="text-zinc-400">
                    Email
                  </Label>
                  <Input
                    id="register_email"
                    type="email"
                    placeholder="email@example.com"
                    {...registerForm.register('email', { required: true })}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register_password" className="text-zinc-400">
                    Пароль
                  </Label>
                  <Input
                    id="register_password"
                    type="password"
                    placeholder="Мінімум 6 символів"
                    {...registerForm.register('password', { required: true, minLength: 6 })}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register_confirm" className="text-zinc-400">
                    Підтвердження паролю
                  </Label>
                  <Input
                    id="register_confirm"
                    type="password"
                    placeholder="Повторіть пароль"
                    {...registerForm.register('confirmPassword', { required: true })}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Реєстрація...
                    </>
                  ) : (
                    'Зареєструватися'
                  )}
                </Button>

                <p className="text-xs text-center text-zinc-600">
                  Перший зареєстрований користувач отримає права адміністратора
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
