import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  AlertCircle,
  Link as LinkIcon
} from 'lucide-react';
import { ProductItem } from '../types';
import { optimizeImage } from '../utils/imageOptimizer';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<ProductItem, 'id'> & { id?: string }) => void | Promise<void>;
  initialProduct?: ProductItem | null;
}

const CATEGORY_OPTIONS = [
  { value: 'horticolas', label: 'Hortícolas (Tomate, Couves, Cebola, etc.)' },
  { value: 'milho', label: 'Milho (Pan 53, Matuba, Híbridos)' },
  { value: 'feijao', label: 'Feijões (Nhemba, Manteiga, Bóer, Boer)' },
  { value: 'arroz', label: 'Arroz (Chupa, Limpopo, ITA 312)' },
  { value: 'gergelim', label: 'Gergelim & Oleaginosas (Lindi White)' },
  { value: 'insumos', label: 'Fertilizantes & Insumos (NPK, Ureia)' },
  { value: 'agroquimicos', label: 'Agroquímicos & Defensivos (Insecticidas, Fungicidas, Herbicidas)' },
  { value: 'equipamentos', label: 'Instrumentos & Equipamentos Agrícolas (Pulverizadores, Semeadores, Ferramentas)' },
];

const SUBCATEGORY_OPTIONS: Record<string, { value: string; label: string }[]> = {
  horticolas: [
    { value: 'folhosas', label: '🥬 Folhosas & Couves (Acelga, Tronchuda, Manteiga, Lombarda, Repolho, Pak Choi)' },
    { value: 'frutos', label: '🍅 Tomates, Pimentos, Beringela, Quiabo & Malaguetas' },
    { value: 'raizes', label: '🧅 Raízes & Bulbos (Cebola Roxa/Amarela, Beterraba, Nabo)' },
    { value: 'cucurbitaceas', label: '🍉 Melancias & Abóboras (Crimson, Sugar Baby, Moranga)' },
  ],
  agroquimicos: [
    { value: 'insecticidas', label: '🐛 Insecticidas (Lagarta-do-cartucho, Afídeos, Mosca-branca)' },
    { value: 'fungicidas', label: '🍄 Fungicidas (Míldio, Oídio, Mancha-de-ferrugem)' },
    { value: 'herbicidas', label: '🌿 Herbicidas (Glifosato, Atrazina, Limpeza de campo)' },
    { value: 'conservacao', label: '🌾 Tratamento de Sementes & Conservação de Grão' },
  ],
  equipamentos: [
    { value: 'pulverizadores', label: '🎒 Pulverizadores Costais (Manuais 16L/20L e Elétricos a Bateria)' },
    { value: 'semeadores', label: '🌱 Semeadores Manuais de Precisão (Matracas)' },
    { value: 'ferramentas', label: '⛏️ Ferramentas Manuais (Enxadas, Catanas, Ancinhos, Pás)' },
    { value: 'rega', label: '💧 Equipamentos de Rega (Gota a Gota e Aspersores)' },
  ],
};

const SAMPLE_AGRO_IMAGES = [
  { label: 'Tomate', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80' },
  { label: 'Repolho/Couve', url: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=800&q=80' },
  { label: 'Cebola Roxa', url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80' },
  { label: 'Milho', url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80' },
  { label: 'Feijão', url: 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?auto=format&fit=crop&w=800&q=80' },
  { label: 'Melancia', url: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=800&q=80' },
  { label: 'Agroquímicos', url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22500?auto=format&fit=crop&w=800&q=80' },
  { label: 'Pulverizador/Equipamento', url: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=800&q=80' },
  { label: 'Fertilizante', url: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=800&q=80' },
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProduct,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductItem['category']>('horticolas');
  const [subCategory, setSubCategory] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [badge, setBadge] = useState('');
  const [popular, setPopular] = useState(false);
  
  // Specs
  const [cycleDays, setCycleDays] = useState('');
  const [seedRatePerHa, setSeedRatePerHa] = useState('');
  const [recommendedSpacing, setRecommendedSpacing] = useState('');
  const [potentialYield, setPotentialYield] = useState('');
  const [packaging, setPackaging] = useState('');

  // Varieties list
  const [varieties, setVarieties] = useState<string[]>([]);
  const [newVarietyInput, setNewVarietyInput] = useState('');

  // Image tab: 'upload' | 'url' | 'presets'
  const [imageMode, setImageMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [imageError, setImageError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!initialProduct;

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name || '');
      setCategory(initialProduct.category || 'horticolas');
      setSubCategory(initialProduct.subCategory || '');
      setTagline(initialProduct.tagline || '');
      setDescription(initialProduct.description || '');
      setImage(initialProduct.image || '');
      setBadge(initialProduct.badge || '');
      setPopular(!!initialProduct.popular);
      setVarieties(initialProduct.varieties || []);
      setCycleDays(initialProduct.specs?.cycleDays || '');
      setSeedRatePerHa(initialProduct.specs?.seedRatePerHa || '');
      setRecommendedSpacing(initialProduct.specs?.recommendedSpacing || '');
      setPotentialYield(initialProduct.specs?.potentialYield || '');
      setPackaging(initialProduct.specs?.packaging || '');
    } else {
      // Defaults for new product
      setName('');
      setCategory('horticolas');
      setSubCategory('folhosas');
      setTagline('');
      setDescription('');
      setImage('https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=800&q=80');
      setBadge('Certificado');
      setPopular(false);
      setVarieties(['Variedade Selecionada']);
      setCycleDays('70 - 90 dias');
      setSeedRatePerHa('200g a 300g / ha');
      setRecommendedSpacing('60 cm × 40 cm');
      setPotentialYield('25 a 45 Toneladas / ha');
      setPackaging('Envelopes e latas herméticas');
    }
  }, [initialProduct, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Por favor seleccione um ficheiro de imagem válido (JPG, PNG, WEBP).');
      return;
    }

    setImageError('');
    try {
      // Automatically optimize and resize image to prevent storage quota limits
      const optimizedBase64 = await optimizeImage(file, 1200, 1200, 0.85);
      setImage(optimizedBase64);
    } catch (err) {
      console.warn('Erro ao optimizar imagem, a usar leitura directa:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddVariety = () => {
    if (newVarietyInput.trim() && !varieties.includes(newVarietyInput.trim())) {
      setVarieties([...varieties, newVarietyInput.trim()]);
      setNewVarietyInput('');
    }
  };

  const handleRemoveVariety = (indexToRemove: number) => {
    setVarieties(varieties.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor preencha o nome do produto / semente.');
      return;
    }

    const categoryObj = CATEGORY_OPTIONS.find((c) => c.value === category);
    const categoryLabel = categoryObj ? categoryObj.label.split(' (')[0] : 'Sementes';

    const productPayload: Omit<ProductItem, 'id'> & { id?: string } = {
      ...(initialProduct?.id ? { id: initialProduct.id } : {}),
      name: name.trim(),
      category,
      subCategory: subCategory || undefined,
      categoryLabel,
      tagline: tagline.trim() || 'Sementes de alto rendimento para solos de Nampula',
      description: description.trim() || 'Semente de qualidade com excelente taxa de germinação.',
      image: image || 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=800&q=80',
      badge: badge.trim() || undefined,
      popular,
      varieties: varieties.length > 0 ? varieties : undefined,
      specs: {
        cycleDays: cycleDays.trim() || undefined,
        seedRatePerHa: seedRatePerHa.trim() || undefined,
        recommendedSpacing: recommendedSpacing.trim() || undefined,
        potentialYield: potentialYield.trim() || undefined,
        packaging: packaging.trim() || undefined,
      },
    };

    setIsSaving(true);
    try {
      await onSave(productPayload);
      setIsSaving(false);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-auto z-10 overflow-hidden border border-stone-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-emerald-100 font-bold">
              {isEditing ? '✏️' : '🌱'}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-['Outfit']">
                {isEditing ? `Editar Semente / Produto: ${initialProduct?.name}` : 'Cadastrar Nova Semente / Insumo'}
              </h2>
              <p className="text-xs text-emerald-300">
                Personalize o nome, fotos, ciclo, variedades e especificações técnicas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-stone-800">
          
          {/* Section 1: Informações Principais */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2 border-b border-emerald-100 pb-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              1. Identificação da Semente / Produto
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                  Nome Completo da Semente / Produto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tomate Saladete Roma VF / Milho Pan 53"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const newCat = e.target.value as ProductItem['category'];
                    setCategory(newCat);
                    if (newCat === 'horticolas') {
                      setSubCategory('folhosas');
                    } else {
                      setSubCategory('');
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-sm font-medium bg-white"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {category === 'horticolas' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                    Subcategoria Hortícola
                  </label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-sm font-medium bg-white"
                  >
                    {SUBCATEGORY_OPTIONS.horticolas.map((sub) => (
                      <option key={sub.value} value={sub.value}>
                        {sub.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                  Selo de Destaque (Badge)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Certificado, Livre de OGM, Campeão de Vendas"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-sm"
                />
              </div>

              <div className="md:col-span-2 bg-amber-50/80 border-2 border-amber-300/80 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 font-bold mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-stone-900 block">
                      ⭐ Colocar este Produto e Informações em Destaque
                    </span>
                    <span className="text-[11px] text-stone-600 block mt-0.5">
                      Ao ativar, este produto ganha selo especial e aparece imediatamente na aba e secção "Em Destaque" no catálogo do site.
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={popular}
                    onChange={(e) => setPopular(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                  Subtítulo / Frase Curta (Tagline)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Frutos carnosos e firmes de alta resistência ao transporte"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                  Descrição Completa & Recomendações
                </label>
                <textarea
                  rows={3}
                  placeholder="Explique o comportamento da cultura, vigor germinativo, adaptação aos solos de Ribaué/Nampula..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Gestão da Fotografia do Produto */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2 border-b border-emerald-100 pb-2">
              <ImageIcon className="w-4 h-4 text-emerald-700" />
              2. Foto do Produto (Natural & Direta)
            </h3>

            {/* Photo Modes Tab */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  imageMode === 'upload' 
                    ? 'bg-emerald-800 text-white shadow-sm' 
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Carregar Foto do Telemóvel/Computador
              </button>
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  imageMode === 'url' 
                    ? 'bg-emerald-800 text-white shadow-sm' 
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Colar Link da Foto (URL)
              </button>
              <button
                type="button"
                onClick={() => setImageMode('presets')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  imageMode === 'presets' 
                    ? 'bg-emerald-800 text-white shadow-sm' 
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Galeria Agro Sugerida
              </button>
            </div>

            {/* Image Preview & Upload Control */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div className="sm:col-span-1">
                <div className="text-xs font-bold text-stone-600 mb-1.5">Pré-visualização da Foto:</div>
                <div className="h-36 w-full rounded-xl overflow-hidden bg-stone-200 border border-stone-300 relative group">
                  {image ? (
                    <img 
                      src={image} 
                      alt="Prévia da semente" 
                      className="w-full h-full object-cover"
                      onError={() => setImageError('Não foi possível carregar a imagem deste link.')}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 text-xs">
                      <ImageIcon className="w-8 h-8 mb-1" />
                      Sem foto
                    </div>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2 space-y-3">
                {imageMode === 'upload' && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-emerald-400 hover:border-emerald-600 bg-white hover:bg-emerald-50/50 p-4 rounded-xl cursor-pointer text-center transition-all"
                    >
                      <Upload className="w-6 h-6 text-emerald-700 mx-auto mb-1.5" />
                      <div className="text-xs font-bold text-emerald-950">
                        Clique aqui para escolher a foto no seu dispositivo
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        Formatos suportados: JPG, PNG, WEBP (Máx. 5MB)
                      </div>
                    </div>
                  </div>
                )}

                {imageMode === 'url' && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Link / URL da Imagem na Web
                    </label>
                    <input
                      type="url"
                      placeholder="https://exemplo.com/foto-semente.jpg"
                      value={image}
                      onChange={(e) => {
                        setImage(e.target.value);
                        setImageError('');
                      }}
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-xs font-mono"
                    />
                  </div>
                )}

                {imageMode === 'presets' && (
                  <div>
                    <div className="text-xs font-bold text-stone-700 mb-2">
                      Escolha uma foto da galeria padrão:
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {SAMPLE_AGRO_IMAGES.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setImage(preset.url);
                            setImageError('');
                          }}
                          className="text-left group relative rounded-lg overflow-hidden border border-stone-200 hover:border-emerald-600 transition-all p-1 bg-white"
                        >
                          <img 
                            src={preset.url} 
                            alt={preset.label}
                            className="w-full h-12 object-cover rounded" 
                          />
                          <span className="block text-[10px] font-bold text-stone-700 truncate mt-1 text-center">
                            {preset.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {imageError && (
                  <div className="text-xs text-red-600 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {imageError}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Variedades e Cultivares */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2 border-b border-emerald-100 pb-2">
              <Plus className="w-4 h-4 text-emerald-700" />
              3. Variedades & Cultivares Relacionadas
            </h3>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome da variedade (Ex: Gloria F1 / Copenhagen / Rio Grande)"
                value={newVarietyInput}
                onChange={(e) => setNewVarietyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddVariety();
                  }
                }}
                className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-xs font-medium"
              />
              <button
                type="button"
                onClick={handleAddVariety}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            </div>

            {/* Varieties Tags */}
            <div className="flex flex-wrap gap-2 pt-1">
              {varieties.map((v, index) => (
                <span
                  key={index}
                  className="bg-emerald-100 text-emerald-900 text-xs font-semibold px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center gap-1.5"
                >
                  {v}
                  <button
                    type="button"
                    onClick={() => handleRemoveVariety(index)}
                    className="hover:text-red-700 transition-colors ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {varieties.length === 0 && (
                <span className="text-xs text-stone-400 italic">
                  Nenhuma variedade listada. Adicione as variedades acima.
                </span>
              )}
            </div>
          </div>

          {/* Section 4: Ficha Técnica Agronómica */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2 border-b border-emerald-100 pb-2">
              <Check className="w-4 h-4 text-emerald-700" />
              4. Ficha Técnica Agronómica
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                  Ciclo da Cultura
                </label>
                <input
                  type="text"
                  placeholder="Ex: 75 - 90 dias"
                  value={cycleDays}
                  onChange={(e) => setCycleDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                  Densidade / Semente por Ha
                </label>
                <input
                  type="text"
                  placeholder="Ex: 200g a 300g / ha"
                  value={seedRatePerHa}
                  onChange={(e) => setSeedRatePerHa(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                  Compasso Recomendado
                </label>
                <input
                  type="text"
                  placeholder="Ex: 80 cm × 40 cm"
                  value={recommendedSpacing}
                  onChange={(e) => setRecommendedSpacing(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                  Potencial Produtivo
                </label>
                <input
                  type="text"
                  placeholder="Ex: 40 a 65 Toneladas / ha"
                  value={potentialYield}
                  onChange={(e) => setPotentialYield(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                  Embalagens / Apresentação
                </label>
                <input
                  type="text"
                  placeholder="Ex: Latas herméticas de 50g, 100g e 500g"
                  value={packaging}
                  onChange={(e) => setPackaging(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-75 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  A Guardar...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {isEditing ? 'Salvar Alterações' : 'Cadastrar Semente'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
