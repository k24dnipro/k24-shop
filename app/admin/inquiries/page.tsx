'use client';

import {
  useEffect,
  useState,
} from 'react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import {
  Banknote,
  Clock,
  Loader2,
  Mail,
  MessageSquare,
  Package,
  Phone,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/admin/header';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Inquiry } from '@/lib/types';
import {
  deleteInquiry,
  getInquiries,
  updateInquiryStatus,
} from '@/modules/inquiries/services/inquiries.service';

const STATUSES = [
  { value: 'new', label: 'Нове', color: 'bg-k24-yellow/10 text-k24-yellow border-k24-yellow/20' },
  { value: 'in_progress', label: 'В обробці', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { value: 'completed', label: 'Завершено', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { value: 'cancelled', label: 'Скасовано', color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' },
];

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const data = await getInquiries();
      setInquiries(data);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      toast.error('Помилка завантаження звернень');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: Inquiry['status']) => {
    try {
      await updateInquiryStatus(id, status);
      toast.success('Статус оновлено');
      
      // Оновлюємо список звернень
      await fetchInquiries();
      
      // Оновлюємо вибране звернення в діалозі, якщо воно відкрите
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry({
          ...selectedInquiry,
          status,
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error updating inquiry status:', error);
      toast.error('Помилка оновлення статусу');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInquiry(id);
      toast.success('Звернення видалено');
      setDialogOpen(false);
      setSelectedInquiry(null);
      fetchInquiries();
    } catch (error) {
      toast.error('Помилка видалення');
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUSES.find((s) => s.value === status);
    return (
      <Badge variant="outline" className={config?.color}>
        {config?.label || status}
      </Badge>
    );
  };

  const filteredInquiries =
    statusFilter === 'all'
      ? inquiries
      : inquiries.filter((i) => i.status === statusFilter);

  const newCount = inquiries.filter((i) => i.status === 'new').length;
  const inProgressCount = inquiries.filter((i) => i.status === 'in_progress').length;

  return (
    <div className="flex flex-col">
      <Header title="Звернення" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Всього</p>
                  <p className="text-2xl font-bold text-white">{inquiries.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-k24-yellow" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Нових</p>
                  <p className="text-2xl font-bold text-k24-yellow">{newCount}</p>
                </div>
                <Clock className="h-8 w-8 text-k24-yellow" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">В обробці</p>
                  <p className="text-2xl font-bold text-blue-500">{inProgressCount}</p>
                </div>
                <Loader2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Завершено</p>
                  <p className="text-2xl font-bold text-emerald-500">
                    {inquiries.filter((i) => i.status === 'completed').length}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-zinc-900/50 border-zinc-800 text-white">
              <SelectValue placeholder="Фільтр по статусу" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-800">
              <SelectItem value="all" className="text-zinc-400 focus:text-white focus:bg-zinc-900">
                Всі статуси
              </SelectItem>
              {STATUSES.map((status) => (
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
        </div>

        {/* Inquiries list */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-0 divide-y divide-zinc-800">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-k24-yellow" />
              </div>
            ) : filteredInquiries.length > 0 ? (
              filteredInquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className="p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedInquiry(inquiry);
                    setDialogOpen(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{inquiry.customerName}</span>
                        {getStatusBadge(inquiry.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {inquiry.customerEmail}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {inquiry.customerPhone}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-3 w-3 text-zinc-500" />
                        <span className="text-k24-yellow">{inquiry.productName}</span>
                        {inquiry.proposedPrice != null && inquiry.proposedPrice > 0 && (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                            <Banknote className="h-3 w-3 mr-1" />
                            {inquiry.proposedPrice.toLocaleString('uk-UA')} ₴
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-zinc-400 line-clamp-2 mt-2">
                        {inquiry.message}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-zinc-500">
                        {formatDistanceToNow(inquiry.createdAt, {
                          addSuffix: true,
                          locale: uk,
                        })}
                      </span>
                      <Select
                        value={inquiry.status}
                        onValueChange={(value) => {
                          handleStatusChange(inquiry.id, value as Inquiry['status']);
                        }}
                      >
                        <SelectTrigger
                          className="w-32 h-8 bg-zinc-800 border-zinc-700 text-xs"
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent 
                          className="bg-zinc-950 border-zinc-800"
                          onPointerDownOutside={(e) => e.stopPropagation()}
                        >
                          {STATUSES.map((status) => (
                            <SelectItem
                              key={status.value}
                              value={status.value}
                              className="text-zinc-400 focus:text-white focus:bg-zinc-900 text-xs"
                            >
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                <p>Звернення відсутні</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Звернення</DialogTitle>
            <DialogDescription className="text-zinc-500">
              {selectedInquiry && formatDistanceToNow(selectedInquiry.createdAt, {
                addSuffix: true,
                locale: uk,
              })}
            </DialogDescription>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-zinc-500">Клієнт</Label>
                <p className="text-white font-medium">{selectedInquiry.customerName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-500">Email</Label>
                  <a
                    href={`mailto:${selectedInquiry.customerEmail}`}
                    className="text-k24-yellow hover:underline flex items-center gap-1"
                  >
                    <Mail className="h-4 w-4" />
                    {selectedInquiry.customerEmail}
                  </a>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-500">Телефон</Label>
                  <a
                    href={`tel:${selectedInquiry.customerPhone}`}
                    className="text-k24-yellow hover:underline flex items-center gap-1"
                  >
                    <Phone className="h-4 w-4" />
                    {selectedInquiry.customerPhone}
                  </a>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-500">Товар</Label>
                <p className="text-white">{selectedInquiry.productName}</p>
              </div>

              {selectedInquiry.proposedPrice != null && selectedInquiry.proposedPrice > 0 && (
                <div className="space-y-2">
                  <Label className="text-zinc-500">Запропонована ціна</Label>
                  <p className="text-emerald-400 font-semibold text-lg">
                    {selectedInquiry.proposedPrice.toLocaleString('uk-UA')} ₴
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-zinc-500">Повідомлення</Label>
                <p className="text-zinc-300 whitespace-pre-wrap bg-zinc-800/50 rounded-lg p-3">
                  {selectedInquiry.message}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-500">Статус</Label>
                <Select
                  value={selectedInquiry.status}
                  onValueChange={(value) =>
                    handleStatusChange(selectedInquiry.id, value as Inquiry['status'])
                  }
                >
                  <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800">
                    {STATUSES.map((status) => (
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
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => selectedInquiry && handleDelete(selectedInquiry.id)}
              className="mr-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Видалити
            </Button>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-zinc-800 text-zinc-400 hover:text-white"
            >
              Закрити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs font-medium ${className}`}>{children}</p>;
}

