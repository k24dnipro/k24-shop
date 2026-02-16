/**
 * Telegram Bot API service
 * Sends order notifications to Telegram
 */

export interface OrderData {
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
    comment?: string;
  };
  items: Array<{
    product: {
      id: string;
      name: string;
      partNumber?: string;
      price: number;
      originalPrice?: number | null;
      brand?: string;
    };
    quantity: number;
  }>;
  totalPrice: number;
  totalItems: number;
}

/**
 * Format order data into a readable Telegram message
 */
export function formatOrderMessage(order: OrderData): string {
  const { customerInfo, items, totalPrice, totalItems } = order;

  let message = `🛒 *Нове замовлення*\n\n`;
  
  // Customer info
  message += `👤 *Клієнт:*\n`;
  message += `Ім'я: ${customerInfo.name}\n`;
  message += `Телефон: ${customerInfo.phone}\n`;
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
    const itemTotal = product.price * quantity;
    message += `${index + 1}. ${product.name}\n`;
    if (product.partNumber) {
      message += `   Артикул: ${product.partNumber}\n`;
    }
    if (product.brand) {
      message += `   Бренд: ${product.brand}\n`;
    }
    message += `   Ціна: ${product.price.toLocaleString('uk-UA')} ₴\n`;
    if (product.originalPrice) {
      message += `   Стара ціна: ${product.originalPrice.toLocaleString('uk-UA')} ₴\n`;
    }
    message += `   Кількість: ${quantity}\n`;
    message += `   Сума: ${itemTotal.toLocaleString('uk-UA')} ₴\n`;
    if (index < items.length - 1) {
      message += `\n`;
    }
  });
  
  message += `\`\`\`\n`;
  message += `💰 *Загальна сума: ${totalPrice.toLocaleString('uk-UA')} ₴*\n`;
  
  return message;
}

/**
 * Send order notification to Telegram
 */
export async function sendTelegramOrder(order: OrderData): Promise<boolean> {
  try {
    const response = await fetch('/api/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'order', data: order }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Telegram API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return false;
  }
}

export interface InquiryData {
  productId: string;
  productName: string;
  productPartNumber?: string;
  productStatus?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  message: string;
  /** Запропонована клієнтом ціна */
  proposedPrice?: number;
}

/**
 * Format inquiry data into a readable Telegram message
 */
export function formatInquiryMessage(inquiry: InquiryData): string {
  const isPriceProposal = inquiry.proposedPrice != null && inquiry.proposedPrice > 0;
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
    message += `\n💵 *Запропонована ціна: ${Number(inquiry.proposedPrice).toLocaleString('uk-UA')} ₴*\n`;
  }
  message += `\n`;

  // Customer info
  message += `👤 *Клієнт:*\n`;
  message += `Ім'я: ${inquiry.customerName}\n`;
  message += `Телефон: ${inquiry.customerPhone}\n`;
  message += `Email: ${inquiry.customerEmail}\n\n`;

  // Message
  if (inquiry.message) {
    message += `💬 *Повідомлення:*\n`;
    message += `${inquiry.message}\n`;
  }

  return message;
}

/**
 * Send inquiry notification to Telegram
 */
export async function sendTelegramInquiry(inquiry: InquiryData): Promise<boolean> {
  try {
    const response = await fetch('/api/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'inquiry', data: inquiry }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Telegram API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return false;
  }
}
