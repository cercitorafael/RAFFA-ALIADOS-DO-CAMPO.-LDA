import React, { useState } from 'react';
import { 
  Phone, 
  MessageCircle, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle2, 
  Sprout, 
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { COMPANY_INFO } from '../data/agroData';
import { submitContactToCloud } from '../lib/supabase';

interface ContactSectionProps {
  onOpenQuote: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onOpenQuote }) => {
  const [quickMsg, setQuickMsg] = useState({
    name: '',
    phone: '',
    message: ''
  });
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleQuickSend = (e: React.FormEvent) => {
    e.preventDefault();
    // Asynchronously record message in Supabase cloud
    submitContactToCloud({
      name: quickMsg.name || 'Cliente Website',
      phone: quickMsg.phone,
      message: quickMsg.message,
    }).catch(err => console.warn('[Supabase] Could not log message:', err));

    const text = encodeURIComponent(
      `Olá Raffa Aliados do Campo, meu nome é ${quickMsg.name || 'Cliente'} (${quickMsg.phone || 'S/N'}).\n\nMensagem: ${quickMsg.message}`
    );
    window.open(`https://wa.me/258${COMPANY_INFO.whatsapp}?text=${text}`, '_blank');
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 5000);
  };

  const faqItems = [
    {
      q: 'Onde fica localizada a loja em Ribaué?',
      a: 'Estamos sediados em Namiconha, Distrito de Ribaué, Província de Nampula, com fácil acesso para produtores de toda a região.'
    },
    {
      q: 'As sementes possuem garantia de germinação?',
      a: 'Sim! Comercializamos exclusivamente sementes certificadas e selecionadas com índice de pureza e poder germinativo rigorosamente testados.'
    },
    {
      q: 'Fazem entrega para outros distritos da província de Nampula?',
      a: 'Sim, realizamos fornecimento programado para agricultores, associações e cooperativas em Ribaué, Malema, Lalaua, Nampula e regiões vizinhas.'
    },
    {
      q: 'Vendem em quantidades pequenas e por grosso?',
      a: 'Sim, atendemos desde o pequeno produtor familiar (embalagens a partir de 1kg/envelopes) até grandes machambas comerciais com sacos de 25kg e 50kg.'
    }
  ];

  return (
    <section id="contacto" className="py-16 sm:py-24 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Phone className="w-3.5 h-3.5 text-emerald-700" />
            Canais de Atendimento
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-['Outfit'] tracking-tight">
            Fale Connosco & Visite-nos em Namiconha - Ribaué
          </h2>
          <p className="text-stone-600 text-base sm:text-lg mt-2">
            Estamos prontos para atender a sua encomenda, tirar dúvidas sobre variedades e preparar o seu orçamento.
          </p>
        </div>

        {/* 4 Direct Contact Cards matching user HTML */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          
          {/* Card 1: WhatsApp */}
          <a
            id="contact-card-whatsapp"
            href={`https://wa.me/258${COMPANY_INFO.whatsapp}?text=Olá%20Raffa%20Aliados%20do%20Campo`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-50/60 hover:bg-emerald-100/80 border border-emerald-200 rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">WhatsApp Principal</div>
              <div className="text-xl font-black text-stone-900 font-['Outfit']">{COMPANY_INFO.whatsapp}</div>
              <p className="text-xs text-stone-600 mt-2">
                Atendimento rápido para cotações e consultas de stock.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-200/60 text-xs font-bold text-emerald-800 flex items-center gap-1">
              <span>Abrir WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* Card 2: Phone Call */}
          <a
            id="contact-card-phone"
            href={`tel:${COMPANY_INFO.phoneFull}`}
            className="bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-stone-900 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Chamadas / Cel</div>
              <div className="text-xl font-black text-stone-900 font-['Outfit']">{COMPANY_INFO.phone}</div>
              <p className="text-xs text-stone-600 mt-2">
                Linha direta para contacto por voz e pedidos urgentes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-200 text-xs font-bold text-stone-900 flex items-center gap-1">
              <span>Ligar Agora</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* Card 3: Email */}
          <a
            id="contact-card-email"
            href={`mailto:${COMPANY_INFO.email}`}
            className="bg-amber-50/50 hover:bg-amber-100/70 border border-amber-200 rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1">Correio Electrónico</div>
              <div className="text-sm font-bold text-stone-900 break-all">{COMPANY_INFO.email}</div>
              <p className="text-xs text-stone-600 mt-2">
                Envio de propostas e parcerias institucionais.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200/60 text-xs font-bold text-amber-900 flex items-center gap-1">
              <span>Escrever Email</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* Card 4: Location */}
          <div className="bg-stone-900 text-white rounded-2xl p-6 flex flex-col justify-between shadow-md">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">Localização Física</div>
              <div className="text-lg font-bold font-['Outfit'] text-white">{COMPANY_INFO.location}</div>
              <div className="text-xs text-stone-300 mt-0.5">{COMPANY_INFO.province} • {COMPANY_INFO.country}</div>
              <div className="text-[11px] text-emerald-200/80 mt-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{COMPANY_INFO.openingHours}</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-800 text-xs font-semibold text-amber-300">
              Ponto de Atendimento no Campo
            </div>
          </div>

        </div>

        {/* 2-Column: Quick Message Form & FAQs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Quick Message Card */}
          <div className="lg:col-span-6 bg-stone-50 border border-stone-200/90 rounded-3xl p-6 sm:p-8">
            <h3 className="text-xl font-bold text-stone-900 font-['Outfit'] mb-1">
              Envie uma Mensagem Rápida
            </h3>
            <p className="text-stone-600 text-xs sm:text-sm mb-6">
              Nossa equipa em Ribaué responde prontamente a todas as mensagens.
            </p>

            {sentSuccess && (
              <div className="mb-4 p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Mensagem preparada e enviada para o WhatsApp!</span>
              </div>
            )}

            <form onSubmit={handleQuickSend} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Seu Nome:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alberto Macuácua"
                  value={quickMsg.name}
                  onChange={(e) => setQuickMsg({ ...quickMsg, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Seu Telefone ou WhatsApp:
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: 870000000"
                  value={quickMsg.phone}
                  onChange={(e) => setQuickMsg({ ...quickMsg, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Como podemos ajudar?
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Gostaria de saber o preço do saco de semente de milho PAN 53 e do adubo 12-24-12..."
                  value={quickMsg.message}
                  onChange={(e) => setQuickMsg({ ...quickMsg, message: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none text-stone-900 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Mensagem</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenQuote}
                  className="py-3 px-4 bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold rounded-xl text-xs transition-colors"
                >
                  Orçamento Completo
                </button>
              </div>
            </form>
          </div>

          {/* FAQs Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="mb-2">
              <h3 className="text-xl font-bold text-stone-900 font-['Outfit'] flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-700" />
                Perguntas Frequentes do Produtor
              </h3>
              <p className="text-stone-500 text-xs mt-0.5">
                Dúvidas comuns sobre encomendas, entregas e sementes em Ribaué.
              </p>
            </div>

            <div className="space-y-3">
              {faqItems.map((faq, index) => (
                <div
                  key={index}
                  className="bg-stone-50 border border-stone-200/90 rounded-2xl p-5 hover:border-emerald-500/40 transition-colors"
                >
                  <h4 className="text-sm font-bold text-stone-900 mb-1.5 flex items-start gap-2">
                    <span className="text-emerald-700 font-black">•</span>
                    <span>{faq.q}</span>
                  </h4>
                  <p className="text-stone-600 text-xs sm:text-sm leading-relaxed pl-3.5">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
