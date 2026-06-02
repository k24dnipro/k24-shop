"use client";

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BlogPost } from '@/modules/blog/types';
import { uploadBlogImage, deleteBlogImage } from '@/modules/blog/services/blog.service';
import Image from 'next/image';

interface BlogFormData {
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage: string | null;
  status: 'draft' | 'published';
  metaTitle: string;
  metaDescription: string;
}

interface BlogFormProps {
  post?: BlogPost;
  onSubmit: (data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'views'>) => Promise<string | void>;
  loading?: boolean;
  cancelHref: string;
}

function translit(str: string): string {
  const ua: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ye', 'ж': 'zh', 'з': 'z',
    'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
    'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ь': '', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'H', 'Ґ': 'G', 'Д': 'D', 'Е': 'E', 'Є': 'Ye', 'Ж': 'Zh', 'З': 'Z',
    'И': 'Y', 'І': 'I', 'Ї': 'Yi', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P',
    'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
    'Ь': '', 'Ю': 'Yu', 'Я': 'Ya'
  };
  return str.split('').map(char => ua[char] || char).join('');
}

function generateSlug(title: string): string {
  return translit(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function BlogForm({ post, onSubmit, loading, cancelHref }: BlogFormProps) {
  const router = useRouter();
  const [coverImage, setCoverImage] = useState<string | null>(post?.coverImage || null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BlogFormData>({
    defaultValues: {
      title: post?.title || '',
      slug: post?.slug || '',
      summary: post?.summary || '',
      content: post?.content || '',
      coverImage: post?.coverImage || null,
      status: post?.status || 'draft',
      metaTitle: post?.metaTitle || '',
      metaDescription: post?.metaDescription || '',
    },
  });

  const watchTitle = watch('title');
  const watchMetaTitle = watch('metaTitle');
  const watchMetaDescription = watch('metaDescription');

  // Auto-generate slug and meta Title from title for new posts
  useEffect(() => {
    if (watchTitle && !post) {
      const suggestedSlug = generateSlug(watchTitle);
      setValue('slug', suggestedSlug);
      setValue('metaTitle', `${watchTitle} | K24 Parts`);
    }
  }, [watchTitle, post, setValue]);

  const handleImageUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        toast.error('Файл не є зображенням');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Розмір фото не має перевищувати 5MB');
        return;
      }
      const url = await uploadBlogImage(file);
      setCoverImage(url);
      setValue('coverImage', url);
      toast.success('Фото завантажено');
    } catch {
      toast.error('Помилка завантаження фото');
    } finally {
      setUploading(false);
    }
  }, [setValue]);

  const handleImageDelete = useCallback(async () => {
    if (!coverImage) return;
    try {
      await deleteBlogImage(coverImage);
      setCoverImage(null);
      setValue('coverImage', null);
      toast.success('Фото видалено');
    } catch {
      toast.error('Помилка видалення фото');
    }
  }, [coverImage, setValue]);

  const onFormSubmit = async (data: BlogFormData) => {
    const submitData = {
      ...data,
      coverImage,
    };
    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: General Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Загальна інформація</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Заголовок *</Label>
                <Input
                  {...register('title', { required: 'Заголовок обов’язковий' })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Введіть заголовок статті"
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">URL (slug) *</Label>
                <Input
                  {...register('slug', { required: 'URL обов’язковий' })}
                  className="bg-zinc-800 border-zinc-700 text-white font-mono"
                  placeholder="nazva-statti"
                />
                {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Короткий опис (Summary) *</Label>
                <Textarea
                  {...register('summary', { required: 'Короткий опис обов’язковий' })}
                  className="bg-zinc-800 border-zinc-700 text-white min-h-20"
                  placeholder="Короткий анонс для картки блогу"
                />
                {errors.summary && <p className="text-sm text-red-500">{errors.summary.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Вміст статті (HTML) *</Label>
                <Textarea
                  {...register('content', { required: 'Вміст статті обов’язковий' })}
                  className="bg-zinc-800 border-zinc-700 text-white min-h-96 font-mono text-sm leading-relaxed"
                  placeholder="<p>Введіть текст статті з використанням HTML тегів...</p>"
                />
                {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* SEO Block */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">SEO налаштування</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Meta Title *</Label>
                <Input
                  {...register('metaTitle', { required: 'Meta Title обов’язковий' })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="SEO заголовок"
                />
                <p className="text-xs text-zinc-500">{watchMetaTitle?.length || 0} символів</p>
                {errors.metaTitle && <p className="text-sm text-red-500">{errors.metaTitle.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Meta Description *</Label>
                <Textarea
                  {...register('metaDescription', { required: 'Meta Description обов’язковий' })}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="SEO опис для пошукових систем"
                />
                <p className="text-xs text-zinc-500">{watchMetaDescription?.length || 0} символів</p>
                {errors.metaDescription && <p className="text-sm text-red-500">{errors.metaDescription.message}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Options & Cover Image */}
        <div className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Статус публікації</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Статус *</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Оберіть статус" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800">
                        <SelectItem value="draft" className="text-zinc-400 focus:text-white focus:bg-zinc-900">
                          Чернетка
                        </SelectItem>
                        <SelectItem value="published" className="text-zinc-400 focus:text-white focus:bg-zinc-900">
                          Опубліковано
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Обкладинка статті</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {coverImage ? (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-800">
                  <Image
                    src={coverImage}
                    alt="Cover image"
                    fill
                    sizes="(max-width: 1024px) 100vw, 30vw"
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 z-10"
                    onClick={handleImageDelete}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <label
                    htmlFor="blog_cover_upload"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-k24-yellow/50 transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="h-8 w-8 text-k24-yellow animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-zinc-500 mb-2" />
                        <span className="text-sm text-zinc-500 text-center px-4">
                          Натисніть або перетягніть головне фото
                        </span>
                        <span className="text-xs text-zinc-600 mt-1">PNG, JPG до 5MB</span>
                      </>
                    )}
                  </label>
                  <input
                    id="blog_cover_upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files)}
                    disabled={uploading}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(cancelHref)}
          className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
        >
          Скасувати
        </Button>
        <Button
          type="submit"
          disabled={loading || uploading}
          className="bg-k24-yellow hover:bg-k24-yellow text-black font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Збереження...
            </>
          ) : post ? (
            'Зберегти зміни'
          ) : (
            'Опублікувати статтю'
          )}
        </Button>
      </div>
    </form>
  );
}
