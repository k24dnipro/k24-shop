"use client";

import {
  useCallback,
  useState,
} from 'react';
import {
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import { ProductImage as ProductImageUi } from '@/components/ui/product-image';
import { useRouter } from 'next/navigation';
import {
  Controller,
  useForm,
} from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useCategories } from '@/modules/categories/hooks/use-categories';
import {
  deleteProductImage,
  uploadProductImage,
} from '@/modules/products/services/products.service';
import {
  Product,
  PRODUCT_CONDITIONS,
  PRODUCT_STATUSES,
  ProductImage,
  ProductStatus,
} from '@/modules/products/types';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  categoryId: string;
  subcategoryId: string | null;
  status: ProductStatus;
  brand: string;
  partNumber: string;
  oem: string | null;
  compatibility: string;
  condition: "new" | "used" | "refurbished";
  carBrand: string | null;
  carModel: string | null;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  slug: string;
}

interface ProductFormProps {
  product?: Product;
  onSubmit: (
    data: Omit<
      Product,
      "id" | "createdAt" | "updatedAt" | "views" | "inquiries"
    >
  ) => Promise<string | void>;
  loading?: boolean;
}

export function ProductForm({ product, onSubmit, loading }: ProductFormProps) {
  const router = useRouter();
  const { categories } = useCategories();
  const [images, setImages] = useState<ProductImage[]>(product?.images || []);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price || 0,
      originalPrice: product?.originalPrice ?? null,
      categoryId: product?.categoryId || "",
      subcategoryId: product?.subcategoryId ?? null,
      status: product?.status || "in_stock",
      brand: product?.brand || "",
      partNumber: product?.partNumber || "",
      oem: product?.oem ?? null,
      compatibility: product?.compatibility?.join(", ") || "",
      condition: product?.condition || "used",
      carBrand: product?.carBrand ?? null,
      carModel: product?.carModel ?? null,
      metaTitle: product?.seo?.metaTitle || "",
      metaDescription: product?.seo?.metaDescription || "",
      metaKeywords: product?.seo?.metaKeywords?.join(", ") || "",
      slug: product?.seo?.slug || "",
    },
  });

  const watchCategoryId = watch("categoryId");
  const watchMetaTitle = watch("metaTitle");
  const watchMetaDescription = watch("metaDescription");

  const selectedCategory = categories.find((c) => c.id === watchCategoryId);

  const subcategories = categories.filter(
    (c) => c.parentId === selectedCategory?.id
  );

  const handleImageUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setUploading(true);
      try {
        const productId = product?.id || "temp_" + Date.now();

        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          if (!file.type.startsWith("image/")) {
            toast.error(`${file.name} не є зображенням`);
            continue;
          }

          if (file.size > 5 * 1024 * 1024) {
            toast.error(`${file.name} занадто великий (макс. 5MB)`);
            continue;
          }

          const newImage = await uploadProductImage(
            productId,
            file,
            images.length + i
          );
          setImages((prev) => [...prev, newImage]);
        }

        toast.success("Фото завантажено");
      } catch {
        toast.error("Помилка завантаження фото");
      } finally {
        setUploading(false);
      }
    },
    [images.length, product?.id]
  );

  const handleImageDelete = useCallback(
    async (imageId: string) => {
      if (!product?.id) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        return;
      }

      try {
        const image = images.find((img) => img.id === imageId);
        if (!image) return;

        await deleteProductImage(image.url);
        setImages((prev) => prev.filter((img) => img.id !== imageId));
        toast.success("Фото видалено");
      } catch {
        toast.error("Помилка видалення фото");
      }
    },
    [product?.id, images]
  );

  const onFormSubmit = async (data: ProductFormData) => {
    const submitData = {
      name: data.name,
      description: data.description,
      price: data.price,
      originalPrice: data.originalPrice ?? null,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId ?? null,
      status: data.status,
      brand: data.brand,
      partNumber: data.partNumber,
      oem: data.oem ?? null,
      compatibility: data.compatibility
        ? data.compatibility
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
        : [],
      condition: data.condition,
      carBrand: data.carBrand ?? null,
      carModel: data.carModel ?? null,
      images,
      seo: {
        metaTitle: data.metaTitle || data.name,
        metaDescription:
          data.metaDescription || data.description?.substring(0, 160) || "",
        metaKeywords: data.metaKeywords
          ? data.metaKeywords
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
          : [],
        ogTitle: data.metaTitle || data.name,
        ogDescription:
          data.metaDescription || data.description?.substring(0, 160) || "",
        ogImage: images[0]?.url || "",
        canonicalUrl: "",
        slug: data.slug || (data.partNumber ? data.partNumber.toLowerCase().replace(/[^a-z0-9]+/g, "_") : ""),
      },
      createdBy: product?.createdBy || "",
    } as Omit<
      Product,
      "id" | "createdAt" | "updatedAt" | "views" | "inquiries"
    >;

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-zinc-900/50 border border-zinc-800">
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-zinc-800"
          >
            Загальне
          </TabsTrigger>
          <TabsTrigger
            value="details"
            className="data-[state=active]:bg-zinc-800"
          >
            Деталі
          </TabsTrigger>
          <TabsTrigger
            value="images"
            className="data-[state=active]:bg-zinc-800"
          >
            Фото
          </TabsTrigger>
          <TabsTrigger value="seo" className="data-[state=active]:bg-zinc-800">
            SEO
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">
                  Основна інформація
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Назва *</Label>
                  <Input
                    {...register("name", { required: "Назва обов'язкова" })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="Назва товару"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-400">Опис</Label>
                  <Textarea
                    {...register("description")}
                    className="bg-zinc-800 border-zinc-700 text-white min-h-32"
                    placeholder="Детальний опис товару"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">
                  Ціна та статус
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Ціна (₴) *</Label>
                    <Input
                      type="number"
                      {...register("price", {
                        required: "Ціна обов'язкова",
                        min: { value: 0, message: "Ціна має бути >= 0" },
                        valueAsNumber: true,
                      })}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                    {errors.price && (
                      <p className="text-sm text-red-500">
                        {errors.price.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-400">Стара ціна (₴)</Label>
                    <Input
                      type="number"
                      {...register("originalPrice", { valueAsNumber: true })}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-400">Статус *</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue placeholder="Оберіть статус" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-zinc-800">
                          {PRODUCT_STATUSES.map((status) => (
                            <SelectItem
                              key={status.value}
                              value={status.value}
                              className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                            >
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-400">Категорія *</Label>
                  <Controller
                    name="categoryId"
                    control={control}
                    rules={{ required: "Категорія обов'язкова" }}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue placeholder="Оберіть категорію" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-zinc-800">
                          {categories
                            .filter((c) => !c.parentId)
                            .map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.id}
                                className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                              >
                                {category.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.categoryId && (
                    <p className="text-sm text-red-500">
                      {errors.categoryId.message}
                    </p>
                  )}
                </div>

                {subcategories.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-zinc-400">Підкатегорія</Label>
                    <Controller
                      name="subcategoryId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? undefined}
                          onValueChange={(value) => field.onChange(value || null)}
                        >
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue placeholder="Оберіть підкатегорію" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-950 border-zinc-800">
                            {subcategories.map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.id}
                                className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                              >
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6 mt-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                Характеристики
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-zinc-400">Бренд</Label>
                  <Input
                    {...register("brand")}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="Виробник"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-400">Стан</Label>
                  <Controller
                    name="condition"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue placeholder="Оберіть стан" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-zinc-800">
                          {PRODUCT_CONDITIONS.map((condition) => (
                            <SelectItem
                              key={condition.value}
                              value={condition.value}
                              className="text-zinc-400 focus:text-white focus:bg-zinc-900"
                            >
                              {condition.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-400">Оригінальний номер (OEM)</Label>
                  <Input
                    {...register("oem")}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="Оригінальний номер виробника"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-400">Марка авто</Label>
                  <Input
                    {...register("carBrand")}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="BMW, Audi..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-400">Модель авто</Label>
                  <Input
                    {...register("carModel")}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="X5, A4..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Сумісність</Label>
                <Textarea
                  {...register("compatibility")}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="BMW X5 2018-2022, BMW X6 2019-2022"
                />
                <p className="text-xs text-zinc-500">
                  Список сумісних авто (через кому)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-6 mt-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Фотографії</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <label
                  htmlFor="image_upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-k24-yellow/50 transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 text-k24-yellow animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-zinc-500 mb-2" />
                      <span className="text-sm text-zinc-500">
                        Натисніть або перетягніть фото
                      </span>
                      <span className="text-xs text-zinc-600 mt-1">
                        PNG, JPG до 5MB
                      </span>
                    </>
                  )}
                </label>
                <input
                  id="image_upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files)}
                  disabled={uploading}
                />
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className="relative group aspect-square rounded-lg overflow-hidden bg-zinc-800"
                    >
                      <ProductImageUi
                        src={image.url}
                        alt={image.alt}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-white hover:bg-red-500/20"
                          onClick={() => handleImageDelete(image.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-k24-yellow text-black text-xs px-2 py-1 rounded">
                          Головне
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6 mt-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                SEO налаштування
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">URL (slug)</Label>
                <Input
                  {...register("slug")}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="product_name"
                />
                <p className="text-xs text-zinc-500">
                  Унікальний URL товару. Якщо порожній - генерується автоматично
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Meta Title</Label>
                <Input
                  {...register("metaTitle")}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="SEO заголовок (50-60 символів)"
                  maxLength={60}
                />
                <p className="text-xs text-zinc-500">
                  {watchMetaTitle.length}/60 символів
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Meta Description</Label>
                <Textarea
                  {...register("metaDescription")}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="SEO опис (150-160 символів)"
                  maxLength={160}
                />
                <p className="text-xs text-zinc-500">
                  {watchMetaDescription.length}/160 символів
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Meta Keywords</Label>
                <Input
                  {...register("metaKeywords")}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="ключові, слова, через, кому"
                />
                <p className="text-xs text-zinc-500">
                  Ключові слова для пошукових систем (через кому)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
        >
          Скасувати
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-k24-yellow hover:bg-k24-yellow text-black"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Збереження...
            </>
          ) : product ? (
            "Зберегти зміни"
          ) : (
            "Створити товар"
          )}
        </Button>
      </div>
    </form>
  );
}
