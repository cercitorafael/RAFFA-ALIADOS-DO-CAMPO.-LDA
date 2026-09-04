import React, { useState, useRef } from 'react';
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  RotateCcw, 
  Download, 
  Upload, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertTriangle,
  Package,
  Layers,
  Sparkles,
  ShieldCheck,
  HardDrive,
  CheckSquare,
  Square,
  Cloud,
  CloudUpload,
  CloudDownload,
  Database,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { ProductItem } from '../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { checkSupabaseConnection, SUPABASE_PROJECT_INFO } from '../lib/supabase';

interface AdminCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  onAddNew: () => void;
  onEdit: (product: ProductItem) => void;
  onDelete: (id: string) => void;
  onDeleteAll?: () => void;
  onDeleteMultiple?: (ids: string[]) => void;
  onDuplicate: (id: string) => void;
  onResetToDefault: (preserveUserCreated?: boolean) => void;
  onImportJSON: (imported: ProductItem[]) => void;
  onExportJSON: () => void;
  onSyncCloud?: () => Promise<{ success: boolean; count: number; error?: string }>;
  onPullCloud?: () => Promise<{ success: boolean; count: number }>;
  onOpenFeaturedInfoManager?: () => void;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAt?: Date | null;
}

export const AdminCatalogModal: React.FC<AdminCatalogModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddNew,
  onEdit,
  onDelete,
  onDeleteAll,
  onDeleteMultiple,
  onDuplicate,
  onResetToDefault,
  onImportJSON,
  onExportJSON,
  onSyncCloud,
  onPullCloud,
  onOpenFeaturedInfoManager,
  syncStatus = 'idle',
  lastSyncedAt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeleteSelectedModalOpen, setIsDeleteSelectedModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Supabase Cloud State
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<{
    connected?: boolean;
    latency?: number;
    message?: string;
  } | null>(null);
  
  const fileImportRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4500);
  };

  const userProductsCount = products.filter(p => p.isUserCreated).length;

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'todos' || 
      (selectedCategory === 'custom' ? p.isUserCreated : p.category === selectedCategory);
    
    const matchesQuery = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          onImportJSON(json);
          showNotification(`Catálogo importado com sucesso! (${json.length} produtos carregados)`);
        } else {
          alert('Ficheiro JSON inválido: esperado um array de produtos.');
        }
      } catch (err) {
        alert('Erro ao processar ficheiro JSON. Verifique a sintaxe.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = (preserveCustom: boolean) => {
    onResetToDefault(preserveCustom);
    setIsResetModalOpen(false);
    setSelectedIds(new Set());
    if (preserveCustom) {
      showNotification('Catálogo padrão restaurado! As suas sementes personalizadas foram preservadas.');
    } else {
      showNotification('Catálogo restaurado para as configurações originais de fábrica.');
    }
  };

  const handleTestSupabase = async () => {
    setIsTestingCloud(true);
    setCloudStatus(null);
    try {
      const res = await checkSupabaseConnection();
      setCloudStatus({
        connected: res.connected,
        latency: res.latencyMs,
        message: res.message,
      });
      showNotification(res.connected 
        ? `Supabase Conectado! Latência: ${res.latencyMs || 0}ms` 
        : `Erro ao ligar ao Supabase: ${res.message}`);
    } catch (e: any) {
      setCloudStatus({
        connected: false,
        message: e?.message || 'Falha de conexão',
      });
      showNotification('Falha de conexão ao Supabase.');
    } finally {
      setIsTestingCloud(false);
    }
  };

  const handleSyncWithCloud = async () => {
    if (!onSyncCloud) return;
    setIsSyncingCloud(true);
    try {
      const res = await onSyncCloud();
      if (res.success) {
        showNotification(`Sincronização concluída com sucesso! ${res.count} produtos guardados na nuvem Supabase.`);
      } else {
        showNotification(`Aviso: ${res.error || 'A nuvem está pronta mas a tabela "products" ainda precisa de ser inicializada no Supabase.'}`);
      }
    } catch (err: any) {
      showNotification(`Falha ao sincronizar: ${err?.message || 'Erro inesperado'}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handlePullFromCloud = async () => {
    if (!onPullCloud) return;
    setIsSyncingCloud(true);
    try {
      const res = await onPullCloud();
      if (res.success && res.count > 0) {
        showNotification(`${res.count} produtos carregados com sucesso a partir da nuvem Supabase!`);
      } else {
        showNotification('Nenhum produto encontrado na nuvem Supabase ou tabela vazia.');
      }
    } catch (err: any) {
      showNotification(`Erro ao carregar da nuvem: ${err?.message || 'Erro inesperado'}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleDeleteConfirmed = (id: string) => {
    const target = products.find(p => p.id === id);
    onDelete(id);
    setProductToDelete(null);
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    showNotification(`Semente "${target?.name || ''}" eliminada na totalidade do sistema.`);
  };

  const handleDeleteAllConfirmed = () => {
    if (onDeleteAll) {
      onDeleteAll();
    } else {
      products.forEach(p => onDelete(p.id));
    }
    setIsDeleteAllModalOpen(false);
    setSelectedIds(new Set());
    showNotification('Todos os produtos foram eliminados do catálogo na totalidade.');
  };

  const handleDeleteSelectedConfirmed = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (onDeleteMultiple) {
      onDeleteMultiple(ids);
    } else {
      ids.forEach(id => onDelete(id));
    }
    setIsDeleteSelectedModalOpen(false);
    setSelectedIds(new Set());
    showNotification(`${ids.length} produto(s) eliminado(s) na totalidade.`);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const categories = [
    { id: 'todos', label: 'Todos', count: products.length },
    ...(userProductsCount > 0 ? [{ id: 'custom', label: '🌱 Minhas Sementes', count: userProductsCount }] : []),
    { id: 'horticolas', label: 'Hortícolas', count: products.filter(p => p.category === 'horticolas').length },
    { id: 'milho', label: 'Milho', count: products.filter(p => p.category === 'milho').length },
    { id: 'feijao', label: 'Feijão', count: products.filter(p => p.category === 'feijao').length },
    { id: 'arroz', label: 'Arroz', count: products.filter(p => p.category === 'arroz').length },
    { id: 'gergelim', label: 'Gergelim & Outras', count: products.filter(p => p.category === 'gergelim').length },
    { id: 'insumos', label: 'Fertilizantes', count: products.filter(p => p.category === 'insumos').length },
    { id: 'agroquimicos', label: 'Agroquímicos', count: products.filter(p => p.category === 'agroquimicos').length },
    { id: 'equipamentos', label: 'Equipamentos', count: products.filter(p => p.category === 'equipamentos').length },
  ];

  return (
    <>
      <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-stone-950/85 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Main Admin Dialog */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full my-auto z-10 overflow-hidden border border-stone-200 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between border-b border-stone-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-950/50">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold font-['Outfit'] tracking-tight">
                    Painel de Gestão do Catálogo (CRUD)
                  </h2>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                    {products.length} Itens no Total
                  </span>
                </div>
                <p className="text-xs text-stone-400">
                  Adicione, edite nomes, troque fotos e elimine produtos na totalidade com persistência garantida
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
                title="Fechar painel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notification Toast */}
          {feedbackMessage && (
            <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-2 shrink-0">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {feedbackMessage}
              </span>
              <button onClick={() => setFeedbackMessage(null)} className="hover:opacity-80">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Selection Banner when items are selected */}
          {selectedIds.size > 0 && (
            <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 flex items-center justify-between gap-3 text-red-900 shrink-0 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold">
                <CheckSquare className="w-4 h-4 text-red-600" />
                <span>{selectedIds.size} semente(s) selecionada(s)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-2.5 py-1 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-red-100/50 rounded-lg transition-colors"
                >
                  Desmarcar
                </button>
                <button
                  onClick={() => setIsDeleteSelectedModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Selecionadas na Totalidade</span>
                </button>
              </div>
            </div>
          )}

          {/* Toolbar & Filters */}
          <div className="bg-stone-50 border-b border-stone-200 p-4 shrink-0 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Primary Action Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onAddNew}
                  className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Nova Semente</span>
                </button>

                {/* Bulk Select All Toggle */}
                {filteredProducts.length > 0 && (
                  <button
                    onClick={toggleSelectAll}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-xl text-xs font-semibold shadow-sm transition-colors"
                    title={selectedIds.size === filteredProducts.length ? 'Desmarcar todas' : 'Selecionar todas'}
                  >
                    {selectedIds.size === filteredProducts.length && filteredProducts.length > 0 ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Desmarcar Todas</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5 text-stone-400" />
                        <span>Selecionar Todas ({filteredProducts.length})</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Utility Actions & Delete All in Totality */}
              <div className="flex flex-wrap items-center gap-2">
                {products.length > 0 && (
                  <button
                    onClick={() => setIsDeleteAllModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-300 text-red-800 rounded-xl text-xs font-bold shadow-sm transition-colors"
                    title="Eliminar todos os produtos do catálogo na totalidade"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Eliminar Todos na Totalidade</span>
                  </button>
                )}

                <button
                  onClick={onExportJSON}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-xl text-xs font-semibold shadow-sm transition-colors"
                  title="Descarregar backup JSON de todas as sementes"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Exportar JSON</span>
                </button>

                <input
                  ref={fileImportRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
                <button
                  onClick={() => fileImportRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-xl text-xs font-semibold shadow-sm transition-colors"
                  title="Carregar ficheiro JSON de catálogo"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Importar JSON</span>
                </button>

                <button
                  onClick={() => setIsResetModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-semibold shadow-sm transition-colors"
                  title="Repor catálogo de sementes"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  <span>Restaurar Originais</span>
                </button>

                {onOpenFeaturedInfoManager && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenFeaturedInfoManager();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-black shadow-sm transition-colors"
                    title="Adicionar ou gerir avisos e comunicados em destaque"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>Gerir Informações em Destaque</span>
                  </button>
                )}
              </div>
            </div>

            {/* Supabase Cloud Sync & Connection Bar */}
            <div className="bg-emerald-950/5 border border-emerald-700/20 rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-700/10 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                  <Database className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-extrabold text-stone-900 flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                      </span>
                      Sincronização Automática com Supabase
                    </span>
                    <span className="font-mono text-[10px] text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200">
                      {SUPABASE_PROJECT_INFO.host}
                    </span>
                    {syncStatus === 'syncing' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        A sincronizar alterações...
                      </span>
                    )}
                    {syncStatus === 'synced' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ 100% Sincronizado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {cloudStatus?.message 
                      ? cloudStatus.message 
                      : (lastSyncedAt 
                          ? `Qualquer produto adicionado, editado ou eliminado sincroniza em tempo real. Última sincronização: ${lastSyncedAt.toLocaleTimeString('pt-PT')}.`
                          : 'Todas as alterações no catálogo são salvas e sincronizadas automaticamente em tempo real.')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleTestSupabase}
                  disabled={isTestingCloud}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
                  title="Testar ping e conectividade com a API Supabase"
                >
                  {isTestingCloud ? (
                    <Loader2 className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                  )}
                  <span>{isTestingCloud ? 'A testar...' : 'Testar Conexão'}</span>
                </button>

                {onSyncCloud && (
                  <button
                    type="button"
                    onClick={handleSyncWithCloud}
                    disabled={isSyncingCloud}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors disabled:opacity-50"
                    title="Enviar e atualizar catálogo completo para o Supabase"
                  >
                    {isSyncingCloud ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CloudUpload className="w-3.5 h-3.5" />
                    )}
                    <span>{isSyncingCloud ? 'A sincronizar...' : 'Enviar para Supabase'}</span>
                  </button>
                )}

                {onPullCloud && (
                  <button
                    type="button"
                    onClick={handlePullFromCloud}
                    disabled={isSyncingCloud}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
                    title="Descarregar catálogo existente no Supabase"
                  >
                    <CloudDownload className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Puxar da Nuvem</span>
                  </button>
                )}
              </div>
            </div>

            {/* Search & Category Filter Pills */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, variedade ou descrição..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-xs font-medium"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-800 text-white shadow-sm'
                        : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-200'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedCategory === cat.id ? 'bg-emerald-950 text-emerald-200' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scrollable Products List */}
          <div className="p-6 overflow-y-auto flex-1 bg-stone-100/60">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => {
                  const isSelected = selectedIds.has(product.id);
                  return (
                    <div
                      key={product.id}
                      className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                        isSelected 
                          ? 'border-red-500 ring-2 ring-red-500/20 shadow-md' 
                          : 'border-stone-200 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div>
                        {/* Thumbnail & Badges */}
                        <div className="relative h-40 bg-stone-100 overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                          
                          {/* Top Controls Overlay */}
                          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between">
                            {/* Checkbox toggle */}
                            <button
                              type="button"
                              onClick={() => toggleSelectItem(product.id)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shadow-sm ${
                                isSelected ? 'bg-red-600 text-white' : 'bg-white/90 hover:bg-white text-stone-700'
                              }`}
                              title={isSelected ? 'Desmarcar' : 'Selecionar para eliminação'}
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-emerald-950 bg-white/95 px-2 py-0.5 rounded shadow-sm">
                                {product.categoryLabel}
                              </span>
                              {product.isUserCreated ? (
                                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                  Criado por Si
                                </span>
                              ) : product.badge ? (
                                <span className="bg-amber-400 text-stone-950 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
                                  {product.badge}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <h4 className="font-bold text-stone-900 text-sm font-['Outfit'] line-clamp-1 mb-1" title={product.name}>
                            {product.name}
                          </h4>
                          <p className="text-xs text-stone-500 line-clamp-2 mb-3">
                            {product.tagline || product.description}
                          </p>

                          {/* Varieties tags */}
                          {product.varieties && product.varieties.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {product.varieties.slice(0, 2).map((v, idx) => (
                                <span key={idx} className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-medium truncate max-w-[140px]">
                                  {v}
                                </span>
                              ))}
                              {product.varieties.length > 2 && (
                                <span className="text-[10px] text-stone-400 font-bold self-center">
                                  +{product.varieties.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Actions (CRUD) */}
                      <div className="px-4 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => onEdit(product)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold transition-colors"
                          title="Editar este produto"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => {
                            onDuplicate(product.id);
                            showNotification(`Cópia de "${product.name}" criada com sucesso!`);
                          }}
                          className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-lg transition-colors"
                          title="Duplicar produto"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setProductToDelete(product)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors"
                          title="Eliminar semente na totalidade do sistema"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-stone-300 p-8">
                <Package className="w-14 h-14 text-stone-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-stone-800 mb-1">
                  {products.length === 0 ? 'Catálogo Vazio (Sem Produtos)' : 'Nenhum produto encontrado'}
                </h3>
                <p className="text-xs text-stone-500 mb-5 max-w-md mx-auto">
                  {products.length === 0 
                    ? 'Todas as sementes foram eliminadas na totalidade do catálogo. Pode adicionar novas sementes personalizadas a qualquer momento ou restaurar as sementes originais de fábrica.'
                    : 'Não existem sementes para a pesquisa ou categoria selecionada.'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={onAddNew}
                    className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Semente</span>
                  </button>
                  {products.length === 0 && (
                    <button
                      onClick={() => handleConfirmReset(false)}
                      className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Restaurar Sementes de Fábrica</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-stone-50 px-6 py-3.5 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 shrink-0">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ao eliminar produtos, eles são apagados na totalidade de todas as bases de dados.</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold transition-colors"
            >
              Concluir & Voltar ao Site
            </button>
          </div>
        </div>
      </div>

      {/* Safe Deletion Confirmation Modal for Single Product */}
      <DeleteConfirmModal
        isOpen={!!productToDelete}
        product={productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirmDelete={handleDeleteConfirmed}
      />

      {/* Modal for Deleting Selected Products in Totality */}
      {isDeleteSelectedModalOpen && (
        <div className="fixed inset-0 z-[115] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm"
            onClick={() => setIsDeleteSelectedModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full z-10 overflow-hidden border border-stone-200 p-6 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base font-['Outfit']">
                  Eliminar {selectedIds.size} Semente(s) Selecionada(s)
                </h3>
                <p className="text-xs text-stone-500">
                  Eliminação permanente na totalidade
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed mb-6">
              Tem a certeza de que deseja eliminar as <strong>{selectedIds.size} sementes selecionadas na totalidade</strong>? Elas serão removidas permanentemente do catálogo, IndexedDB e LocalStorage.
            </p>

            <div className="flex justify-end gap-2.5 border-t border-stone-100 pt-4">
              <button
                type="button"
                onClick={() => setIsDeleteSelectedModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteSelectedConfirmed}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Eliminar na Totalidade</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Deleting ALL Products in Totality */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-[115] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm"
            onClick={() => setIsDeleteAllModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full z-10 overflow-hidden border border-stone-200 p-6 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base font-['Outfit']">
                  Eliminar Todos os Produtos na Totalidade
                </h3>
                <p className="text-xs text-red-600 font-semibold">
                  Esvaziamento completo do catálogo
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed mb-4">
              Tem a certeza de que deseja eliminar <strong>todas as {products.length} sementes do catálogo na totalidade</strong>?
            </p>

            <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs text-red-800 mb-6">
              <strong>Atenção:</strong> O catálogo ficará completamente vazio. Nenhuma semente será mantida no sistema até que adicione novas ou restaure as de fábrica.
            </div>

            <div className="flex justify-end gap-2.5 border-t border-stone-100 pt-4">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAllConfirmed}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Eliminar Tudo na Totalidade</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Reset Options Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[115] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm"
            onClick={() => setIsResetModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full z-10 overflow-hidden border border-stone-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base font-['Outfit']">
                  Restaurar Catálogo de Sementes
                </h3>
                <p className="text-xs text-stone-500">
                  Escolha como deseja restaurar o catálogo
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 mb-5 leading-relaxed">
              Pode optar por manter as sementes que criou manualmente ou restaurar o catálogo de fábrica na totalidade.
            </p>

            <div className="space-y-3 mb-6">
              {/* Option 1: Safe Reset */}
              <button
                onClick={() => handleConfirmReset(true)}
                className="w-full text-left p-4 rounded-xl border-2 border-emerald-600 bg-emerald-50/60 hover:bg-emerald-50 transition-colors flex items-start gap-3"
              >
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-emerald-950">
                    Restaurar Originais & Preservar Minhas Sementes
                  </div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    Restaura as sementes de fábrica e preserva as suas {userProductsCount} sementes personalizadas.
                  </div>
                </div>
              </button>

              {/* Option 2: Full Factory Reset */}
              <button
                onClick={() => {
                  if (window.confirm('Atenção: Esta opção irá repor as sementes de fábrica e eliminar as personalizadas. Deseja continuar?')) {
                    handleConfirmReset(false);
                  }
                }}
                className="w-full text-left p-3.5 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/40 transition-colors flex items-start gap-3"
              >
                <RotateCcw className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-stone-800">
                    Repor Configurações de Fábrica Originais
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Restaura o pacote oficial padrão de sementes da Raffa Aliados do Campo.
                  </div>
                </div>
              </button>
            </div>

            <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

