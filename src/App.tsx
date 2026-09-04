import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ServicesSection } from './components/ServicesSection';
import { ProductsSection } from './components/ProductsSection';
import { SeedCalculator } from './components/SeedCalculator';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { QuoteModal } from './components/QuoteModal';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { AdminCatalogModal } from './components/AdminCatalogModal';
import { ProductFormModal } from './components/ProductFormModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { FeaturedInfoSection } from './components/FeaturedInfoSection';
import { FeaturedInfoModal } from './components/FeaturedInfoModal';
import { useProductsCatalog } from './hooks/useProductsCatalog';
import { useAdminAuth } from './hooks/useAdminAuth';
import { useFeaturedInfo } from './hooks/useFeaturedInfo';
import { ProductItem, FeaturedInfoItem } from './types';

export default function App() {
  const [isQuoteOpen, setIsQuoteOpen] = useState<boolean>(false);
  const [quoteInitialProduct, setQuoteInitialProduct] = useState<string>('');

  // CRUD Catalog State & Hook
  const {
    products,
    syncStatus,
    lastSyncedAt,
    addProduct,
    updateProduct,
    deleteProduct,
    deleteAllProducts,
    deleteMultipleProducts,
    duplicateProduct,
    resetToDefault,
    importCatalog,
    exportCatalogJSON,
    syncWithCloud,
    pullFromCloud,
  } = useProductsCatalog();

  // Featured Info (Comunicados & Destaques) Hook
  const {
    featuredItems,
    activeFeaturedItems,
    addFeaturedItem,
    updateFeaturedItem,
    toggleActive: toggleFeaturedInfoActive,
    deleteFeaturedItem,
  } = useFeaturedInfo();

  // Admin PIN Auth (4029) Hook
  const {
    isAuthenticated,
    isAuthModalOpen,
    authActionTitle,
    checkOrPromptAuth,
    handleAuthSuccess,
    handleCloseAuth,
    lockAdminSession,
  } = useAdminAuth();

  const [isAdminCatalogOpen, setIsAdminCatalogOpen] = useState<boolean>(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Featured Info Modal State
  const [isFeaturedInfoModalOpen, setIsFeaturedInfoModalOpen] = useState<boolean>(false);
  const [editingFeaturedInfo, setEditingFeaturedInfo] = useState<FeaturedInfoItem | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  useEffect(() => {
    const handleBrandUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ logo?: string | null }>;
      if (customEvent.detail && customEvent.detail.logo) {
        showToast('Logótipo da empresa atualizado e guardado com sucesso!');
      } else {
        showToast('Emblema oficial restaurado e guardado com sucesso!');
      }
    };
    window.addEventListener('raffa_brand_updated', handleBrandUpdated);
    return () => window.removeEventListener('raffa_brand_updated', handleBrandUpdated);
  }, []);

  // Close & Lock Admin Panel (Ensures PIN is strictly requested on every return)
  const handleCloseAdminCatalog = () => {
    setIsAdminCatalogOpen(false);
    lockAdminSession();
  };

  const handleCloseProductForm = () => {
    setIsProductFormOpen(false);
    setEditingProduct(null);
    if (!isAdminCatalogOpen) {
      lockAdminSession();
    }
  };

  const handleOpenQuote = (productName?: string) => {
    if (productName) {
      setQuoteInitialProduct(productName);
    } else {
      setQuoteInitialProduct('');
    }
    setIsQuoteOpen(true);
  };

  const handleCloseQuote = () => {
    setIsQuoteOpen(false);
    setQuoteInitialProduct('');
  };

  // Protected Admin CRUD Actions (requires PIN 4029)
  const handleOpenAdminCatalogProtected = () => {
    checkOrPromptAuth('Gerir Catálogo', () => {
      setIsAdminCatalogOpen(true);
    });
  };

  const handleAddNewProductProtected = () => {
    checkOrPromptAuth('Cadastrar Novo Produto', () => {
      setEditingProduct(null);
      setIsProductFormOpen(true);
    });
  };

  const handleEditProductProtected = (product: ProductItem) => {
    checkOrPromptAuth(`Editar Produto "${product.name}"`, () => {
      setEditingProduct(product);
      setIsProductFormOpen(true);
    });
  };

  const handleDeleteProductProtected = (id: string) => {
    checkOrPromptAuth('Eliminar Produto na Totalidade', async () => {
      const target = products.find(p => p.id === id);
      await deleteProduct(id);
      showToast(`Produto "${target?.name || ''}" eliminado na totalidade com sucesso.`);
    });
  };

  const handleDeleteAllProductsProtected = () => {
    checkOrPromptAuth('Eliminar Todos os Produtos na Totalidade', async () => {
      await deleteAllProducts();
      showToast('Todos os produtos foram eliminados do catálogo na totalidade.');
    });
  };

  const handleDeleteMultipleProductsProtected = (ids: string[]) => {
    checkOrPromptAuth(`Eliminar ${ids.length} Produtos na Totalidade`, async () => {
      await deleteMultipleProducts(ids);
      showToast(`${ids.length} produto(s) eliminado(s) na totalidade.`);
    });
  };

  const handleSaveProduct = (productData: Omit<ProductItem, 'id'> & { id?: string }) => {
    if (productData.id) {
      updateProduct(productData.id, productData);
      showToast(`Alterações de "${productData.name}" guardadas com sucesso!`);
    } else {
      addProduct(productData);
      showToast(`Novo produto "${productData.name}" adicionado e guardado!`);
    }
    setIsProductFormOpen(false);
    setEditingProduct(null);
  };

  // Handlers for Featured Info (Comunicados & Informações em Destaque)
  const handleAddNewFeaturedInfoProtected = () => {
    checkOrPromptAuth('Adicionar Informação ao Destaque', () => {
      setEditingFeaturedInfo(null);
      setIsFeaturedInfoModalOpen(true);
    });
  };

  const handleEditFeaturedInfoProtected = (item: FeaturedInfoItem) => {
    checkOrPromptAuth(`Editar Informação "${item.title}"`, () => {
      setEditingFeaturedInfo(item);
      setIsFeaturedInfoModalOpen(true);
    });
  };

  const handleToggleFeaturedInfoActiveProtected = (id: string) => {
    checkOrPromptAuth('Alterar Exibição no Destaque', async () => {
      await toggleFeaturedInfoActive(id);
      showToast('Estado de exibição no destaque atualizado com sucesso!');
    });
  };

  const handleDeleteFeaturedInfoProtected = (id: string) => {
    checkOrPromptAuth('Eliminar Informação do Destaque', async () => {
      await deleteFeaturedItem(id);
      showToast('Informação eliminada com sucesso!');
    });
  };

  const handleSaveFeaturedInfo = async (infoData: Omit<FeaturedInfoItem, 'id' | 'createdAt'> & { id?: string }) => {
    if (infoData.id) {
      await updateFeaturedItem(infoData.id, infoData);
      showToast(`Informação "${infoData.title}" atualizada com sucesso!`);
    } else {
      await addFeaturedItem(infoData);
      showToast(`Nova informação "${infoData.title}" adicionada e publicada no destaque!`);
    }
    setIsFeaturedInfoModalOpen(false);
    setEditingFeaturedInfo(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Navigation Header */}
      <Header 
        onOpenQuote={handleOpenQuote}
        onOpenAdminCatalog={handleOpenAdminCatalogProtected}
        onAddNewProduct={handleAddNewProductProtected}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 1. Hero Section matching prompt */}
        <Hero onOpenQuote={() => handleOpenQuote('Pacote de Início de Campanha')} />

        {/* Informações & Comunicados em Destaque Section */}
        <FeaturedInfoSection 
          items={featuredItems}
          onOpenQuote={handleOpenQuote}
          onAddNewInfo={handleAddNewFeaturedInfoProtected}
          onEditInfo={handleEditFeaturedInfoProtected}
          onToggleActive={handleToggleFeaturedInfoActiveProtected}
          onDeleteInfo={handleDeleteFeaturedInfoProtected}
        />

        {/* 2. Services Section (Sementes, Fertilizantes, Agroquímicos, Equipamentos, Prestação de Serviços) */}
        <ServicesSection onOpenQuote={handleOpenQuote} />

        {/* 3. Products Section ("Nossas Sementes" with interactive CRUD integration & categories) */}
        <ProductsSection 
          products={products}
          onOpenQuote={handleOpenQuote}
          onOpenAdminCatalog={handleOpenAdminCatalogProtected}
          onAddNewProduct={handleAddNewProductProtected}
          onEditProduct={handleEditProductProtected}
        />

        {/* 4. Agronomic Calculator for Seed & Fertilizer Requirements */}
        <SeedCalculator onOpenQuote={handleOpenQuote} />

        {/* 5. Quem Somos Section (About Raffa Aliados do Campo in Namiconha, Ribaué) */}
        <AboutSection onOpenQuote={() => handleOpenQuote('Parceria Geral / Associação')} />

        {/* 6. Contact Section (WhatsApp 870095149, Tel 848361130, Email raffaaliadosdocampo@gmail.com, Namiconha - Ribaué) */}
        <ContactSection onOpenQuote={() => handleOpenQuote()} />
      </main>

      {/* Footer */}
      <Footer 
        onOpenAdminCatalog={handleOpenAdminCatalogProtected}
        onAddNewFeaturedInfo={handleAddNewFeaturedInfoProtected}
        onOpenFeaturedInfoManager={() => {
          const el = document.getElementById('informacoes-destaque');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* Floating Action Button */}
      <FloatingWhatsApp />

      {/* Interactive Quotation Modal */}
      <QuoteModal
        isOpen={isQuoteOpen}
        onClose={handleCloseQuote}
        initialProduct={quoteInitialProduct}
      />

      {/* CRUD Admin Management Center Modal */}
      <AdminCatalogModal
        isOpen={isAdminCatalogOpen}
        onClose={handleCloseAdminCatalog}
        products={products}
        onAddNew={handleAddNewProductProtected}
        onEdit={(product) => {
          handleEditProductProtected(product);
        }}
        onDelete={handleDeleteProductProtected}
        onDeleteAll={handleDeleteAllProductsProtected}
        onDeleteMultiple={handleDeleteMultipleProductsProtected}
        onDuplicate={duplicateProduct}
        onResetToDefault={resetToDefault}
        onImportJSON={importCatalog}
        onExportJSON={exportCatalogJSON}
        onSyncCloud={syncWithCloud}
        onPullCloud={pullFromCloud}
        onOpenFeaturedInfoManager={handleAddNewFeaturedInfoProtected}
        syncStatus={syncStatus}
        lastSyncedAt={lastSyncedAt}
      />

      {/* CRUD Create/Edit Product Modal */}
      <ProductFormModal
        isOpen={isProductFormOpen}
        onClose={handleCloseProductForm}
        onSave={handleSaveProduct}
        initialProduct={editingProduct}
      />

      {/* CRUD Create/Edit Featured Information Modal */}
      <FeaturedInfoModal
        isOpen={isFeaturedInfoModalOpen}
        onClose={() => {
          setIsFeaturedInfoModalOpen(false);
          setEditingFeaturedInfo(null);
        }}
        onSave={handleSaveFeaturedInfo}
        initialInfo={editingFeaturedInfo}
      />

      {/* Security PIN 4029 Authentication Modal */}
      <AdminAuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuth}
        onSuccess={handleAuthSuccess}
        actionTitle={authActionTitle}
      />

      {/* Floating Save Confirmation Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] max-w-md bg-stone-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-7 h-7 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Check className="w-4 h-4" />
          </div>
          <div className="text-xs font-semibold leading-snug">
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
}
