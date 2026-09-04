import React from 'react';
import { 
  Sprout, 
  Phone, 
  MessageCircle, 
  Mail, 
  MapPin, 
  ArrowUp,
  Heart,
  ShieldCheck,
  Settings2,
  Plus,
  Megaphone
} from 'lucide-react';
import { COMPANY_INFO } from '../data/agroData';
import { RaffaLogo } from './RaffaLogo';

interface FooterProps {
  onOpenAdminCatalog?: () => void;
  onAddNewFeaturedInfo?: () => void;
  onOpenFeaturedInfoManager?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onOpenAdminCatalog,
  onAddNewFeaturedInfo,
  onOpenFeaturedInfoManager,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-stone-950 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-stone-800">
          
          {/* Brand Info (col 5) */}
          <div className="lg:col-span-5 space-y-4">
            <RaffaLogo size="lg" showText={true} theme="light" />

            <p className="text-stone-400 text-sm leading-relaxed max-w-md">
              {COMPANY_INFO.subSlogan}. Fornecedor líder de sementes certificadas de alta produtividade, fertilizantes, defensivos fitossanitários e equipamentos em Namiconha - Ribaué, Província de Nampula.
            </p>

            <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Qualidade e Pureza Garantidas para a sua Machamba</span>
            </div>
          </div>

          {/* Quick Links (col 3) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-['Outfit']">
              Navegação Rápida
            </h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <a href="#inicio" className="hover:text-emerald-400 transition-colors">Início</a>
              </li>
              <li>
                <a href="#servicos" className="hover:text-emerald-400 transition-colors">Serviços & Insumos</a>
              </li>
              <li>
                <a href="#produtos" className="hover:text-emerald-400 transition-colors">Nossas Sementes</a>
              </li>
              <li>
                <a href="#calculadora" className="hover:text-emerald-400 transition-colors">Calculadora de Semeadura</a>
              </li>
              <li>
                <a href="#quem-somos" className="hover:text-emerald-400 transition-colors">Quem Somos</a>
              </li>
              <li>
                <a href="#contacto" className="hover:text-emerald-400 transition-colors">Contacto & Localização</a>
              </li>
            </ul>
          </div>

          {/* Direct Contacts matching prompt (col 4) */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-['Outfit']">
              Contacto & Localização
            </h4>
            <div className="space-y-2.5 text-sm">
              <p className="flex items-center gap-2.5 text-stone-300">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <a 
                  id="footer-whatsapp-link"
                  href={`https://wa.me/258${COMPANY_INFO.whatsapp}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-emerald-400 transition-colors font-medium"
                >
                  {COMPANY_INFO.whatsapp} <span className="text-xs text-stone-500">(Whatsapp)</span>
                </a>
              </p>

              <p className="flex items-center gap-2.5 text-stone-300">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a 
                  id="footer-phone-link"
                  href={`tel:${COMPANY_INFO.phoneFull}`} 
                  className="hover:text-emerald-400 transition-colors font-medium"
                >
                  {COMPANY_INFO.phone} <span className="text-xs text-stone-500">(Cell)</span>
                </a>
              </p>

              <p className="flex items-center gap-2.5 text-stone-300">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a 
                  id="footer-email-link"
                  href={`mailto:${COMPANY_INFO.email}`} 
                  className="hover:text-emerald-400 transition-colors font-medium break-all"
                >
                  {COMPANY_INFO.email}
                </a>
              </p>

              <div className="pt-2 border-t border-stone-800/80 text-xs text-stone-400 space-y-1">
                <p className="flex items-center gap-2 text-stone-300 font-medium">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{COMPANY_INFO.location}</span>
                </p>
                <p className="pl-6 text-stone-400">{COMPANY_INFO.province} • {COMPANY_INFO.country}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom micro footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-start">
            {onOpenAdminCatalog && (
              <button
                id="footer-admin-catalog-btn"
                onClick={onOpenAdminCatalog}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 hover:border-stone-700 transition-colors text-xs font-medium cursor-pointer"
                title="Gerir Catálogo"
              >
                <Settings2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Gerir Catálogo</span>
              </button>
            )}
            {onAddNewFeaturedInfo && (
              <button
                id="footer-add-featured-info-btn"
                onClick={onAddNewFeaturedInfo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 hover:border-stone-700 transition-colors text-xs font-medium cursor-pointer"
                title="Adicionar Informação ao Destaque"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Adicionar Informação ao Destaque</span>
              </button>
            )}
            {onOpenFeaturedInfoManager && (
              <button
                id="footer-manage-featured-info-btn"
                onClick={onOpenFeaturedInfoManager}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 hover:border-stone-700 transition-colors text-xs font-medium cursor-pointer"
                title="Gerir Destaques da Campanha"
              >
                <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Gerir Destaques</span>
              </button>
            )}
            <span>
              © {new Date().getFullYear()} Raffa Aliados do Campo. Todos os direitos reservados.
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-stone-400">Foco no Agro • Ganho no Campo</span>
            <button
              id="back-to-top-btn"
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              aria-label="Voltar ao topo da página"
            >
              <span>Topo</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
