
import React, { useState } from 'react';
import { ToothState, ToothCondition } from '../types';

interface OdontogramProps {
  toothStates: ToothState[];
  onUpdateTooth: (toothId: number, condition: ToothCondition) => void;
}

const CONDITION_COLORS: Record<ToothCondition, string> = {
  healthy: 'bg-white text-slate-400',
  caries: 'bg-rose-500 text-white',
  filling: 'bg-sky-400 text-white',
  missing: 'bg-slate-800 text-white',
  extraction: 'bg-amber-500 text-white',
  implant: 'bg-emerald-500 text-white',
  endodontics: 'bg-purple-500 text-white'
};

const CONDITION_LABELS: Record<ToothCondition, string> = {
  healthy: 'Sano',
  caries: 'Caries',
  filling: 'Obturación',
  missing: 'Ausente',
  extraction: 'Exodoncia',
  implant: 'Implante',
  endodontics: 'Endodoncia'
};

const TOOTH_IDS = [
  [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28], // Upper
  [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]  // Lower
];

export const Odontogram: React.FC<OdontogramProps> = ({ toothStates, onUpdateTooth }) => {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  const getToothCondition = (id: number) => {
    return toothStates.find(s => s.id === id)?.condition || 'healthy';
  };

  return (
    <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200">
      <div className="space-y-12">
        {TOOTH_IDS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-wrap justify-center gap-2">
            {row.map(id => {
              const condition = getToothCondition(id);
              const isActive = selectedTooth === id;
              return (
                <div key={id} className="relative group">
                  <button
                    onClick={() => setSelectedTooth(isActive ? null : id)}
                    className={`w-10 h-14 md:w-12 md:h-16 rounded-xl border-2 transition-all flex flex-col items-center justify-between p-2 shadow-sm
                      ${isActive ? 'ring-4 ring-sky-500/20 border-sky-500 scale-110 z-10' : 'border-slate-200'}
                      ${CONDITION_COLORS[condition]}`}
                  >
                    <span className="text-[10px] font-black">{id}</span>
                    <div className="w-full h-1/2 rounded-full border border-current opacity-30 mt-1"></div>
                  </button>
                  
                  {isActive && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-white p-3 rounded-2xl shadow-2xl border border-slate-100 z-50 w-48 space-y-1 animate-in zoom-in-95 duration-200">
                      <p className="text-[9px] font-black uppercase text-slate-400 mb-2 px-2">Estado Pieza {id}</p>
                      {Object.keys(CONDITION_LABELS).map((cond) => (
                        <button
                          key={cond}
                          onClick={() => {
                            onUpdateTooth(id, cond as ToothCondition);
                            setSelectedTooth(null);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-colors hover:bg-slate-50
                            ${condition === cond ? 'text-sky-500 bg-sky-50' : 'text-slate-600'}`}
                        >
                          {CONDITION_LABELS[cond as ToothCondition]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      <div className="mt-12 flex flex-wrap justify-center gap-6">
        {Object.entries(CONDITION_LABELS).map(([cond, label]) => (
          <div key={cond} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${CONDITION_COLORS[cond as ToothCondition]}`}></div>
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
