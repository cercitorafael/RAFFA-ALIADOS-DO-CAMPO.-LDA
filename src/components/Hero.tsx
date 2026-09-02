import React from 'react';
import { 
  Sprout, 
  MessageCircle, 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  Mail,
  Phone,
  ShieldCheck, 
  Sparkles,
  PhoneCall,
  Check
} from 'lucide-react';
import { COMPANY_INFO } from '../data/agroData';
import { RaffaLogo } from './RaffaLogo';
import heroBannerImg from '../assets/images/raffa_official_banner_1788272775517.jpg';

interface HeroProps {
  onOpenQuote: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenQuote }) => {
  const bannerServices = [
    'Sementes',
    'Fertilizantes',
    'Agroquímicos',
    'Instrumentos e Equipamentos Agrícolas',
    'Prestação de Serviços e Outros'
  ];

  return (
    <section id="inicio" className="relative overflow-hidden bg-stone-900 text-white">
      {/* Background Banner Image with Photographic Depth & Clean Overlays */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBannerImg}
          alt="RAFFA Aliados do Campo - Banner Oficial"
          className="w-full h-full object-cover object-center lg:object-right-top filter brightness-95 scale-100"
          referrerPolicy="no-referrer"
        />
        {/* Gradients to guarantee 100% text readability and high contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/80 to-stone-950/40 lg:via-stone-950/60 lg:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-transparent to-stone-950/30" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 pt-10 pb-12 lg:pt-16 lg:pb-20">
        
        {/* Main Grid: Left content + Right Banner Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Official Logo + Title + Call to action */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Top Official Logo Badge from Banner */}
            <div className="inline-flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/40">
              <RaffaLogo size="sm" showText={true} theme="color" />
            </div>

            {/* Main Headline styled exactly as in the banner */}
            <div>
              <div className="inline-block bg-amber-400 text-stone-950 px-4 py-1.5 rounded-lg text-2xl sm:text-4xl lg:text-5xl font-black font-['Outfit'] tracking-tight shadow-md mb-2">
                Foco no Agro,
              </div>
              <div className="block">
                <span className="inline-block bg-amber-400 text-stone-950 px-4 py-1.5 rounded-lg text-2xl sm:text-4xl lg:text-5xl font-black font-['Outfit'] tracking-tight shadow-md">
                  Ganho no Campo
                </span>
              </div>
            </div>

            {/* Subtitle / Value Proposition */}
            <p className="text-base sm:text-lg text-stone-100 font-medium max-w-xl leading-relaxed drop-shadow-md bg-stone-950/50 backdrop-blur-sm p-3.5 rounded-xl border border-white/10">
              A sua parceria sólida para colheitas abundantes. Sementes certificadas de alto rendimento, fertilizantes, defensivos agrícolas e assistência técnica especializada em Ribaué e em toda a região de Nampula.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
              <button
                id="hero-primary-quote-btn"
                onClick={onOpenQuote}
                className="inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-stone-950 font-black px-7 py-3.5 rounded-xl shadow-xl shadow-amber-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] text-base"
              >
                <span>Solicitar Orçamento</span>
                <ArrowRight className="w-5 h-5 text-stone-950" />
              </button>

              <a
                id="hero-whatsapp-direct-btn"
                href={`https://wa.me/258${COMPANY_INFO.whatsapp}?text=Olá%20Raffa%20Aliados%20do%20Campo,%20vi%20o%20vosso%20banner%20e%20gostaria%20de%20um%20orçamento`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-emerald-700/90 hover:bg-emerald-600 border border-emerald-400/50 text-white font-bold px-6 py-3.5 rounded-xl backdrop-blur-md transition-all hover:border-emerald-300 text-base shadow-lg"
              >
                <MessageCircle className="w-5 h-5 text-emerald-200" />
                <span>WhatsApp: {COMPANY_INFO.whatsapp}</span>
              </a>
            </div>

          </div>

          {/* Right Column: Green Services Pill Card matching Banner Right-Side */}
          <div className="lg:col-span-5">
            <div className="bg-emerald-900/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border-2 border-emerald-500/50 shadow-2xl relative overflow-hidden text-white">
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-700/80 pb-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Produtos & Serviços
                  </div>
                  <span className="bg-amber-400 text-stone-950 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                    Ribaué • Nampula
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {bannerServices.map((service, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-600/30 hover:border-emerald-400/60 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-amber-400/20 border border-amber-400 flex items-center justify-center text-amber-400 shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="font-bold text-sm sm:text-base text-emerald-50">
                        {service}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Micro CTA */}
                <div className="pt-2">
                  <button
                    onClick={onOpenQuote}
                    className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs sm:text-sm tracking-wide uppercase shadow-md transition-all active:scale-98"
                  >
                    Consultar Preços & Disponibilidade
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Banner Contact Bar matching the bottom strip of the official banner */}
        <div className="mt-8 pt-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-xl border border-stone-200 text-stone-900 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            
            {/* Phone Contacts */}
            <div className="flex items-center gap-3 bg-emerald-50 md:bg-transparent p-2 md:p-0 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Phone className="w-4 h-4 text-emerald-100" />
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase text-emerald-800 tracking-wider">Contacte-nos</span>
                <span className="font-extrabold text-xs sm:text-sm text-stone-900 font-mono">
                  +258 84 836 1130 / 87 009 5149
                </span>
              </div>
            </div>

            {/* Email Contact */}
            <div className="flex items-center gap-3 bg-emerald-50 md:bg-transparent p-2 md:p-0 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Mail className="w-4 h-4 text-emerald-100" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-black uppercase text-emerald-800 tracking-wider">Email Oficial</span>
                <a 
                  href={`mailto:${COMPANY_INFO.email}`} 
                  className="font-bold text-xs sm:text-sm text-stone-900 hover:text-emerald-700 truncate block transition-colors"
                >
                  {COMPANY_INFO.email}
                </a>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3 bg-emerald-50 md:bg-transparent p-2 md:p-0 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shrink-0 shadow-sm">
                <MapPin className="w-4 h-4 text-emerald-100" />
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase text-emerald-800 tracking-wider">Localização</span>
                <span className="font-extrabold text-xs sm:text-sm text-stone-900">
                  Namiconha - Ribaué, Nampula
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

