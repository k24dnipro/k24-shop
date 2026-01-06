'use client';

import { useState } from 'react';
import {
  Bell,
  CheckCircle,
  Loader2,
  Shield,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/admin/header';
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
import { Switch } from '@/components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useAuth } from '@/lib/hooks/useAuth';
import { updateUserProfile } from '@/lib/services/users';

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile form
  const [displayName, setDisplayName] = useState(user?.displayName || '');

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newInquiryNotifications, setNewInquiryNotifications] = useState(true);
  const [lowStockNotifications, setLowStockNotifications] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await updateUserProfile(user.id, { displayName });
      toast.success('Профіль оновлено');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      toast.error('Помилка оновлення профілю');
    } finally {
      setLoading(false);
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
            <TabsTrigger value="notifications" className="data-[state=active]:bg-zinc-800">
              <Bell className="mr-2 h-4 w-4" />
              Сповіщення
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
                  <Label className="text-zinc-400">Ім'я</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="Ваше ім'я"
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

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6">
            <Card className="bg-zinc-900/50 border-zinc-800 max-w-2xl">
              <CardHeader>
                <CardTitle className="text-white">Сповіщення</CardTitle>
                <CardDescription className="text-zinc-500">
                  Налаштуйте які сповіщення ви хочете отримувати
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Email сповіщення</Label>
                    <p className="text-sm text-zinc-500">
                      Отримувати сповіщення на email
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Нові звернення</Label>
                    <p className="text-sm text-zinc-500">
                      Сповіщення про нові звернення клієнтів
                    </p>
                  </div>
                  <Switch
                    checked={newInquiryNotifications}
                    onCheckedChange={setNewInquiryNotifications}
                    disabled={!emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Закінчення товару</Label>
                    <p className="text-sm text-zinc-500">
                      Сповіщення коли товар закінчується
                    </p>
                  </div>
                  <Switch
                    checked={lowStockNotifications}
                    onCheckedChange={setLowStockNotifications}
                    disabled={!emailNotifications}
                  />
                </div>

                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                  onClick={() => toast.success('Налаштування збережено')}
                >
                  Зберегти налаштування
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
                    Для зміни паролю скористайтесь функцією "Забув пароль" на сторінці входу.
                    Ми надішлемо інструкції на вашу електронну пошту.
                  </p>
                  <Button
                    variant="outline"
                    className="border-zinc-700 text-zinc-400 hover:text-white"
                  >
                    Скинути пароль
                  </Button>
                </div>

                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h4 className="font-medium text-white mb-2">Сесії</h4>
                  <p className="text-sm text-zinc-500 mb-4">
                    Ви увійшли з цього пристрою. Вийдіть з усіх сесій для безпеки.
                  </p>
                  <Button
                    variant="outline"
                    className="border-zinc-700 text-zinc-400 hover:text-white"
                  >
                    Вийти з усіх пристроїв
                  </Button>
                </div>

                <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <h4 className="font-medium text-red-400 mb-2">Небезпечна зона</h4>
                  <p className="text-sm text-zinc-500 mb-4">
                    Видалення акаунту призведе до втрати всіх даних.
                  </p>
                  <Button variant="destructive" disabled>
                    Видалити акаунт
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

