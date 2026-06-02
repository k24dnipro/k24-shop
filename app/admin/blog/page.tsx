"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, Plus, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBlogPosts, useBlogMutations } from '@/modules/blog/hooks/use-blog';
import { BlogPost } from '@/modules/blog/types';
import { Header } from '@/components/admin/header';
import { DataTable } from '@/components/admin/dataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';

export default function BlogAdminPage() {
  const router = useRouter();
  const { posts, loading, refresh } = useBlogPosts();
  const { remove } = useBlogMutations();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await remove(deleteId);
      toast.success('Статтю видалено');
      refresh();
    } catch {
      toast.error('Помилка видалення статті');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<BlogPost>[] = useMemo(
    () => [
      {
        accessorKey: 'coverImage',
        header: 'Обкладинка',
        cell: ({ row }) => (
          <div className="relative w-16 h-10 rounded bg-zinc-800 overflow-hidden flex items-center justify-center">
            {row.original.coverImage ? (
              <Image
                src={row.original.coverImage}
                alt={row.original.title}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <span className="text-zinc-600 text-[10px]">Ні</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Заголовок',
        cell: ({ row }) => <span className="font-medium text-white">{row.original.title}</span>,
      },
      {
        accessorKey: 'slug',
        header: 'URL (slug)',
        cell: ({ row }) => <span className="font-mono text-zinc-500 text-xs">{row.original.slug}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Статус',
        cell: ({ row }) => {
          const isPublished = row.original.status === 'published';
          return (
            <Badge
              variant="outline"
              className={
                isPublished
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
              }
            >
              {isPublished ? 'Опубліковано' : 'Чернетка'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'views',
        header: 'Перегляди',
        cell: ({ row }) => <span className="text-zinc-400 font-mono text-sm">{row.original.views || 0}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: 'Створено',
        cell: ({ row }) => (
          <span className="text-zinc-400 text-sm">
            {row.original.createdAt.toLocaleDateString('uk-UA')}
          </span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white"
              onClick={() => router.push(`/blog/${row.original.slug}`)}
              title="Переглянути на сайті"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white"
              onClick={() => router.push(`/admin/blog/${row.original.id}/edit`)}
              title="Редагувати"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-400 hover:text-red-500"
              onClick={() => setDeleteId(row.original.id)}
              title="Видалити"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [router]
  );

  return (
    <div className="flex flex-col">
      <Header title={`Блог (${posts.length} статей)`} />

      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <Button
            onClick={() => router.push('/admin/blog/new')}
            className="bg-k24-yellow hover:bg-k24-yellow text-black font-semibold"
          >
            <Plus className="mr-2 h-4 w-4" />
            Написати статтю
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 text-k24-yellow animate-spin" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={posts}
            onRowClick={(row) => router.push(`/admin/blog/${row.id}/edit`)}
          />
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Видалити статтю?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Ви впевнені, що хочете видалити цю статтю? Цю дію неможливо скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800">
              Скасувати
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleting ? 'Видалення...' : 'Видалити'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
