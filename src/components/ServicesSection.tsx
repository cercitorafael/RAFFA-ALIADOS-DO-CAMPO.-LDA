import React from 'react';
import { 
  Sprout, 
  Layers, 
  ShieldCheck, 
  Wrench, 
  GraduationCap, 
  CheckCircle, 
  ArrowUpRight 
} from 'lucide-react';
import { SERVICES_DATA } from '../data/agroData';

interface ServicesSectionProps {
  onOpenQuote: (serviceCategory?: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onOpenQuote }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sprout':
        return <Sprout className="w-6 h-6 text-emerald-700" />;
      case 'Layers':
        return <Layers className="w-6 h-6 text-amber-700" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-6 h-6 text-emerald-700" />;
      case 'Wrench':
        return <Wrench className="w-6 h-6 text-amber-700" />;
      case 'GraduationCap':
        return <GraduationCap className="w-6 h-6 text-emerald-700" />;
      default:
        return <Sprout className="w-6 h-6 text-emerald-700" />;
    }
  };

  return (
    <section id="servicos" className="py-16 sm:py-24 bg-stone-100/70 border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Sprout className="w-3.5 h-3.5 text-emerald-700" />
            Nossa Oferta Integrada
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-['Outfit'] tracking-tight">
            Tudo o que a Sua Machamba Precisa para Prosperar
          </h2>
          <p className="text-stone-600 text-base sm:text-lg mt-3 leading-relaxed">
            Disponibilizamos um catálogo completo de insumos de alto padrão agronómico, equipamentos confiáveis e consultoria direta no campo em Ribaué e região.
          </p>
        </div>

        {/* 5 Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {SERVICES_DATA.map((service, index) => (
            <div
              key={service.id}
              id={`service-card-${service.id}`}
              className={`bg-white rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-200/80 hover:border-emerald-500/40 flex flex-col justify-between group ${
                index === 4 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div>
                {/* Header Icon + Category Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                    {getIcon(service.iconName)}
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                    {service.category}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-stone-900 font-['Outfit'] mb-2.5 group-hover:text-emerald-800 transition-colors">
                  {service.title}
                </h3>

                {/* Description */}
                <p className="text-stone-600 text-sm leading-relaxed mb-5">
                  {service.description}
                </p>

                {/* Benefits / List items */}
                <div className="space-y-2 pt-2 border-t border-stone-100 mb-6">
                  {service.benefits.map((benefit, bIndex) => (
                    <div key={bIndex} className="flex items-start gap-2 text-xs sm:text-sm text-stone-700">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Action */}
              <button
                id={`btn-quote-${service.id}`}
                onClick={() => onOpenQuote(service.title)}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-50 hover:bg-emerald-700 text-stone-800 hover:text-white font-semibold text-sm transition-all duration-200 border border-stone-200 hover:border-transparent group/btn"
              >
                <span>Consultar Disponibilidade</span>
                <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover/btn:text-white transition-colors" />
              </button>
            </div>
          ))}
        </div>

        {/* Quick Highlights Bar */}
        <div className="mt-12 bg-emerald-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-xl font-bold font-['Outfit'] text-amber-300">
              Precisa de fornecimento para a sua Associação ou Cooperativa?
            </h4>
            <p className="text-emerald-100 text-sm max-w-2xl">
              Temos condições especiais para encomendas por grosso de sementes, adubos NPK e defensivos para a campanha agrícola em Ribaué, Malema, Lalaua e toda a província de Nampula.
            </p>
          </div>
          <button
            id="services-bulk-quote-btn"
            onClick={() => onOpenQuote('Fornecimento por Grosso / Associação')}
            className="shrink-0 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-6 py-3 rounded-xl transition-colors text-sm shadow-md"
          >
            Falar com a Nossa Equipa
          </button>
        </div>

      </div>
    </section>
  );
};
