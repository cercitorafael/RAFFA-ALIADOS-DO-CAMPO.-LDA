import React, { useState } from 'react';
import { Calendar, Sprout, CloudRain, Sun, ArrowRight, Calculator, CheckCircle2 } from 'lucide-react';

interface AgroCalendarSectionProps {
  onOpenQuote: (productName?: string) => void;
}

type ActivityPhase = 'prep' | 'plant' | 'care' | 'harvest' | null;

interface CropSchedule {
  id: string;
  name: string;
  seasonType: 'rainy' | 'dry' | 'both';
  seasonLabel: string;
  varieties: string;
  tip: string;
  months: ActivityPhase[]; // 12 entries: Jan -> Dez
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const CROP_CALENDAR: CropSchedule[] = [
  {
    id: 'milho',
    name: 'Milho (Híbrido & OPV)',
    seasonType: 'rainy',
    seasonLabel: 'Época Chuvosa (Principal)',
    varieties: 'PAN 53, PAN 67, SC 513, Matuba',
    tip: 'Semear logo após as primeiras chuvas regulares em Nov/Dez. Aplicar NPK 12-24-12 na sementeira e Ureia aos 25-35 dias.',
    months: ['care', 'care', 'harvest', 'harvest', 'harvest', null, null, null, 'prep', 'prep', 'plant', 'plant'],
  },
  {
    id: 'feijao-manteiga',
    name: 'Feijão Manteiga & Nhemba',
    seasonType: 'both',
    seasonLabel: '1ª Época & 2ª Época (Fresco)',
    varieties: 'Manteiga, Calima, Nhemba IT-16',
    tip: 'Em Ribaué dá excelente rendimento na 2ª época (Fev-Mar) aproveitando a humidade residual sem excesso de chuvas na colheita.',
    months: ['plant', 'plant', 'care', 'care', 'harvest', 'harvest', null, null, null, 'prep', 'plant', 'plant'],
  },
  {
    id: 'feijao-boer',
    name: 'Feijão Boer (Caxoco)',
    seasonType: 'rainy',
    seasonLabel: 'Ciclo Longo / Consórcio',
    varieties: 'Feijão Boer Selecionado',
    tip: 'Muito resistente à seca. Pode ser consorciado com o milho em Nov/Dez e colhido entre Julho e Setembro.',
    months: ['care', 'care', 'care', 'care', 'care', 'care', 'harvest', 'harvest', 'harvest', 'prep', 'plant', 'plant'],
  },
  {
    id: 'arroz',
    name: 'Arroz (Sequeiro & Baixa)',
    seasonType: 'rainy',
    seasonLabel: 'Época Chuvosa',
    varieties: 'Limpopo (ITA 312), Nélica 4, Chibi',
    tip: 'Preparar os alfobres em Novembro e fazer o transplante em Dez/Jan quando houver boa lâmina de água ou humidade.',
    months: ['plant', 'care', 'care', 'harvest', 'harvest', null, null, null, null, 'prep', 'plant', 'plant'],
  },
  {
    id: 'gergelim',
    name: 'Gergelim Branco Exportação',
    seasonType: 'rainy',
    seasonLabel: 'Cultura de Rendimento',
    varieties: 'Lindi White, Nicarágua',
    tip: 'Semear entre Dezembro e Fevereiro em solos bem drenados. Evitar encharcamento e colher antes das cápsulas abrirem.',
    months: ['plant', 'plant', 'care', 'harvest', 'harvest', null, null, null, null, null, 'prep', 'plant'],
  },
  {
    id: 'horticolas',
    name: 'Hortícolas (Tomate, Repolho, Cebola)',
    seasonType: 'dry',
    seasonLabel: 'Época Fresca / Regadio (Todo o Ano)',
    varieties: 'Tomate Roma VF / Rio Grande, Gloria F1, Cebola Red Creole',
    tip: 'O pico de qualidade e menor incidência de fungos em Ribaué ocorre entre Março e Setembro com rega controlada.',
    months: ['prep', 'prep', 'plant', 'plant', 'plant', 'care', 'harvest', 'harvest', 'harvest', 'harvest', 'prep', 'prep'],
  },
];

const PHASE_STYLES: Record<Exclude<ActivityPhase, null>, { label: string; badge: string; cell: string }> = {
  prep: {
    label: 'Preparo do Solo',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    cell: 'bg-amber-400/90 text-stone-950',
  },
  plant: {
    label: 'Sementeira / Transplante',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    cell: 'bg-emerald-600 text-white',
  },
  care: {
    label: 'Adubação & Controlo',
    badge: 'bg-sky-100 text-sky-900 border-sky-300',
    cell: 'bg-sky-500 text-white',
  },
  harvest: {
    label: 'Colheita & Celeiro',
    badge: 'bg-orange-100 text-orange-900 border-orange-300',
    cell: 'bg-orange-500 text-white',
  },
};

const PHASE_SHORT: Record<Exclude<ActivityPhase, null>, string> = {
  prep: 'Prep',
  plant: 'Sem',
  care: 'Trat',
  harvest: 'Colh',
};

export const AgroCalendarSection: React.FC<AgroCalendarSectionProps> = ({ onOpenQuote }) => {
  const [filterSeason, setFilterSeason] = useState<'all' | 'rainy' | 'dry'>('all');
  const [selectedCropId, setSelectedCropId] = useState<string>('milho');

  const visibleCrops = CROP_CALENDAR.filter(
    (crop) => filterSeason === 'all' || crop.seasonType === filterSeason || crop.seasonType === 'both'
  );

  const activeCrop = CROP_CALENDAR.find((c) => c.id === selectedCropId) || CROP_CALENDAR[0];

  return (
    <section id="calendario" className="py-16 sm:py-24 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              Planeamento Agrícola — Ribaué & Nampula
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-['Outfit'] tracking-tight">
              Calendário Agrícola da Região
            </h2>
            <p className="text-stone-600 text-base sm:text-lg mt-2 max-w-2xl">
              Saiba a melhor janela de preparação da terra, sementeira, adubação e colheita para o clima de Ribaué e Namiconha.
            </p>
          </div>

          {/* Season Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterSeason('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterSeason === 'all'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Todas as Culturas
            </button>
            <button
              type="button"
              onClick={() => setFilterSeason('rainy')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterSeason === 'rainy'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>Época Chuvosa</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterSeason('dry')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterSeason === 'dry'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Época Fresca / Regadio</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2.5 mb-6">
          {(Object.keys(PHASE_STYLES) as Array<Exclude<ActivityPhase, null>>).map((phaseKey) => (
            <span
              key={phaseKey}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${PHASE_STYLES[phaseKey].badge}`}
            >
              <span className={`w-2.5 h-2.5 rounded-sm ${PHASE_STYLES[phaseKey].cell}`} />
              {PHASE_STYLES[phaseKey].label}
            </span>
          ))}
        </div>

        {/* Responsive Calendar Matrix */}
        <div className="bg-stone-50 border border-stone-200 rounded-3xl overflow-hidden shadow-sm mb-8">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left border-collapse">
              <thead>
                <tr className="bg-emerald-950 text-white text-xs">
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider w-56">
                    Cultura & Semente
                  </th>
                  {MONTHS.map((m) => (
                    <th key={m} className="py-3.5 px-1.5 text-center font-bold uppercase tracking-wider">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white">
                {visibleCrops.map((crop) => {
                  const isActive = crop.id === activeCrop.id;
                  return (
                    <tr
                      key={crop.id}
                      onClick={() => setSelectedCropId(crop.id)}
                      className={`cursor-pointer transition-colors ${
                        isActive ? 'bg-emerald-50/80' : 'hover:bg-stone-50'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-sm text-stone-900 flex items-center gap-2">
                          <Sprout className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-700' : 'text-stone-400'}`} />
                          <span>{crop.name}</span>
                        </div>
                        <div className="text-[11px] text-stone-500 pl-6">{crop.seasonLabel}</div>
                      </td>
                      {crop.months.map((phase, idx) => (
                        <td key={idx} className="py-3 px-1 text-center">
                          {phase ? (
                            <span
                              title={`${MONTHS[idx]}: ${PHASE_STYLES[phase].label}`}
                              className={`inline-block w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight shadow-xs ${PHASE_STYLES[phase].cell}`}
                            >
                              {PHASE_SHORT[phase]}
                            </span>
                          ) : (
                            <span className="inline-block w-full py-1.5 rounded-lg bg-stone-100 text-stone-300 text-[10px]">
                              —
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Crop Guidance Card */}
        <div className="bg-emerald-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
              <CheckCircle2 className="w-4 h-4" />
              Recomendação Agronómica — {activeCrop.name}
            </div>
            <p className="text-sm sm:text-base text-emerald-100 leading-relaxed">
              {activeCrop.tip}
            </p>
            <p className="text-xs text-emerald-300 font-semibold">
              Variedades disponíveis na Raffa: <span className="text-white">{activeCrop.varieties}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <a
              href="#calculadora"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <Calculator className="w-4 h-4 text-amber-300" />
              <span>Calcular Sementes</span>
            </a>
            <button
              type="button"
              onClick={() => onOpenQuote(activeCrop.name)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-black shadow-md transition-colors cursor-pointer"
            >
              <span>Encomendar para Campanha</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
