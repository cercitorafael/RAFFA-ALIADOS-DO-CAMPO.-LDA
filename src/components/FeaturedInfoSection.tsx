import React, { useState } from 'react';
import { 
  Megaphone, 
  Sparkles, 
  ArrowRight, 
  MessageCircle, 
  Clock, 
  Tag, 
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { FeaturedInfoItem } from '../types';
import { COMPANY_INFO } from '../data/agroData';

interface FeaturedInfoSectionProps {
  items: FeaturedInfoItem[];
  onOpenQuote: (productOrSubject?: string) => void;
}

export const FeaturedInfoSection: React.FC<FeaturedInfoSectionProps> = ({
  items,
  onOpenQuote,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeItems = items.filter((item) => item.isActive);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getStyleTheme = (style: FeaturedInfoItem['highlightStyle']) => {
    switch (style) {
      case 'amber':
        return {
          cardBorder: 'border-amber-400/80 hover:border-amber-500',
          badgeBg: 'bg-amber-400 text-stone-950 border-amber-500/30',
          indicator: 'bg-amber-500',
          lightBg: 'bg-amber-50/50',
          btnBg: 'bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold',
        };
      case 'red':
        return {
          cardBorder: 'border-red-300 hover:border-red-500',
          badgeBg: 'bg-red-600 text-white border-red-700/30',
          indicator: 'bg-red-500',
          lightBg: 'bg-red-50/40',
          btnBg: 'bg-red-600 hover:bg-red-700 text-white font-bold',
        };
      case 'blue':
        return {
          cardBorder: 'border-sky-300 hover:border-sky-500',
          badgeBg: 'bg-sky-600 text-white border-sky-700/30',
          indicator: 'bg-sky-500',
          lightBg: 'bg-sky-50/40',
          btnBg: 'bg-sky-700 hover:bg-sky-800 text-white font-bold',
        };
      case 'emerald':
      default:
        return {
          cardBorder: 'border-emerald-500/50 hover:border-emerald-600',
          badgeBg: 'bg-emerald-700 text-white border-emerald-800/30',
          indicator: 'bg-emerald-500',
          lightBg: 'bg-emerald-50/40',
          btnBg: 'bg-emerald-700 hover:bg-emerald-800 text-white font-bold',
        };
    }
  };

  return (
    <section id="informacoes-destaque" className="py-12 sm:py-16 bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 text-white relative overflow-hidden border-b border-stone-800">
      
      {/* Subtle background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-400 text-stone-950 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2.5 shadow-md">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Informações & Comunicados em Destaque</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black font-['Outfit'] tracking-tight text-white">
            Destaques da Campanha & Avisos Oficiais
          </h2>
          <p className="text-stone-300 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            Consulte as informações mais importantes da época: chegada de novos lotes de sementes certificadas, alertas fitossanitários e suporte na machamba em Ribaué.
          </p>
        </div>

        {/* Featured Information Cards Grid */}
        {activeItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {activeItems.map((item) => {
              const theme = getStyleTheme(item.highlightStyle);
              const isExpanded = expandedId === item.id;

              return (
                <div
                  key={item.id}
                  id={`featured-info-card-${item.id}`}
                  className={`bg-stone-900/90 backdrop-blur-md rounded-3xl overflow-hidden border-2 ${theme.cardBorder} shadow-xl flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative group`}
                >
                  <div>
                    {/* Top Image or Banner Header */}
                    {item.imageUrl && (
                      <div className="relative h-44 sm:h-48 overflow-hidden bg-stone-950">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/30 to-transparent" />
                        
                        {/* Badges on Image */}
                        <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                          <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-lg shadow-md border ${theme.badgeBg}`}>
                            {item.badgeText || '⭐ Destaque'}
                          </span>
                          {item.dateText && (
                            <span className="text-[10px] font-bold text-stone-200 bg-stone-950/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-stone-400" />
                              {item.dateText}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="p-6">
                      
                      {/* If no image, show badge inside card header */}
                      {!item.imageUrl && (
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-lg shadow-sm border ${theme.badgeBg}`}>
                            {item.badgeText || '⭐ Destaque'}
                          </span>
                          {item.dateText && (
                            <span className="text-[11px] font-medium text-stone-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-stone-500" />
                              {item.dateText}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-2">
                        <Tag className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{item.categoryLabel || item.category.toUpperCase()}</span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-black font-['Outfit'] text-white leading-snug mb-2.5 group-hover:text-amber-300 transition-colors">
                        {item.title}
                      </h3>

                      <p className="text-stone-300 text-xs sm:text-sm leading-relaxed mb-3">
                        {item.summary}
                      </p>

                      {/* Expandable Details */}
                      {item.details && (
                        <div className="pt-2">
                          <button
                            onClick={() => toggleExpand(item.id)}
                            className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 transition-colors"
                          >
                            <span>{isExpanded ? 'Menos detalhes' : 'Ver recomendações completas'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {isExpanded && (
                            <div className="mt-2.5 p-3 rounded-xl bg-stone-950/80 border border-stone-800 text-xs text-stone-300 leading-relaxed animate-in fade-in duration-200">
                              <p>{item.details}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="p-6 pt-0 border-t border-stone-800/80 mt-3 pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    
                    {/* Primary Action Button */}
                    {item.actionType === 'whatsapp' && (
                      <a
                        href={`https://wa.me/258${COMPANY_INFO.whatsapp}?text=${encodeURIComponent(
                          item.actionUrlOrMessage || `Olá Raffa Aliados do Campo, vi o destaque: ${item.title}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 ${theme.btnBg}`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{item.actionText || 'Saber Mais no WhatsApp'}</span>
                      </a>
                    )}

                    {item.actionType === 'quote' && (
                      <button
                        onClick={() => onOpenQuote(item.title)}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 ${theme.btnBg}`}
                      >
                        <span>{item.actionText || 'Pedir Cotação da Campanha'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {item.actionType === 'none' && (
                      <div className="text-[11px] text-stone-400 italic">
                        Comunicado informativo para produtores
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-4 bg-stone-900/60 rounded-3xl border border-stone-800">
            <Megaphone className="w-12 h-12 text-stone-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-stone-200">
              Nenhuma Informação Ativa no Destaque
            </h3>
            <p className="text-stone-400 text-xs sm:text-sm max-w-md mx-auto mt-1">
              Novos comunicados e destaques de campanha podem ser adicionados através do painel Gerir Catálogo.
            </p>
          </div>
        )}

      </div>
    </section>
  );
};
