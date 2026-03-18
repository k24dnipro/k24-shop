import 'server-only';

import { getUsdToUahRate } from '@/lib/currency/nbu.server';
import { formatUAH } from '@/lib/currency/format';
import type { InquiryData, OrderData } from '@/lib/services/telegram';

function formatUsd(usd: number): string {
  if (!Number.isFinite(usd)) return '0.00';
  // Use dot as decimal separator for clarity in Telegram.
  return usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Нормалізує номер для tel: посилання. */
function telUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('0')) {
    return `+38${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('38')) {
    return `+${digits}`;
  }
  return digits ? `+${digits}` : phone;
}

/**
 * Format order data into a readable Telegram message.
 * Вхідні суми вважаємо USD і конвертуємо в UAH по курсу НБУ.
 */
export async function formatOrderMessage(order: OrderData): Promise<string> {
  const { customerInfo, items, totalPrice, totalItems } = order;

  const { rate: usdToUahRate } = await getUsdToUahRate();

  let message = `🛒 *Нове замовлення*\n\n`;

  // Customer info
  message += `👤 *Клієнт:*\n`;
  message += `Ім'я: ${customerInfo.name}\n`;
  message += `Телефон: [${customerInfo.phone}](tel:${telUrl(customerInfo.phone)})\n`;
  if (customerInfo.email) {
    message += `Email: ${customerInfo.email}\n`;
  }
  if (customerInfo.comment) {
    message += `Коментар: ${customerInfo.comment}\n`;
  }

  message += `\n📦 *Товари:* (${totalItems} шт.)\n`;
  message += `\`\`\`\n`;

  items.forEach((item, index) => {
    const { product, quantity } = item;
    const itemTotalUsd = product.price * quantity;

    message += `${index + 1}. ${product.name}\n`;
    if (product.partNumber) {
      message += `   Артикул: ${product.partNumber}\n`;
    }
    if (product.brand) {
      message += `   Бренд: ${product.brand}\n`;
    }

    message += `   Ціна: ${formatUAH(product.price * usdToUahRate)} (${formatUsd(product.price)} USD)\n`;
    if (product.originalPrice != null) {
      message += `   Стара ціна: ${formatUAH(product.originalPrice * usdToUahRate)} (${formatUsd(product.originalPrice)} USD)\n`;
    }

    message += `   Кількість: ${quantity}\n`;
    message += `   Сума: ${formatUAH(itemTotalUsd * usdToUahRate)} (${formatUsd(itemTotalUsd)} USD)\n`;

    if (index < items.length - 1) {
      message += `\n`;
    }
  });

  message += `\`\`\`\n`;
  message += `💰 *Загальна сума: ${formatUAH(totalPrice * usdToUahRate)} (${formatUsd(totalPrice)} USD)*\n`;

  return message;
}

/**
 * Format inquiry data into a readable Telegram message.
 * Вхідні суми вважаємо USD і конвертуємо в UAH по курсу НБУ.
 */
export async function formatInquiryMessage(inquiry: InquiryData): Promise<string> {
  const isPriceProposal = inquiry.proposedPrice != null && inquiry.proposedPrice > 0;
  const usdToUahRate = isPriceProposal ? (await getUsdToUahRate()).rate : 0;

  let message = isPriceProposal
    ? `💰 *Запропонована ціна*\n\n`
    : `📧 *Новий запит про товар*\n\n`;

  // Product info
  message += `📦 *Товар:*\n`;
  message += `${inquiry.productName}\n`;

  const productCode = inquiry.productPartNumber;
  if (productCode) {
    message += `Код товару: ${productCode}\n`;
  }

  if (inquiry.productStatus) {
    const statusLabels: Record<string, string> = {
      in_stock: 'В наявності',
      out_of_stock: 'Немає в наявності',
      on_order: 'Під замовлення',
      discontinued: 'Знято з виробництва',
    };
    const statusLabel = statusLabels[inquiry.productStatus] || inquiry.productStatus;
    message += `Статус: ${statusLabel}\n`;
  }

  if (isPriceProposal) {
    message += `\n💵 *Запропонована ціна: ${formatUAH(inquiry.proposedPrice! * usdToUahRate)} (${formatUsd(inquiry.proposedPrice!)} USD)*\n`;
  }
  message += `\n`;

  // Customer info
  message += `👤 *Клієнт:*\n`;
  message += `Ім'я: ${inquiry.customerName}\n`;
  message += `Телефон: [${inquiry.customerPhone}](tel:${telUrl(inquiry.customerPhone)})\n`;
  message += `Email: ${inquiry.customerEmail}\n\n`;

  // Message
  if (inquiry.message) {
    message += `💬 *Повідомлення:*\n`;
    message += `${inquiry.message}\n`;
  }

  return message;
}

