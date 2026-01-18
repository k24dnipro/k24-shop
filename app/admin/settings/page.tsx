'use client';

import { useState } from 'react';
import {
  CheckCircle,
  Loader2,
  Shield,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/admin/header';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  deleteUser,
  resetPassword,
  updateUserProfile,
} from '@/modules/users/services/users.service';

export default function SettingsPage() {
  const { user, logOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Profile form
  const [displayName, setDisplayName] = useState(user?.displayName || '');

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await updateUserProfile(user.id, { displayName });
      toast.success('Профіль оновлено');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error('Помилка оновлення профілю');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;

    setResettingPassword(true);
    try {
      // Use window.location.origin to get the current domain
      const continueUrl = `${window.location.origin}/login?mode=resetPassword`;
      await resetPassword(user.email, continueUrl);
      toast.success('Інструкції для скидання паролю надіслано на вашу електронну пошту. Перевірте папку "Спам", якщо не знайдете листа.', {
        duration: 5000,
      });
    } catch (error: unknown) {
      console.error('Password reset error:', error);
      let errorMessage = 'Помилка відправки листа для скидання паролю.';
      
      if (error instanceof Error) {
        const code = (error as { code?: string }).code;
        if (code === 'auth/user-not-found') {
          errorMessage = 'Користувача з таким email не знайдено.';
        } else if (code === 'auth/invalid-email') {
          errorMessage = 'Невірний формат email.';
        } else if (code === 'auth/too-many-requests') {
          errorMessage = 'Забагато спроб. Спробуйте пізніше.';
        } else {
          errorMessage = `Помилка: ${error.message || 'Перевірте налаштування Firebase та SMTP в консолі.'}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleSignOutAll = async () => {
    setSigningOut(true);
    try {
      await logOut();
      toast.success('Ви вийшли з усіх пристроїв');
      router.replace('/login');
    } catch {
      toast.error('Помилка виходу');
    } finally {
      setSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeletingAccount(true);
    try {
      await deleteUser(user.id);
      await logOut();
      toast.success('Акаунт видалено');
      router.replace('/login');
    } catch {
      toast.error('Помилка видалення акаунту');
    } finally {
      setDeletingAccount(false);
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="flex flex-col">
      <Header title="Налаштування" />

      <div className="p-6 space-y-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-zinc-900/50 border border-zinc-800 w-fit">
            <TabsTrigger value="profile" className="data-[state=active]:bg-zinc-800">
              <User className="mr-2 h-4 w-4" />
              Профіль
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-zinc-800">
              <Shield className="mr-2 h-4 w-4" />
              Безпека
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <Card className="bg-zinc-900/50 border-zinc-800 max-w-2xl">
              <CardHeader>
                <CardTitle className="text-white">Профіль</CardTitle>
                <CardDescription className="text-zinc-500">
                  Оновіть інформацію вашого профілю
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Email</Label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="bg-zinc-800 border-zinc-700 text-zinc-500"
                  />
                  <p className="text-xs text-zinc-600">Email не можна змінити</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-400">Ім&apos;я</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="Ваше ім&apos;я"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-400">Роль</Label>
                  <Input
                    value={user?.role === 'admin' ? 'Адміністратор' : user?.role === 'manager' ? 'Менеджер' : 'Переглядач'}
                    disabled
                    className="bg-zinc-800 border-zinc-700 text-zinc-500"
                  />
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Збереження...
                    </>
                  ) : saved ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Збережено
                    </>
                  ) : (
                    'Зберегти зміни'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-6">
            <Card className="bg-zinc-900/50 border-zinc-800 max-w-2xl">
              <CardHeader>
                <CardTitle className="text-white">Безпека</CardTitle>
                <CardDescription className="text-zinc-500">
                  Управління паролем та безпекою акаунту
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-medium text-white mb-2">Зміна паролю</h4>
                  <p className="text-sm text-zinc-500 mb-4">
                    Для зміни паролю скористайтесь функцією &quot;Забув пароль&quot; на сторінці входу.
                    Ми надішлемо інструкції на вашу електронну пошту.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleResetPassword}
                    disabled={resettingPassword}
                    className="border-zinc-700 text-zinc-400 hover:text-white"
                  >
                    {resettingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Відправка...
                      </>
                    ) : (
                      'Скинути пароль'
                    )}
                  </Button>
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-medium text-white mb-2">Сесії</h4>
                  <p className="text-sm text-zinc-500 mb-4">
                    Ви увійшли з цього пристрою. Вийдіть з усіх сесій для безпеки.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleSignOutAll}
                    disabled={signingOut}
                    className="border-zinc-700 text-zinc-400 hover:text-white"
                  >
                    {signingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Вихід...
                      </>
                    ) : (
                      'Вийти з усіх пристроїв'
                    )}
                  </Button>
                </div>

                <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <h4 className="font-medium text-red-400 mb-2">Небезпечна зона</h4>
                  <p className="text-sm text-zinc-500 mb-4">
                    Видалення акаунту призведе до втрати всіх даних.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={deletingAccount}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    {deletingAccount ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Видалення...
                      </>
                    ) : (
                      'Видалити акаунт'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete account confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Видалити акаунт?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Ви впевнені, що хочете видалити свій акаунт? Ця дія неможлива для скасування і призведе до:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Видалення всіх ваших даних</li>
                <li>Втрати доступу до системи</li>
                <li>Видалення всіх пов&apos;язаних записів</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800">
              Скасувати
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deletingAccount ? 'Видалення...' : 'Видалити акаунт'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

