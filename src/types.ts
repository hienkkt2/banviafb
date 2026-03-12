export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  warranty: string;
  category: 'Via' | 'BM' | 'Clone';
}

export interface WarrantyPolicy {
  id: number;
  title: string;
  content: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface AppSettings {
  zaloPhone: string;
  bankAccount: string;
  bankName: string;
  adminPassword?: string;
}
