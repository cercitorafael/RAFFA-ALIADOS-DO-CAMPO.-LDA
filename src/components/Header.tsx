import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Phone, 
  Menu, 
  X, 
  MessageCircle, 
  MapPin, 
  ShieldCheck,
  ChevronRight,
  Settings2,
  Plus
} from 'lucide-react';
import { COMPANY_INFO } from '../data/agroData';
import { RaffaLogo } from './RaffaLogo';

interface HeaderProps {
  onOpenQuote: (productName?: string) => void;
  onOpenAdminCatalog: () => void;
  onAddNewProduct: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenQuote,
  onOpenAdminCatalog,
  onAddNewProduct
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Início', href: '#inicio' },
    { label: 'Serviços', href: '#servicos' },
    { label: 'Sementes & Produtos', href: '#produtos' },
    { label: 'Calculadora', href: '#calculadora' },
    { label: 'Quem Somos', href: '#quem-somos' },
    { label: 'Contacto', href: '#contacto' },
  ];

  return (
    <header id="main-header" className="sticky top-0 z-50 transition-all duration-300">
      {/* Top micro-bar with contact & location info */}
      <div id="top-announcement-bar" className="bg-emerald-950 text-emerald-100 text-xs py-2 px-4 border-b border-emerald-800/40">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{COMPANY_INFO.location}, {COMPANY_INFO.province}</span>
            </span>
            <span className="hidden md:inline text-emerald-600">•</span>
            <span className="hidden md:flex items-center gap-1.5 text-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Sementes Certificadas & Insumos de Qualidade
            </span>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <a 
              id="topbar-whatsapp-link"
              href={`https://wa.me/258${COMPANY_INFO.whatsapp}?text=Olá%20Raffa%20Aliados%20do%20Campo,%20gostaria%20de%20informações`}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-emerald-300 transition-colors font-medium"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp: {COMPANY_INFO.whatsapp}</span>
            </a>
            <span className="text-emerald-700">|</span>
            <a 
              id="topbar-phone-link"
              href={`tel:${COMPANY_INFO.phoneFull}`} 
              className="flex items-center gap-1 hover:text-emerald-300 transition-colors font-medium"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cel: {COMPANY_INFO.phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className={`bg-white/95 backdrop-blur-md transition-shadow duration-300 ${
        isScrolled ? 'shadow-md border-b border-stone-200/80 py-3' : 'py-4 border-b border-stone-200/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Brand Logo */}
          <a id="brand-logo-link" href="#inicio" className="flex items-center group">
            <RaffaLogo size="md" showText={true} theme="color" />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                id={`nav-link-${link.href.replace('#', '')}`}
                href={link.href}
                className="text-stone-700 hover:text-emerald-700 font-medium text-[15px] transition-colors py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-emerald-600 hover:after:w-full after:transition-all after:duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            <button
              id="header-quote-btn"
              onClick={() => onOpenQuote()}
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              <span>Solicitar Orçamento</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              id="mobile-quote-quick-btn"
              onClick={() => onOpenQuote()}
              className="sm:hidden text-xs bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-md"
            >
              Orçamento
            </button>
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-700 hover:text-emerald-700 hover:bg-stone-100 focus:outline-none"
              aria-label="Abrir menu de navegação"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div id="mobile-navigation-drawer" className="lg:hidden bg-white border-b border-stone-200 shadow-xl px-4 pt-3 pb-6 animate-in slide-in-from-top-3 duration-200">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-stone-800 hover:text-emerald-700 font-medium text-base py-2 px-3 rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-between"
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </a>
            ))}
            <div className="pt-3 border-t border-stone-100 flex flex-col gap-2.5">
              <button
                id="drawer-quote-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenQuote();
                }}
                className="w-full text-center bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-lg shadow-sm"
              >
                Solicitar Orçamento Grátis
              </button>
              <a
                id="drawer-whatsapp-btn"
                href={`https://wa.me/258${COMPANY_INFO.whatsapp}?text=Olá%20Raffa%20Aliados%20do%20Campo`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-semibold py-3 rounded-lg transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-emerald-700" />
                <span>Conversar no WhatsApp ({COMPANY_INFO.whatsapp})</span>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
