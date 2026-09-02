export interface ProductItem {
  id: string;
  name: string;
  category: 'milho' | 'feijao' | 'arroz' | 'horticolas' | 'gergelim' | 'insumos' | 'agroquimicos' | 'equipamentos';
  subCategory?: string;
  categoryLabel: string;
  tagline: string;
  description: string;
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
