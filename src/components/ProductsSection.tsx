import React, { useState } from 'react';
import { 
  Sprout, 
  Search, 
  ArrowRight, 
  Tag, 
  Check, 
  Sparkles, 
  Info,
  Filter,
  Plus,
  Settings2
} from 'lucide-react';
import { ProductItem } from '../types';
import { ProductDetailModal } from './ProductDetailModal';

interface ProductsSectionProps {
  products: ProductItem[];
  onOpenQuote: (productName?: string) => void;
  onOpenAdminCatalog: () => void;
  onAddNewProduct: () => void;
  onEditProduct: (product: ProductItem) => void;
}

export const ProductsSection: React.FC<ProductsSectionProps> = ({ 
  products,
  onOpenQuote,
  onOpenAdminCatalog,
  onAddNewProduct,
  onEditProduct
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [showAdminQuickActions, setShowAdminQuickActions] = useState<boolean>(true);

  const featuredCount = products.filter(p => !!p.popular).length;

  const categories = [
    { id: 'todos', label: 'Todos os Produtos', count: products.length },
    { id: 'destaques', label: '⭐ Em Destaque', count: featuredCount },
    { id: 'horticolas', label: 'Hortícolas', count: products.filter(p => p.category === 'horticolas').length },
    { id: 'milho', label: 'Milho', count: products.filter(p => p.category === 'milho').length },
    { id: 'feijao', label: 'Feijões', count: products.filter(p => p.category === 'feijao').length },
    { id: 'arroz', label: 'Arroz', count: products.filter(p => p.category === 'arroz').length },
    { id: 'gergelim', label: 'Gergelim & Outras', count: products.filter(p => p.category === 'gergelim').length },
    { id: 'insumos', label: 'Fertilizantes', count: products.filter(p => p.category === 'insumos').length },
    { id: 'agroquimicos', label: 'Agroquímicos & Defensivos', count: products.filter(p => p.category === 'agroquimicos').length },
    { id: 'equipamentos', label: 'Instrumentos & Equipamentos', count: products.filter(p => p.category === 'equipamentos').length },
  ];

  const horticolasSubCategories = [
    { id: 'todas', label: 'Todas as Hortícolas' },
    { id: 'folhosas', label: '🥬 Folhosas & Couves' },
    { id: 'frutos', label: '🍅 Tomates, Pimentos & Frutos' },
    { id: 'raizes', label: '🧅 Raízes & Bulbos' },
    { id: 'cucurbitaceas', label: '🍉 Melancias & Abóboras' },
  ];

  const agroquimicosSubCategories = [
    { id: 'todas', label: 'Todos os Agroquímicos' },
    { id: 'insecticidas', label: '🐛 Insecticidas (Lagarta do Cartucho)' },
    { id: 'fungicidas', label: '🍄 Fungicidas (Míldio & Manchas)' },
    { id: 'herbicidas', label: '🌿 Herbicidas (Limpeza da Machamba)' },
    { id: 'conservacao', label: '🌾 Tratamento de Sementes & Celeiro' },
  ];

  const equipamentosSubCategories = [
    { id: 'todas', label: 'Todos os Equipamentos' },
    { id: 'pulverizadores', label: '🎒 Pulverizadores Costais' },
    { id: 'semeadores', label: '🌱 Semeadores Manuais (Matracas)' },
    { id: 'ferramentas', label: '⛏️ Ferramentas Manuais' },
    { id: 'rega', label: '💧 Rega & Aspersão' },
  ];

  const filteredProducts = products.filter((item) => {
    const matchesCategory = 
      activeCategory === 'todos' || 
      (activeCategory === 'destaques' ? Boolean(item.popular) : item.category === activeCategory);
    const matchesSubCategory = 
      (activeCategory !== 'horticolas' && activeCategory !== 'agroquimicos' && activeCategory !== 'equipamentos') || 
      activeSubCategory === 'todas' || 
      item.subCategory === activeSubCategory;

    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.varieties && item.varieties.some(v => v.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (item.badge && item.badge.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSubCategory && matchesSearch;
  });

  return (
    <section id="produtos" className="py-16 sm:py-24 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              Catálogo de Sementes, Agroquímicos & Equipamentos
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-['Outfit'] tracking-tight">
              Nossas Sementes & Produtos
            </h2>
            <p className="text-stone-600 text-base sm:text-lg mt-2 max-w-2xl">
              Sementes vigorosas de alta germinação, defensivos agrícolas certificados e equipamentos resistentes para maximizar o rendimento da sua lavoura em Ribaué.
            </p>
          </div>

          {/* Search Input */}
          <div className="w-full md:w-72 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="product-search-input"
              type="text"
              placeholder="Pesquisar semente ou variedade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all text-stone-900"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`filter-tab-${cat.id}`}
              onClick={() => {
                setActiveCategory(cat.id);
                setActiveSubCategory('todas');
              }}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                activeCategory === cat.id
                  ? 'bg-emerald-800 text-white shadow-md shadow-emerald-900/20'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-900'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeCategory === cat.id 
                  ? 'bg-emerald-700/90 text-emerald-100' 
                  : 'bg-stone-200 text-stone-600'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Hortícolas Subcategory Sub-Tabs */}
        {activeCategory === 'horticolas' && (
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 sm:p-4 mb-8 animate-in fade-in duration-200">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-700" />
                Filtrar Variedades de Hortícolas:
              </span>
              <span className="text-[11px] text-emerald-700 font-medium hidden sm:inline">
                Sementes adaptadas a solos de Namiconha & Ribaué
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {horticolasSubCategories.map((sub) => (
                <button
                  key={sub.id}
                  id={`subfilter-tab-${sub.id}`}
                  onClick={() => setActiveSubCategory(sub.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    activeSubCategory === sub.id
                      ? 'bg-emerald-700 text-white shadow-sm font-bold'
                      : 'bg-white text-emerald-950 hover:bg-emerald-100 border border-emerald-200/60'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Agroquímicos Subcategory Sub-Tabs */}
        {activeCategory === 'agroquimicos' && (
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 sm:p-4 mb-8 animate-in fade-in duration-200">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-700" />
                Filtrar Agroquímicos & Defensivos:
              </span>
              <span className="text-[11px] text-emerald-700 font-medium hidden sm:inline">
                Soluções registradas para controlo fitossanitário em Ribaué
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {agroquimicosSubCategories.map((sub) => (
                <button
                  key={sub.id}
                  id={`subfilter-agroquimicos-tab-${sub.id}`}
                  onClick={() => setActiveSubCategory(sub.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    activeSubCategory === sub.id
                      ? 'bg-emerald-700 text-white shadow-sm font-bold'
                      : 'bg-white text-emerald-950 hover:bg-emerald-100 border border-emerald-200/60'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Equipamentos Subcategory Sub-Tabs */}
        {activeCategory === 'equipamentos' && (
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 sm:p-4 mb-8 animate-in fade-in duration-200">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-700" />
                Filtrar Instrumentos & Equipamentos:
              </span>
              <span className="text-[11px] text-emerald-700 font-medium hidden sm:inline">
                Equipamentos ergonómicos e resistentes para machamba
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {equipamentosSubCategories.map((sub) => (
                <button
                  key={sub.id}
                  id={`subfilter-equipamentos-tab-${sub.id}`}
                  onClick={() => setActiveSubCategory(sub.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    activeSubCategory === sub.id
                      ? 'bg-emerald-700 text-white shadow-sm font-bold'
                      : 'bg-white text-emerald-950 hover:bg-emerald-100 border border-emerald-200/60'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                id={`product-card-${product.id}`}
                className={`bg-white rounded-3xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative ${
                  product.popular 
                    ? 'border-amber-400/90 ring-2 ring-amber-400/30 hover:border-amber-500' 
                    : 'border-stone-200/90 hover:border-emerald-500/40'
                }`}
              >
                <div>
                  {/* Image Container */}
                  <div className="relative h-56 sm:h-60 overflow-hidden bg-stone-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    
                    {/* Floating Badges with clean shadow */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-emerald-950 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-sm border border-emerald-900/10">
                          {product.categoryLabel}
                        </span>
                        {product.popular && (
                          <span className="bg-amber-400 text-stone-950 text-[10px] font-black uppercase px-2 py-1 rounded-lg shadow-md border border-amber-500/30 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 fill-current" />
                            Em Destaque
                          </span>
                        )}
                      </div>
                      {product.badge && (
                        <span className="bg-emerald-800 text-white text-[11px] font-black uppercase px-2.5 py-1 rounded-lg shadow-sm border border-emerald-900/20">
                          {product.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-stone-900 font-['Outfit'] mb-1.5 group-hover:text-emerald-800 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-emerald-700 text-xs font-semibold mb-3">
                      {product.tagline}
                    </p>
                    <p className="text-stone-600 text-sm leading-relaxed line-clamp-3 mb-4">
                      {product.description}
                    </p>

                    {/* Varieties preview pills */}
                    {product.varieties && (
                      <div className="mb-3">
                        <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-stone-400" />
                          Variedades / Cultivares:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {product.varieties.slice(0, 3).map((v, i) => (
                            <span key={i} className="text-xs bg-stone-100 text-stone-800 font-medium px-2 py-0.5 rounded-md border border-stone-200">
                              {v}
                            </span>
                          ))}
                          {product.varieties.length > 3 && (
                            <span className="text-xs text-stone-500 font-semibold px-1 py-0.5">
                              +{product.varieties.length - 3} mais
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quick Specs bar */}
                    {product.specs && (
                      <div className="pt-2.5 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs text-stone-600 mb-2">
                        {product.specs.cycleDays && (
                          <div className="bg-stone-50 p-2 rounded-lg border border-stone-200/60">
                            <span className="block text-[10px] uppercase font-bold text-stone-400">Ciclo</span>
                            <span className="font-semibold text-stone-800 text-[11px] truncate block">{product.specs.cycleDays.split('(')[0]}</span>
                          </div>
                        )}
                        {product.specs.packaging && (
                          <div className="bg-stone-50 p-2 rounded-lg border border-stone-200/60">
                            <span className="block text-[10px] uppercase font-bold text-stone-400">Embalagem</span>
                            <span className="font-semibold text-stone-800 text-[11px] truncate block">{product.specs.packaging.split(' de ')[1] ? `Latas/Pacotes ${product.specs.packaging.split(' de ')[1]}` : product.specs.packaging}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-6 pt-0 flex items-center gap-2 border-t border-stone-100 mt-2">
                  <button
                    id={`view-details-${product.id}`}
                    onClick={() => setSelectedProduct(product)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Info className="w-3.5 h-3.5 text-stone-500" />
                    <span>Ver Ficha Técnica</span>
                  </button>

                  <button
                    id={`btn-quote-product-${product.id}`}
                    onClick={() => onOpenQuote(product.name)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    <span>Pedir Cotação</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-stone-50 rounded-2xl border border-stone-200">
            <Sprout className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-stone-700">
              {products.length === 0 ? 'Catálogo Vazio (Sem Produtos)' : 'Nenhum produto encontrado'}
            </h4>
            <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto">
              {products.length === 0 
                ? 'Todas as sementes foram eliminadas na totalidade. Pode adicionar uma nova semente ou restaurar as sementes através do painel de administração.'
                : 'Tente pesquisar por outro termo ou selecione outra categoria.'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              {products.length > 0 && (
                <button
                  onClick={() => { setActiveCategory('todos'); setSearchQuery(''); }}
                  className="text-xs font-semibold text-stone-700 hover:underline px-3 py-2"
                >
                  Limpar filtros
                </button>
              )}
              <button
                onClick={onAddNewProduct}
                className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Cadastrar Semente
              </button>
              <button
                onClick={onOpenAdminCatalog}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm"
              >
                <Settings2 className="w-3.5 h-3.5 text-stone-600" />
                Gerir Catálogo
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onOpenQuote={onOpenQuote}
        />
      )}
    </section>
  );
};
