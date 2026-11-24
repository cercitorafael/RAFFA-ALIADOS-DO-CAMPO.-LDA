export interface ProductItem {
  id: string;
  name: string;
  category: 'milho' | 'feijao' | 'arroz' | 'horticolas' | 'gergelim' | 'insumos' | 'agroquimicos' | 'equipamentos';
  subCategory?: string;
  categoryLabel: string;
  tagline: string;
  description: string;
  priceMzn?: number;
  priceUnit?: string;
  stockStatus?: 'available' | 'low' | 'out_of_stock';
  varieties?: string[];
  specs?: {
    cycleDays?: string;
    seedRatePerHa?: string;
    recommendedSpacing?: string;
    potentialYield?: string;
    packaging?: string;
  };
  image: string;
  badge?: string;
  popular?: boolean;
  isUserCreated?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface CartItem {
  productId: string;
  name: string;
  categoryLabel: string;
  priceMzn?: number;
  priceUnit?: string;
  quantity: number;
  image: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  category: string;
  description: string;
  iconName: string;
  benefits: string[];
  image: string;
}

export interface CalculationResult {
  cropName: string;
  areaHa: number;
  seedRequiredKg: number;
  seedBagsApprox: string;
  recommendedSpacing: string;
  basalFertilizerKg: number;
  topDressingKg: number;
  keyAdvice: string;
}

export interface QuoteFormData {
  name: string;
  phone: string;
  location: string;
  selectedCategory: string;
  selectedProduct: string;
  areaOrQuantity: string;
  notes: string;
}

export interface QuoteRecord extends QuoteFormData {
  id: string;
  status?: 'pending' | 'contacted' | 'resolved';
  totalMzn?: number;
  source?: 'quote_modal' | 'cart_order';
  createdAt: number;
  updatedAt?: number;
}

export interface ContactMessageRecord {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
  status?: 'pending' | 'resolved';
  createdAt: number;
  updatedAt?: number;
}

export interface FeaturedInfoItem {
  id: string;
  title: string;
  category: 'comunicado' | 'campanha' | 'sementes' | 'alerta' | 'preco' | 'geral';
  categoryLabel: string;
  badgeText?: string;
  summary: string;
  details?: string;
  highlightStyle: 'emerald' | 'amber' | 'blue' | 'red';
  actionText?: string;
  actionType?: 'whatsapp' | 'quote' | 'link' | 'none';
  actionUrlOrMessage?: string;
  imageUrl?: string;
  isActive: boolean; // Se sai no destaque
  priorityOrder?: number;
  dateText?: string;
  createdAt: number;
  updatedAt?: number;
}
