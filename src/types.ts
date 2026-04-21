export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  recipientName: string;
  trackingNumber: string;
  products: string;
  items?: OrderItem[];
  status: 'pending' | 'shipped';
  createdAt: string;
}
