import React, { useState } from 'react';
import { 
  Calculator, 
  Sprout, 
  Layers, 
  MessageCircle, 
  HelpCircle, 
  Check, 
  ArrowRight,
  Info,
  Sparkles
} from 'lucide-react';
import { AGRONOMIC_PRESETS, COMPANY_INFO } from '../data/agroData';

interface SeedCalculatorProps {
  onOpenQuote: (customDetails?: string) => void;
}

export const SeedCalculator: React.FC<SeedCalculatorProps> = ({ onOpenQuote }) => {
  const [selectedCropId, setSelectedCropId] = useState<string>('milho');
  const [areaHectares, setAreaHectares] = useState<number>(1);
  const [customArea, setCustomArea] = useState<string>('1');

  const selectedPreset = AGRONOMIC_PRESETS.find((p) => p.id === selectedCropId) || AGRONOMIC_PRESETS[0];

  const currentArea = parseFloat(customArea) > 0 ? parseFloat(customArea) : 1;

  const totalSeedKg = Math.round(selectedPreset.seedRateKgHa * currentArea * 10) / 10;
  const totalBasalNpkKg = Math.round(selectedPreset.basalNpkKgHa * currentArea);
  const totalTopUreaKg = Math.round(selectedPreset.topUreaKgHa * currentArea);

  const quickAreaOptions = [0.5, 1, 2, 5, 10];

  const handleQuickArea = (val: number) => {
    setAreaHectares(val);
    setCustomArea(val.toString());
  };

  const handleCustomAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomArea(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setAreaHectares(parsed);
    }
  };

  const generateWhatsAppQuoteText = () => {
    const text = `Olá Raffa Aliados do Campo, usei a Calculadora no site:
🌱 Cultura: ${selectedPreset.name}
📍 Área: ${currentArea} hectare(s)
📦 Sementes estimadas: ${totalSeedKg} kg
🌾 Adubo de Fundo (NPK): ${totalBasalNpkKg} kg
⚡ Adubo de Cobertura (Ureia): ${totalTopUreaKg} kg

Gostaria de saber o orçamento total com entrega para Namiconha / Ribaué.`;
    return encodeURIComponent(text);
  };

  return (
    <section id="calculadora" className="py-16 sm:py-24 bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900 text-white relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 bg-emerald-800/80 border border-emerald-600/50 text-emerald-200 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            Ferramenta para o Produtor
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Outfit'] tracking-tight">
            Calculadora de Sementes & Adubação
          </h2>
          <p className="text-emerald-100 text-base sm:text-lg mt-2">
            Descubra a quantidade ideal de sementes certificadas e fertilizantes recomendada para o tamanho da sua machamba em Ribaué e Nampula.
          </p>
        </div>

        {/* Calculator Main Grid */}
        <div className="bg-stone-900/90 rounded-3xl border border-emerald-700/50 shadow-2xl p-6 sm:p-10 backdrop-blur-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Controls Column */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Step 1: Crop Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2.5">
                1. Selecione a Cultura / Semente:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {AGRONOMIC_PRESETS.map((crop) => (
                  <button
                    key={crop.id}
                    id={`calc-crop-btn-${crop.id}`}
                    type="button"
                    onClick={() => setSelectedCropId(crop.id)}
                    className={`p-3 rounded-xl text-left border text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      selectedCropId === crop.id
                        ? 'bg-emerald-700 border-amber-400 text-white shadow-md shadow-emerald-950/40 ring-2 ring-amber-400/40'
                        : 'bg-stone-800/80 border-stone-700 text-stone-300 hover:bg-stone-800 hover:text-white'
                    }`}
                  >
                    <span>{crop.name}</span>
                    {selectedCropId === crop.id && (
                      <Check className="w-3.5 h-3.5 text-amber-400 self-end mt-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Area Input */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300">
                  2. Área da Machamba (Hectares):
                </label>
                <span className="text-xs text-amber-300 font-semibold">1 ha = 10.000 m²</span>
              </div>

              {/* Quick Area Pill Buttons */}
              <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
                {quickAreaOptions.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => handleQuickArea(area)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      currentArea === area
                        ? 'bg-amber-500 text-stone-950 font-extrabold'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    {area} ha
                  </button>
                ))}
              </div>

              {/* Number input */}
              <div className="relative">
                <input
                  id="calc-area-input"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1000"
                  value={customArea}
                  onChange={handleCustomAreaChange}
                  className="w-full bg-stone-800 border border-emerald-600/50 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-semibold">
                  Hectares
                </span>
              </div>
            </div>

            {/* Practical Advice Note */}
            <div className="bg-emerald-950/70 border border-emerald-800 rounded-2xl p-4 text-xs text-emerald-200 space-y-1.5">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                Recomendação Técnica de Campo:
              </div>
              <p className="leading-relaxed">
                {selectedPreset.advice}
              </p>
              <div className="text-emerald-300/80 pt-1">
                <span className="font-semibold text-white">Espaçamento sugerido:</span> {selectedPreset.spacing}
              </div>
            </div>

          </div>

          {/* Results Summary Column */}
          <div className="lg:col-span-6 bg-stone-950/80 rounded-2xl border border-emerald-600/40 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
                <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Estimativa de Insumos Necessários
                </h3>
                <span className="text-xs bg-emerald-900 text-emerald-300 font-bold px-2.5 py-1 rounded-md">
                  Para {currentArea} ha
                </span>
              </div>

              {/* Metric 1: Seed Requirement */}
              <div className="space-y-4">
                <div className="bg-stone-900 p-4 rounded-xl border border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-900/60 flex items-center justify-center text-emerald-300">
                      <Sprout className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-stone-400 font-medium">Sementes Certificadas</div>
                      <div className="text-sm font-bold text-white">{selectedPreset.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-amber-400 font-['Outfit']">
                      {totalSeedKg} <span className="text-xs font-normal text-stone-400">kg</span>
                    </div>
                    <div className="text-[11px] text-stone-400">
                      {totalSeedKg >= 25 ? `~ ${Math.ceil(totalSeedKg / 25)} saco(s) de 25kg` : `${totalSeedKg} kg fracionado`}
                    </div>
                  </div>
                </div>

                {/* Metric 2: Basal NPK Fertilizer */}
                <div className="bg-stone-900 p-4 rounded-xl border border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-900/40 flex items-center justify-center text-amber-300">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-stone-400 font-medium">Adubo de Fundo (Plantio)</div>
                      <div className="text-sm font-bold text-white">NPK 12-24-12 / 10-20-10</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-white font-['Outfit']">
                      {totalBasalNpkKg} <span className="text-xs font-normal text-stone-400">kg</span>
                    </div>
                    <div className="text-[11px] text-stone-400">
                      {totalBasalNpkKg > 0 ? `~ ${Math.ceil(totalBasalNpkKg / 50)} saco(s) de 50kg` : 'Sob demanda'}
                    </div>
                  </div>
                </div>

                {/* Metric 3: Top-Dressing Urea */}
                {totalTopUreaKg > 0 && (
                  <div className="bg-stone-900 p-4 rounded-xl border border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-900/40 flex items-center justify-center text-blue-300">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs text-stone-400 font-medium">Adubo de Cobertura</div>
                        <div className="text-sm font-bold text-white">Ureia 46% N</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-white font-['Outfit']">
                        {totalTopUreaKg} <span className="text-xs font-normal text-stone-400">kg</span>
                      </div>
                      <div className="text-[11px] text-stone-400">
                        ~ {Math.ceil(totalTopUreaKg / 50)} saco(s) de 50kg
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons for calculated results */}
            <div className="space-y-2.5 pt-2 border-t border-stone-800">
              <a
                id="calc-send-whatsapp-btn"
                href={`https://wa.me/258${COMPANY_INFO.whatsapp}?text=${generateWhatsAppQuoteText()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Pedir Cotação deste Cálculo no WhatsApp</span>
              </a>

              <button
                id="calc-open-modal-btn"
                onClick={() => onOpenQuote(`${selectedPreset.name} (${currentArea} ha) - Sementes: ${totalSeedKg}kg, NPK: ${totalBasalNpkKg}kg, Ureia: ${totalTopUreaKg}kg`)}
                className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Enviar formulário formal de cotação</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
