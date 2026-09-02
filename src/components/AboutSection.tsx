import React from 'react';
import { 
  Users, 
  ShieldCheck, 
  MapPin, 
  HeartHandshake, 
  Sprout, 
  Award, 
  Sparkles, 
  CheckCircle2,
  Quote
} from 'lucide-react';
import { COMPANY_INFO, TESTIMONIALS_DATA } from '../data/agroData';

interface AboutSectionProps {
  onOpenQuote: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ onOpenQuote }) => {
  return (
    <section id="quem-somos" className="py-16 sm:py-24 bg-stone-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Main 2-Column About layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
          
          {/* Left Column: Image showcase with badge */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-stone-200 bg-emerald-950">
              <img
                src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80"
                alt="Família e agricultores Raffa Aliados do Campo"
                className="w-full h-80 sm:h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
                  <MapPin className="w-4 h-4" />
                  Namiconha, Ribaué - Nampula
                </div>
                <h4 className="text-xl font-bold font-['Outfit']">
                  Ao Lado de Quem Faz a Terra Produzir
                </h4>
              </div>
            </div>

            {/* Floating Experience Badge */}
            <div className="absolute -bottom-6 -right-2 sm:-right-6 bg-white rounded-2xl p-4 shadow-xl border border-stone-200 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-lg">
                100%
              </div>
              <div>
                <div className="text-xs font-bold text-stone-900">Compromisso com o Campo</div>
                <div className="text-xs text-stone-500 font-medium">Sementes Certificadas</div>
              </div>
            </div>
          </div>

          {/* Right Column: Narrative text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              Quem Somos
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-['Outfit'] tracking-tight">
              A Sua Parceria de Confiança para o Sucesso Agrícola
            </h2>

            <p className="text-stone-700 text-base sm:text-lg leading-relaxed">
              A <strong className="text-emerald-900 font-bold">Raffa Aliados do Campo</strong> nasceu com uma missão clara e apaixonada: capacitar os agricultores, produtores familiares e empresas agrícolas de Ribaué e de toda a Província de Nampula com os melhores insumos do mercado.
            </p>

            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              Acreditamos que o verdadeiro desenvolvimento de Moçambique começa na terra fértil. Por isso, selecionamos rigorosamente cada lote de sementes de milho, feijão, arroz, hortícolas e gergelim, garantindo alta germinação, resistência a pragas e adaptação comprovada ao nosso ecossistema.
            </p>

            {/* 4 Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-sm flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Sementes Testadas</h4>
                  <p className="text-xs text-stone-600 mt-0.5">Alto poder germinativo e pureza física garantida.</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-sm flex items-start gap-3">
                <HeartHandshake className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Proximidade Real</h4>
                  <p className="text-xs text-stone-600 mt-0.5">Atendimento amigo e transparente em Namiconha.</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-sm flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Preços Justos</h4>
                  <p className="text-xs text-stone-600 mt-0.5">Condições que respeitam o orçamento do produtor.</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-sm flex items-start gap-3">
                <Sprout className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Orientação no Terreno</h4>
                  <p className="text-xs text-stone-600 mt-0.5">Dicas de compasso, adubação e época de plantio.</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                id="about-cta-quote-btn"
                onClick={onOpenQuote}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all text-sm inline-flex items-center gap-2"
              >
                <span>Fazer Parte dos Produtores Parceiros</span>
              </button>
            </div>

          </div>

        </div>

        {/* Testimonials / Agro Community section */}
        <div className="mt-16 pt-12 border-t border-stone-200">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl font-bold text-stone-900 font-['Outfit']">
              A Confiança de Quem Planta e Colhe Connosco
            </h3>
            <p className="text-stone-600 text-sm mt-1">
              Testemunhos reais de produtores que usam sementes e insumos da Raffa Aliados do Campo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS_DATA.map((t, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <Quote className="w-8 h-8 text-emerald-600/30 mb-3" />
                  <p className="text-stone-700 text-sm italic leading-relaxed mb-4">
                    "{t.text}"
                  </p>
                </div>
                <div className="pt-3 border-t border-stone-100">
                  <div className="font-bold text-stone-900 text-sm font-['Outfit']">{t.name}</div>
                  <div className="text-xs text-stone-500">{t.role}</div>
                  <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    {t.crop}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
