'use client';

import {
  useEffect,
  useState,
} from 'react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import {
  Loader2,
  MoreHorizontal,
  Settings,
  Shield,
  ShieldOff,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/admin/header';
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
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  activateUser,
  deactivateUser,
  getUsers,
  updateUserPermissions,
  updateUserRole,
} from '@/lib/services/users';
import {
  DEFAULT_PERMISSIONS,
  User,
  UserPermissions,
  UserRole,
} from '@/lib/types';

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Адміністратор', description: 'Повний доступ до всіх функцій' },
  { value: 'manager', label: 'Менеджер', description: 'Може керувати товарами та імпортом' },
  { value: 'viewer', label: 'Переглядач', description: 'Тільки перегляд статистики' },
];

export default function UsersPage() {
  const { user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editedPermissions, setEditedPermissions] = useState<UserPermissions | null>(null);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);

  const canManageUsers = hasPermission('canManageUsers');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Помилка завантаження користувачів');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      await updateUserRole(userId, role);
      toast.success('Роль змінено');
      fetchUsers();
    } catch (error) {
      toast.error('Помилка зміни ролі');
    }
  };

  const handleOpenPermissions = (user: User) => {
    setSelectedUser(user);
    setEditedPermissions({ ...user.permissions });
    setPermissionsDialogOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser || !editedPermissions) return;

    try {
      await updateUserPermissions(selectedUser.id, editedPermissions);
      toast.success('Права збережено');
      setPermissionsDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error('Помилка збереження прав');
    }
  };

  const handleToggleActive = async () => {
    if (!userToDeactivate) return;

    try {
      if (userToDeactivate.isActive) {
        await deactivateUser(userToDeactivate.id);
        toast.success('Користувача деактивовано');
      } else {
        await activateUser(userToDeactivate.id);
        toast.success('Користувача активовано');
      }
      setDeactivateDialogOpen(false);
      setUserToDeactivate(null);
      fetchUsers();
    } catch (error) {
      toast.error('Помилка');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const config: Record<UserRole, string> = {
      admin: 'bg-red-500/10 text-red-500 border-red-500/20',
      manager: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      viewer: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    };

    return (
      <Badge variant="outline" className={config[role]}>
        {ROLES.find((r) => r.value === role)?.label || role}
      </Badge>
    );
  };

  if (!canManageUsers) {
    return (
      <div className="flex flex-col">
        <Header title="Користувачі" />
        <div className="p-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-zinc-400">У вас немає прав для керування користувачами</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title="Користувачі" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Всього</p>
                  <p className="text-2xl font-bold text-white">{users.length}</p>
                </div>
                <Users className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Активних</p>
                  <p className="text-2xl font-bold text-emerald-500">
                    {users.filter((u) => u.isActive).length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Адміністраторів</p>
                  <p className="text-2xl font-bold text-red-500">
                    {users.filter((u) => u.role === 'admin').length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users list */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-0 divide-y divide-zinc-800">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              </div>
            ) : users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-4 ${
                    !user.isActive ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL} />
                      <AvatarFallback className="bg-amber-500/10 text-amber-500">
                        {user.displayName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{user.displayName}</span>
                        {getRoleBadge(user.role)}
                        {!user.isActive && (
                          <Badge variant="outline" className="border-red-500/20 text-red-500">
                            Деактивовано
                          </Badge>
                        )}
                        {user.id === currentUser?.id && (
                          <Badge variant="outline" className="border-amber-500/20 text-amber-500">
                            Ви
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <span>{user.email}</span>
                        {user.lastLogin && (
                          <>
                            <span>•</span>
                            <span>
                              Останній вхід{' '}
                              {formatDistanceToNow(user.lastLogin, {
                                addSuffix: true,
                                locale: uk,
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {user.id !== currentUser?.id && (
                    <div className="flex items-center gap-2">
                      {/* Role selector */}
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                      >
                        <SelectTrigger className="w-36 bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-zinc-800">
                          {ROLES.map((role) => (
                            <SelectItem
                              key={role.value}
                              value={role.value}
                              className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                            >
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-zinc-400 hover:text-white"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800">
                          <DropdownMenuItem
                            onClick={() => handleOpenPermissions(user)}
                            className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Налаштувати права
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setUserToDeactivate(user);
                              setDeactivateDialogOpen(true);
                            }}
                            className={
                              user.isActive
                                ? 'text-red-400 focus:text-red-400 focus:bg-red-500/10'
                                : 'text-emerald-400 focus:text-emerald-400 focus:bg-emerald-500/10'
                            }
                          >
                            {user.isActive ? (
                              <>
                                <ShieldOff className="mr-2 h-4 w-4" />
                                Деактивувати
                              </>
                            ) : (
                              <>
                                <Shield className="mr-2 h-4 w-4" />
                                Активувати
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <Users className="h-12 w-12 mb-4 opacity-50" />
                <p>Користувачі відсутні</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Permissions dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Права користувача</DialogTitle>
            <DialogDescription className="text-zinc-500">
              {selectedUser?.displayName} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>

          {editedPermissions && (
            <div className="space-y-4 py-4">
              {Object.entries(editedPermissions).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-zinc-400 capitalize">
                    {key
                      .replace('can', '')
                      .replace(/([A-Z])/g, ' $1')
                      .trim()}
                  </Label>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) =>
                      setEditedPermissions({
                        ...editedPermissions,
                        [key]: checked,
                      })
                    }
                  />
                </div>
              ))}

              <div className="pt-4 border-t border-zinc-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setEditedPermissions(DEFAULT_PERMISSIONS[selectedUser!.role])
                  }
                  className="w-full border-zinc-800 text-zinc-400 hover:text-white"
                >
                  Скинути до прав ролі {selectedUser?.role}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPermissionsDialogOpen(false)}
              className="border-zinc-800 text-zinc-400 hover:text-white"
            >
              Скасувати
            </Button>
            <Button
              onClick={handleSavePermissions}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              Зберегти
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirmation */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {userToDeactivate?.isActive ? 'Деактивувати' : 'Активувати'} користувача?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {userToDeactivate?.isActive
                ? `Користувач ${userToDeactivate?.displayName} не зможе увійти в систему.`
                : `Користувач ${userToDeactivate?.displayName} знову зможе увійти в систему.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800">
              Скасувати
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleActive}
              className={
                userToDeactivate?.isActive
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-emerald-500 hover:bg-emerald-600'
              }
            >
              {userToDeactivate?.isActive ? 'Деактивувати' : 'Активувати'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

