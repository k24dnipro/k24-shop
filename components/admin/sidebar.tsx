'use client';

import { useState } from 'react';
import {
  Car,
  ChevronLeft,
  ChevronRight,
  FileDown,
  FileUp,
  FolderTree,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils';

const navigation = [
  {
    name: 'Дашборд',
    href: '/admin',
    icon: LayoutDashboard,
    permission: null,
  },
  {
    name: 'Товари',
    href: '/admin/products',
    icon: Package,
    permission: null,
  },
  {
    name: 'Категорії',
    href: '/admin/categories',
    icon: FolderTree,
    permission: 'canManageCategories',
  },
  {
    name: 'Імпорт',
    href: '/admin/import',
    icon: FileUp,
    permission: 'canImportData',
  },
  {
    name: 'Експорт',
    href: '/admin/export',
    icon: FileDown,
    permission: 'canExportData',
  },
  {
    name: 'Звернення',
    href: '/admin/inquiries',
    icon: MessageSquare,
    permission: null,
  },
  {
    name: 'Користувачі',
    href: '/admin/users',
    icon: Users,
    permission: 'canManageUsers',
  },
  {
    name: 'Налаштування',
    href: '/admin/settings',
    icon: Settings,
    permission: null,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNavigation = navigation.filter(
    (item) => !item.permission || hasPermission(item.permission as any)
  );

  return (
    <div
      className={cn(
        'relative flex flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
          <Car className="h-5 w-5 text-amber-500" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">K24 Shop</span>
            <span className="text-xs text-zinc-500">Адмін панель</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-amber-500/10 text-amber-500'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors',
                    isActive ? 'text-amber-500' : 'text-zinc-500 group-hover:text-white'
                  )}
                />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User info */}
      {user && !collapsed && (
        <>
          <Separator className="bg-zinc-800" />
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-white">
                {user.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">{user.displayName}</span>
                <span className="text-xs text-zinc-500 capitalize">{user.role}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Collapse button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-900 hover:text-white"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}

