'use client';

import {
  useEffect,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  Loader2,
  LogOut,
  User,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { auth } from '@/firebase';
import { Order } from '@/lib/types';
import { getOrdersForCustomer } from '@/modules/orders/services/orders.service';
import {
  getCustomerProfileById,
  upsertCustomerProfile,
} from '@/modules/customers/services/customers.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

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

interface ProfileFormData {
  name: string;
  phone: string;
}

export function AccountDialogContent() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const loginForm = useForm<LoginFormData>({
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormData>({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const profileForm = useForm<ProfileFormData>({
    defaultValues: { name: '', phone: '' },
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setLoading(false);

      if (user) {
        setOrdersLoading(true);
        setProfileLoading(true);
        try {
          const [ordersData, profile] = await Promise.all([
            getOrdersForCustomer(user.uid),
            getCustomerProfileById(user.uid),
          ]);
          setOrders(ordersData);
          if (profile) {
            profileForm.reset({
              name: profile.name ?? '',
              phone: profile.phone ?? '',
            });
          } else {
            profileForm.reset({
              name: user.displayName || '',
              phone: '',
            });
          }
        } catch (e) {
          console.error('Failed to load customer data', e);
          toast.error('Не вдалося завантажити дані акаунта');
        } finally {
          setOrdersLoading(false);
          setProfileLoading(false);
        }
      } else {
        setOrders([]);
        profileForm.reset({
          name: '',
          phone: '',
        });
      }
    });

    return () => unsub();
  }, []);

  const handleLogin = async (data: LoginFormData) => {
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast.success('Вхід успішний');
    } catch (error) {
      console.error('Login error', error);
      toast.error('Помилка входу. Перевірте email та пароль.');
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Паролі не співпадають');
      return;
    }
    if (data.password.length < 6) {
      toast.error('Пароль має бути не менше 6 символів');
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, data.email, data.password);
      toast.success('Реєстрація успішна. Тепер усі ваші замовлення будуть збережені в історії.');
    } catch (error) {
      console.error('Register error', error);
      toast.error('Помилка реєстрації. Можливо, цей email вже використовується.');
    }
  };

  const handleSaveProfile = async (data: ProfileFormData) => {
    if (!firebaseUser) return;

    try {
      setProfileLoading(true);
      await upsertCustomerProfile(firebaseUser.uid, {
        name: data.name,
        phone: data.phone || undefined,
        email: firebaseUser.email || '',
      });
      toast.success('Особисті дані збережено');
    } catch (e) {
      console.error('Profile save error', e);
      toast.error('Не вдалося зберегти дані');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Вихід виконано');
    } catch {
      toast.error('Помилка при виході');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 flex items-center justify-center rounded-full bg-k24-yellow/10 border border-k24-yellow/30">
            <User className="h-4 w-4 text-k24-yellow" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Особистий кабінет</p>
            <p className="text-xs text-zinc-400">
              Ваші дані та історія замовлень
            </p>
          </div>
        </div>
        {firebaseUser && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-zinc-700 text-zinc-300 hover:text-white hover:border-k24-yellow hover:bg-k24-yellow/10"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Вийти
          </Button>
        )}
      </div>

      {!firebaseUser ? (
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="login">Вхід</TabsTrigger>
            <TabsTrigger value="register">Реєстрація</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="pt-4 space-y-3">
            <form
              className="space-y-3"
              onSubmit={loginForm.handleSubmit(handleLogin)}
            >
              <Input
                type="email"
                placeholder="Email"
                {...loginForm.register('email', { required: true })}
                className="bg-zinc-900 border-zinc-800"
              />
              <Input
                type="password"
                placeholder="Пароль"
                {...loginForm.register('password', { required: true })}
                className="bg-zinc-900 border-zinc-800"
              />
              <Button type="submit" className="w-full bg-k24-yellow text-black hover:bg-k24-yellow">
                Увійти
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="register" className="pt-4 space-y-3">
            <form
              className="space-y-3"
              onSubmit={registerForm.handleSubmit(handleRegister)}
            >
              <Input
                placeholder="Ім'я"
                {...registerForm.register('name', { required: true })}
                className="bg-zinc-900 border-zinc-800"
              />
              <Input
                type="email"
                placeholder="Email"
                {...registerForm.register('email', { required: true })}
                className="bg-zinc-900 border-zinc-800"
              />
              <Input
                type="password"
                placeholder="Пароль"
                {...registerForm.register('password', { required: true })}
                className="bg-zinc-900 border-zinc-800"
              />
              <Input
                type="password"
                placeholder="Підтвердження пароля"
                {...registerForm.register('confirmPassword', { required: true })}
                className="bg-zinc-900 border-zinc-800"
              />
              <Button type="submit" className="w-full bg-k24-yellow text-black hover:bg-k24-yellow">
                Зареєструватися
              </Button>
              <p className="text-xs text-zinc-500">
                Ви завжди можете оформити замовлення без акаунта. Реєстрація потрібна лише, щоб потім переглядати історію замовлень.
              </p>
            </form>
          </TabsContent>
        </Tabs>
      ) : (
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid grid-cols-2 bg-zinc-900 border border-zinc-800 mb-2">
            <TabsTrigger value="profile">Особисті дані</TabsTrigger>
            <TabsTrigger value="orders">Замовлення</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="pt-2 space-y-3">
            <p className="text-xs text-zinc-500">
              Дані використовуються для швидкого оформлення замовлень та зв&apos;язку з вами.
            </p>
            <form
              className="space-y-3"
              onSubmit={profileForm.handleSubmit(handleSaveProfile)}
            >
              <Input
                placeholder="Ім'я та прізвище"
                {...profileForm.register('name', { required: true })}
                className="bg-zinc-900 border-zinc-800"
              />
              <Input
                placeholder="Телефон"
                {...profileForm.register('phone')}
                className="bg-zinc-900 border-zinc-800"
              />
              <Input
                value={firebaseUser.email || ''}
                disabled
                className="bg-zinc-900 border-zinc-800 text-zinc-400"
              />
              <Button
                type="submit"
                disabled={profileLoading}
                className="w-full bg-k24-yellow text-black hover:bg-k24-yellow"
              >
                {profileLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Збереження...
                  </>
                ) : (
                  'Зберегти'
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="orders" className="pt-2 space-y-2">
            <Separator className="bg-zinc-800" />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Історія замовлень</h3>
              {ordersLoading ? (
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Завантаження замовлень...
                </div>
              ) : orders.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  У вас ще немає збережених замовлень. Оформіть замовлення в каталозі — і воно з&apos;явиться тут.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-zinc-800 rounded-md p-3 text-sm space-y-1 bg-zinc-900/60"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-300">Замовлення #{order.id.slice(0, 8)}</span>
                        <span className="text-xs text-zinc-500">
                          {order.createdAt.toLocaleString('uk-UA')}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">
                        Товарів: {order.totalItems} • Сума: {order.totalPrice.toLocaleString()} ₴
                      </div>
                      <div className="text-xs text-zinc-500 line-clamp-1">
                        {order.items.map((i) => i.name).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

