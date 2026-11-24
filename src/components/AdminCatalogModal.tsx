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
  Inbox,
  KeyRound,
  MessageCircle,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Mail,
  Megaphone,
  Eye,
  EyeOff,
  Cloud,
  CloudOff,
  RefreshCw,
  LogIn,
  LogOut,
  ExternalLink,
  Copy as CopyIcon
} from 'lucide-react';
import { ContactMessageRecord, FeaturedInfoItem, ProductItem, QuoteRecord } from '../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import {
  deleteContactFromLocalDB,
  deleteQuoteFromLocalDB,
  loadContactsFromLocalDB,
  loadQuotesFromLocalDB,
  updateContactStatusInLocalDB,
  updateQuoteStatusInLocalDB,
} from '../utils/persistentDB';
import {
  loadCloudQuotes,
  loadCloudContacts,
  updateCloudQuoteStatus,
  deleteCloudQuote,
  updateCloudContactStatus,
  deleteCloudContact,
} from '../utils/cloudSync';
import { formatMzn } from './CartDrawerModal';
import { COMPANY_INFO } from '../data/agroData';

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
  featuredItems?: FeaturedInfoItem[];
  onAddNewFeaturedInfo?: () => void;
  onEditFeaturedInfo?: (item: FeaturedInfoItem) => void;
  onToggleFeaturedInfoActive?: (id: string) => void;
  onDeleteFeaturedInfo?: (id: string) => void;
  onChangeAdminPin?: (oldPin: string, newPin: string) => Promise<{ ok: boolean; error?: string }>;
  isCloudAdmin?: boolean;
  cloudUserEmail?: string | null;
  isSigningInCloud?: boolean;
  cloudAuthError?: string | null;
  unauthorizedDomainHost?: string | null;
  firebaseProjectId?: string;
  onSignInCloud?: () => Promise<void>;
  onSignOutCloud?: () => Promise<void>;
  isCatalogCloudInitialized?: boolean;
  isCloudSyncing?: boolean;
  onSyncAllToCloud?: () => Promise<void>;
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
  featuredItems = [],
  onAddNewFeaturedInfo,
  onEditFeaturedInfo,
  onToggleFeaturedInfoActive,
  onDeleteFeaturedInfo,
  onChangeAdminPin,
  isCloudAdmin = false,
  cloudUserEmail = null,
  isSigningInCloud = false,
  cloudAuthError = null,
  unauthorizedDomainHost = null,
  firebaseProjectId = '',
  onSignInCloud,
  onSignOutCloud,
  isCatalogCloudInitialized = false,
  isCloudSyncing = false,
  onSyncAllToCloud,
}) => {
  const [domainCopied, setDomainCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'featured' | 'history' | 'security'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeleteSelectedModalOpen, setIsDeleteSelectedModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const fileImportRef = useRef<HTMLInputElement>(null);

  // History state
  const [quotesHistory, setQuotesHistory] = useState<QuoteRecord[]>([]);
  const [contactsHistory, setContactsHistory] = useState<ContactMessageRecord[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  // Security PIN change state
  const [oldPinInput, setOldPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinFeedback, setPinFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const refreshHistory = React.useCallback(async () => {
    const [localQ, localC, cloudQ, cloudC] = await Promise.all([
      loadQuotesFromLocalDB(),
      loadContactsFromLocalDB(),
      isCloudAdmin ? loadCloudQuotes().catch(() => []) : Promise.resolve([]),
      isCloudAdmin ? loadCloudContacts().catch(() => []) : Promise.resolve([]),
    ]);

    const qMap = new Map<string, QuoteRecord>();
    localQ.forEach((item) => qMap.set(item.id, item));
    cloudQ.forEach((item) => qMap.set(item.id, item));
    setQuotesHistory(Array.from(qMap.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));

    const cMap = new Map<string, ContactMessageRecord>();
    localC.forEach((item) => cMap.set(item.id, item));
    cloudC.forEach((item) => cMap.set(item.id, item));
    setContactsHistory(Array.from(cMap.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
  }, [isCloudAdmin]);

  React.useEffect(() => {
    if (!isOpen) return;
    void refreshHistory();
    const handler = () => {
      void refreshHistory();
    };
    window.addEventListener('raffa_history_updated', handler);
    return () => window.removeEventListener('raffa_history_updated', handler);
  }, [isOpen, refreshHistory]);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4500);
  };

  const pendingHistoryCount =
    quotesHistory.filter((q) => q.status !== 'resolved').length +
    contactsHistory.filter((c) => c.status !== 'resolved').length;

  const handleToggleQuoteStatus = async (q: QuoteRecord) => {
    const nextStatus = q.status === 'resolved' ? 'pending' : 'resolved';
    await updateQuoteStatusInLocalDB(q.id, nextStatus);
    if (isCloudAdmin) {
      await updateCloudQuoteStatus(q.id, nextStatus).catch((err) => console.warn(err));
    }
    await refreshHistory();
    showNotification(`Pedido de "${q.name}" marcado como ${nextStatus === 'resolved' ? 'Atendido' : 'Pendente'}.`);
  };

  const handleDeleteQuote = async (id: string) => {
    await deleteQuoteFromLocalDB(id);
    if (isCloudAdmin) {
      await deleteCloudQuote(id).catch((err) => console.warn(err));
    }
    await refreshHistory();
    showNotification('Registo de orçamento eliminado.');
  };

  const handleToggleContactStatus = async (c: ContactMessageRecord) => {
    const nextStatus = c.status === 'resolved' ? 'pending' : 'resolved';
    await updateContactStatusInLocalDB(c.id, nextStatus);
    if (isCloudAdmin) {
      await updateCloudContactStatus(c.id, nextStatus).catch((err) => console.warn(err));
    }
    await refreshHistory();
    showNotification(`Mensagem de "${c.name}" marcada como ${nextStatus === 'resolved' ? 'Atendida' : 'Pendente'}.`);
  };

  const handleDeleteContact = async (id: string) => {
    await deleteContactFromLocalDB(id);
    if (isCloudAdmin) {
      await deleteCloudContact(id).catch((err) => console.warn(err));
    }
    await refreshHistory();
    showNotification('Mensagem eliminada.');
  };

  const handleExportHistoryJSON = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      quotes: quotesHistory,
      contactMessages: contactsHistory,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raffa-historico-atendimento-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Histórico exportado com sucesso!');
  };

  const handlePinChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinFeedback(null);
    if (!/^\d{4}$/.test(newPinInput)) {
      setPinFeedback({ type: 'error', text: 'O novo PIN deve conter exatamente 4 dígitos numéricos.' });
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinFeedback({ type: 'error', text: 'A confirmação do novo PIN não coincide.' });
      return;
    }
    if (!onChangeAdminPin) return;
    const res = await onChangeAdminPin(oldPinInput, newPinInput);
    if (res.ok) {
      setOldPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      setPinFeedback({ type: 'success', text: 'PIN de administração atualizado e guardado com sucesso!' });
      showNotification('PIN de segurança alterado com sucesso.');
    } else {
      setPinFeedback({ type: 'error', text: res.error || 'Erro ao alterar o PIN.' });
    }
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
                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
                title="Fechar painel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Admin Navigation Tabs */}
          <div className="bg-stone-800 px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-stone-700 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'catalog'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-300 hover:bg-stone-700'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Catálogo ({products.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('featured')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'featured'
                  ? 'bg-amber-400 text-stone-950 shadow-sm'
                  : 'text-stone-300 hover:bg-stone-700'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Destaques & Informações ({featuredItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('history');
                void refreshHistory();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-300 hover:bg-stone-700'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Orçamentos & Mensagens</span>
              {pendingHistoryCount > 0 && (
                <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {pendingHistoryCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'security'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-300 hover:bg-stone-700'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Segurança (PIN)</span>
            </button>
          </div>

          {/* Cloud Persistence / Vercel Sync Status Bar */}
          <div
            className={`px-5 py-2.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 ${
              isCloudAdmin
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              {isCloudAdmin ? (
                <Cloud className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5 sm:mt-0" />
              ) : (
                <CloudOff className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
              )}
              <div className="text-xs leading-snug">
                {isCloudAdmin ? (
                  <>
                    <span className="font-bold text-emerald-900">
                      Nuvem Ativa ({cloudUserEmail})
                    </span>
                    <span className="text-emerald-800 ml-1.5">
                      {!isCatalogCloudInitialized
                        ? '— A sincronizar automaticamente as suas alterações locais com a nuvem...'
                        : '— Tudo o que adicionar, editar ou eliminar é atualizado no site automaticamente assim que gravar.'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-amber-950">
                      Modo Apenas Local neste navegador:
                    </span>
                    <span className="text-amber-900 ml-1">
                      Entre com o Google Admin ({COMPANY_INFO.email}) para que cada gravação atualize automaticamente o site no Vercel para todos.
                    </span>
                  </>
                )}
                {cloudAuthError && (
                  <div className="mt-1.5 text-[11px] font-bold text-red-700 space-y-1.5">
                    <div>{cloudAuthError}</div>
                    {unauthorizedDomainHost && (
                      <div className="bg-white/90 border border-red-200 rounded-xl p-2.5 text-stone-800 font-medium space-y-2">
                        <div>
                          Só precisa de fazer isto <strong>1 vez</strong>: abra as definições do Firebase abaixo, em <strong>Authorized domains</strong> clique em <strong>Add domain</strong> e adicione <code className="bg-stone-100 px-1.5 py-0.5 rounded font-bold text-stone-900">{unauthorizedDomainHost}</code>.
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              void navigator.clipboard?.writeText(unauthorizedDomainHost);
                              setDomainCopied(true);
                              setTimeout(() => setDomainCopied(false), 2500);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold cursor-pointer"
                          >
                            <CopyIcon className="w-3 h-3" />
                            <span>{domainCopied ? 'Domínio Copiado!' : `Copiar "${unauthorizedDomainHost}"`}</span>
                          </button>
                          {firebaseProjectId && (
                            <a
                              href={`https://console.firebase.google.com/project/${firebaseProjectId}/authentication/settings`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 text-[11px] font-black"
                            >
                              <span>Abrir Firebase Console (Authorized Domains)</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {isCloudAdmin ? (
                <>
                  {onSyncAllToCloud && (
                    <button
                      type="button"
                      disabled={isCloudSyncing}
                      onClick={() => void onSyncAllToCloud()}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60 ${
                        !isCatalogCloudInitialized
                          ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 animate-pulse'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      }`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                      <span>
                        {isCloudSyncing
                          ? 'A sincronizar...'
                          : !isCatalogCloudInitialized
                          ? 'Publicar Catálogo Local na Nuvem'
                          : 'Sincronizar Tudo → Nuvem'}
                      </span>
                    </button>
                  )}
                  {onSignOutCloud && (
                    <button
                      type="button"
                      onClick={() => void onSignOutCloud()}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-100 border border-emerald-200 text-emerald-900 text-xs font-semibold cursor-pointer"
                      title="Terminar sessão Google Admin"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sair Google</span>
                    </button>
                  )}
                </>
              ) : (
                onSignInCloud && (
                  <button
                    type="button"
                    disabled={isSigningInCloud}
                    onClick={() => void onSignInCloud()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>
                      {isSigningInCloud
                        ? 'A abrir Google...'
                        : 'Entrar com Google Admin (Nuvem / Vercel)'}
                    </span>
                  </button>
                )
              )}
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
          {activeTab === 'catalog' && selectedIds.size > 0 && (
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

          {activeTab === 'catalog' && (
          <>
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

                {onAddNewFeaturedInfo && (
                  <button
                    type="button"
                    onClick={onAddNewFeaturedInfo}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-black shadow-sm transition-colors cursor-pointer"
                    title="Adicionar nova informação ou comunicado ao destaque"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Adicionar Informação</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('featured')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  title="Gerir avisos, ativar/ocultar ou editar destaques da campanha"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Gerir Destaques ({featuredItems.length})</span>
                </button>
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
          </>
          )}

          {/* TAB: DESTAQUES & INFORMAÇÕES */}
          {activeTab === 'featured' && (
            <div className="flex-1 overflow-y-auto bg-stone-100/60 p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm">
                <div>
                  <h3 className="text-base font-extrabold text-stone-900 font-['Outfit'] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-current" />
                    Gestão de Informações & Destaques da Campanha
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {featuredItems.length} registo(s) no total •{' '}
                    {featuredItems.filter((i) => i.isActive).length} ativo(s) em destaque na página inicial.
                  </p>
                </div>
                {onAddNewFeaturedInfo && (
                  <button
                    type="button"
                    id="admin-add-featured-info-btn"
                    onClick={onAddNewFeaturedInfo}
                    className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-950 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Adicionar Informação ao Destaque</span>
                  </button>
                )}
              </div>

              {featuredItems.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-10 text-center">
                  <Megaphone className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-stone-800 mb-1">
                    Nenhuma Informação Registada
                  </h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto mb-4">
                    Adicione comunicados oficiais, chegadas de lotes de sementes ou promoções para publicar no topo da página.
                  </p>
                  {onAddNewFeaturedInfo && (
                    <button
                      type="button"
                      onClick={onAddNewFeaturedInfo}
                      className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar Primeira Informação</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredItems.map((item) => (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl border p-4 shadow-sm flex flex-col justify-between gap-3 ${
                        item.isActive ? 'border-emerald-300' : 'border-stone-200 opacity-80'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-20 h-20 rounded-xl object-contain bg-stone-100 border border-stone-200 shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                item.isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {item.isActive ? '✓ Ativo no Destaque' : 'Oculto'}
                            </span>
                            {item.badgeText && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                                {item.badgeText}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-stone-900 leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-xs text-stone-600 line-clamp-2">
                            {item.summary}
                          </p>
                          {item.dateText && (
                            <div className="text-[11px] text-stone-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{item.dateText}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2.5 border-t border-stone-100">
                        {onToggleFeaturedInfoActive && (
                          <button
                            type="button"
                            onClick={() => onToggleFeaturedInfoActive(item.id)}
                            className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                              item.isActive
                                ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                            }`}
                          >
                            {item.isActive ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Ocultar</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ativar no Destaque</span>
                              </>
                            )}
                          </button>
                        )}
                        {onEditFeaturedInfo && (
                          <button
                            type="button"
                            onClick={() => onEditFeaturedInfo(item)}
                            className="py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                        )}
                        {onDeleteFeaturedInfo && (
                          <button
                            type="button"
                            onClick={() => onDeleteFeaturedInfo(item.id)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 cursor-pointer"
                            title="Eliminar informação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HISTÓRICO DE ORÇAMENTOS & MENSAGENS */}
          {activeTab === 'history' && (
            <div className="flex-1 overflow-y-auto bg-stone-100/60 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                <div>
                  <h3 className="text-base font-extrabold text-stone-900 font-['Outfit']">
                    Histórico de Orçamentos, Carrinhos & Mensagens
                  </h3>
                  <p className="text-xs text-stone-500">
                    {isCloudAdmin
                      ? 'Sincronizado com a nuvem Firebase: pedidos enviados de qualquer dispositivo aparecem aqui.'
                      : 'Pedidos guardados localmente neste navegador. Entre com o Google Admin acima para ver pedidos da nuvem.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(['all', 'pending', 'resolved'] as const).map((statusKey) => (
                    <button
                      key={statusKey}
                      type="button"
                      onClick={() => setHistoryFilter(statusKey)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        historyFilter === statusKey
                          ? 'bg-emerald-800 text-white'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {statusKey === 'all' ? 'Todos' : statusKey === 'pending' ? 'Pendentes' : 'Atendidos'}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleExportHistoryJSON}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar Histórico</span>
                  </button>
                </div>
              </div>

              {/* Quotes & Orders */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Pedidos de Orçamento & Listas de Pedido ({quotesHistory.length})
                </h4>
                {quotesHistory.filter((q) => historyFilter === 'all' || (historyFilter === 'resolved' ? q.status === 'resolved' : q.status !== 'resolved')).length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-8 text-center text-xs text-stone-500">
                    Nenhum pedido de orçamento encontrado neste filtro.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quotesHistory
                      .filter((q) => historyFilter === 'all' || (historyFilter === 'resolved' ? q.status === 'resolved' : q.status !== 'resolved'))
                      .map((q) => {
                        const isResolved = q.status === 'resolved';
                        const replyText = encodeURIComponent(
                          `Olá ${q.name}, recebemos o seu pedido (${q.selectedProduct || q.selectedCategory}) na Raffa Aliados do Campo. Estamos a preparar o atendimento!`
                        );
                        return (
                          <div key={q.id} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex flex-col justify-between gap-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                                  {isResolved ? 'Atendido' : 'Pendente'}
                                </span>
                                <span className="text-[11px] text-stone-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(q.createdAt).toLocaleString('pt-MZ')}
                                </span>
                              </div>
                              <div>
                                <div className="font-bold text-sm text-stone-900">{q.name || 'Cliente'}</div>
                                <div className="text-xs text-stone-600 flex flex-wrap items-center gap-3 mt-0.5">
                                  <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-emerald-700" /> {q.phone || 'S/N'}</span>
                                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-amber-600" /> {q.location || 'Ribaué'}</span>
                                </div>
                              </div>
                              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100 text-xs text-stone-700 space-y-1">
                                <div><strong>Categoria:</strong> {q.selectedCategory}</div>
                                <div><strong>Produtos:</strong> {q.selectedProduct || 'Geral'}</div>
                                <div><strong>Qtd/Área:</strong> {q.areaOrQuantity || 'A definir'}</div>
                                {q.totalMzn && q.totalMzn > 0 && (
                                  <div className="text-emerald-800 font-bold">Total Estimado: {formatMzn(q.totalMzn)} MZN</div>
                                )}
                                {q.notes && <div className="italic text-stone-500">"{q.notes}"</div>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                              <button
                                type="button"
                                onClick={() => handleToggleQuoteStatus(q)}
                                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                                  isResolved ? 'bg-stone-100 text-stone-700 hover:bg-stone-200' : 'bg-emerald-700 text-white hover:bg-emerald-800'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{isResolved ? 'Reabrir' : 'Marcar Atendido'}</span>
                              </button>
                              {q.phone && (
                                <a
                                  href={`https://wa.me/${q.phone.replace(/\D/g, '').startsWith('258') ? q.phone.replace(/\D/g, '') : `258${q.phone.replace(/\D/g, '')}`}?text=${replyText}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="py-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>Responder</span>
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteQuote(q.id)}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Quick Contact Messages */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Mensagens Rápidas Recebidas ({contactsHistory.length})
                </h4>
                {contactsHistory.filter((c) => historyFilter === 'all' || (historyFilter === 'resolved' ? c.status === 'resolved' : c.status !== 'resolved')).length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-8 text-center text-xs text-stone-500">
                    Nenhuma mensagem registada neste filtro.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contactsHistory
                      .filter((c) => historyFilter === 'all' || (historyFilter === 'resolved' ? c.status === 'resolved' : c.status !== 'resolved'))
                      .map((c) => {
                        const isResolved = c.status === 'resolved';
                        return (
                          <div key={c.id} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex flex-col justify-between gap-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                                  {isResolved ? 'Atendida' : 'Nova Mensagem'}
                                </span>
                                <span className="text-[11px] text-stone-400">
                                  {new Date(c.createdAt).toLocaleString('pt-MZ')}
                                </span>
                              </div>
                              <div className="font-bold text-sm text-stone-900">{c.name}</div>
                              <div className="text-xs text-stone-600 flex flex-wrap gap-3">
                                {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-emerald-700" /> {c.phone}</span>}
                                {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-amber-600" /> {c.email}</span>}
                              </div>
                              <p className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                                {c.message}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                              <button
                                type="button"
                                onClick={() => handleToggleContactStatus(c)}
                                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                                  isResolved ? 'bg-stone-100 text-stone-700 hover:bg-stone-200' : 'bg-emerald-700 text-white hover:bg-emerald-800'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{isResolved ? 'Reabrir' : 'Marcar Atendida'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteContact(c.id)}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SEGURANÇA (ALTERAR PIN DE ADMINISTRAÇÃO) */}
          {activeTab === 'security' && (
            <div className="flex-1 overflow-y-auto bg-stone-100/60 p-6 flex items-start justify-center">
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm max-w-md w-full p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-stone-900 font-['Outfit']">
                      Alterar Código PIN de Acesso
                    </h3>
                    <p className="text-xs text-stone-500">
                      Personalize o PIN de 4 dígitos usado para gerir produtos e o logótipo.
                    </p>
                  </div>
                </div>

                {pinFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold border ${
                      pinFeedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                  >
                    {pinFeedback.text}
                  </div>
                )}

                <form onSubmit={handlePinChangeSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                      PIN Atual (4 dígitos)
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      required
                      placeholder="••••"
                      value={oldPinInput}
                      onChange={(e) => setOldPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-sm font-mono tracking-widest"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                      Novo PIN (4 dígitos)
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      required
                      placeholder="••••"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-sm font-mono tracking-widest"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                      Confirmar Novo PIN
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      required
                      placeholder="••••"
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 outline-none text-sm font-mono tracking-widest"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer"
                  >
                    Guardar Novo PIN
                  </button>
                </form>

                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-[11px] text-stone-600 leading-relaxed">
                  <strong>Nota:</strong> O novo PIN fica guardado localmente neste dispositivo/navegador em armazenamento persistente ({COMPANY_INFO.name}).
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="bg-stone-50 px-6 py-3.5 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 shrink-0">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nuvem Firebase + Cache Offline (IndexedDB): sincronização global entre dispositivos e funcionamento garantido sem internet.</span>
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

