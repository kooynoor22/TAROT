import React, { useRef, useState } from 'react';
import { TarotCard } from '../data/tarot';
import TarotCardComponent from './TarotCard';
import { X, Download, Sparkles, Check, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import { triggerHaptic } from '../lib/haptic';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SharePostcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  drawnCards: Array<{ card: TarotCard; faceDown: boolean }>;
  spreadType: 'single' | 'three' | 'celtic';
  traditionId: string;
  deckId: string;
  tarotistName: string;
  consultantName: string;
  question?: string;
}

export default function SharePostcardModal({
  isOpen,
  onClose,
  drawnCards,
  spreadType,
  traditionId,
  deckId,
  tarotistName,
  consultantName,
  question
}: SharePostcardModalProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Format date elegantly
  const dateStr = format(new Date(), "dd 'de' MMMM, yyyy", { locale: es });

  const getPositionLabel = (index: number) => {
    if (spreadType === 'single') return 'Consejo';
    if (spreadType === 'three') {
      return index === 0 ? 'Pasado' : index === 1 ? 'Presente' : 'Futuro';
    }
    const positions = [
      '1. Situación Actual',
      '2. Obstáculo',
      '3. Subconsciente',
      '4. Pasado Reciente',
      '5. Coronación',
      '6. Futuro Inmediato',
      '7. El Consultante',
      '8. Entorno',
      '9. Esperanzas',
      '10. Resultado'
    ];
    return positions[index] || `Posición ${index + 1}`;
  };

  const handleDownload = async () => {
    if (!exportRef.current || generating) return;
    triggerHaptic(30);
    setGenerating(true);

    try {
      // Small delay to ensure images are fully painted
      await new Promise((resolve) => setTimeout(resolve, 350));

      const canvas = await html2canvas(exportRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 2, // 2x scale for ultra crisp high-res screenshot
        backgroundColor: '#020617', // Slate 950 base color
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      
      // Clean filename
      const cleanName = consultantName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.download = `tarot_lectura_${cleanName || 'general'}_${format(new Date(), 'yyyyMMdd')}.png`;
      link.href = dataUrl;
      link.click();

      setSuccess(true);
      triggerHaptic([40, 60]);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating postcard screenshot:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      {/* Modal Card */}
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900 bg-slate-950">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-serif text-slate-100">Postal Fotográfica de la Tirada</h3>
          </div>
          <button 
            onClick={() => { triggerHaptic(15); onClose(); }}
            className="p-1.5 rounded-full hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal content body */}
        <div className="p-6 flex flex-col items-center gap-6 overflow-y-auto max-h-[calc(100vh-180px)]">
          <p className="text-xs text-slate-400 text-center max-w-md leading-relaxed">
            Hemos diseñado esta postal con un estilo de fotografía profesional para tus redes sociales. Presiona el botón de descargar para guardarla con máxima resolución.
          </p>

          {/* PREVIEW CONTAINER - Scaled down dynamically to fit the screen size */}
          <div className="w-full flex justify-center items-center overflow-x-auto py-2 scrollbar-none">
            <div className="relative shrink-0 border border-purple-500/10 shadow-2xl rounded-lg overflow-hidden bg-slate-950 origin-center scale-[0.45] sm:scale-[0.6] md:scale-[0.75] lg:scale-100 my-[-250px] sm:my-[-160px] md:my-[-90px] lg:my-0" style={{ width: '1000px', height: '1000px' }}>
              
              {/* REAL EXPORTABLE POSTCARD (Fixed 1000x1000px layout) */}
              <div 
                ref={exportRef}
                className="w-[1000px] h-[1000px] relative bg-slate-950 p-10 flex flex-col justify-between overflow-hidden select-none"
                style={{
                  backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(88, 28, 135, 0.25) 0%, rgba(15, 23, 42, 0) 65%), radial-gradient(circle at 10% 90%, rgba(58, 48, 120, 0.15) 0%, rgba(15, 23, 42, 0) 50%)'
                }}
              >
                {/* Beautiful Gold/Double border frame around the postcard */}
                <div className="absolute inset-5 border border-purple-500/20 rounded-xl pointer-events-none" />
                <div className="absolute inset-6 border border-amber-500/10 rounded-lg pointer-events-none" />
                
                {/* Decorative golden stars or corners */}
                <div className="absolute top-8 left-8 text-amber-500/30 font-serif text-sm">✦</div>
                <div className="absolute top-8 right-8 text-amber-500/30 font-serif text-sm">✦</div>
                <div className="absolute bottom-8 left-8 text-amber-500/30 font-serif text-sm">✦</div>
                <div className="absolute bottom-8 right-8 text-amber-500/30 font-serif text-sm">✦</div>

                {/* Postcard Header */}
                <div className="text-center z-10 space-y-2 mt-4">
                  <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-mono tracking-[0.4em] text-purple-400">
                    <span>•</span>
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>ORÁCULO DEL TAROT</span>
                    <span>•</span>
                  </div>
                  <h1 className="text-4xl font-serif text-slate-100 tracking-wide font-normal">
                    Lectura Sagrada
                  </h1>
                  
                  {/* Elegant decorative line with central diamond */}
                  <div className="flex items-center justify-center gap-3 max-w-xs mx-auto py-1">
                    <div className="h-[1px] bg-slate-800 flex-1" />
                    <div className="w-1.5 h-1.5 rotate-45 bg-amber-500/50" />
                    <div className="h-[1px] bg-slate-800 flex-1" />
                  </div>

                  {/* Metadata display badges */}
                  <div className="flex justify-center items-center gap-x-6 gap-y-1 flex-wrap text-xs text-slate-400 font-mono pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-purple-400/80">Tarotista:</span>
                      <span className="text-slate-200 font-semibold">{tarotistName}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-800" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-purple-400/80">Consultante:</span>
                      <span className="text-slate-200 font-semibold">{consultantName || 'Consulta General'}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-800" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">{dateStr}</span>
                    </div>
                  </div>

                  {/* Question Focus, if supplied */}
                  {question && (
                    <div className="max-w-2xl mx-auto mt-2">
                      <p className="text-xs italic text-purple-300 bg-purple-950/20 border border-purple-500/10 py-1.5 px-4 rounded-full inline-block font-serif">
                        Pregunta: "{question}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Postcard Center: CARDS DISPLAY (Specifically sized for the 1000px square canvas) */}
                <div className="flex-1 flex items-center justify-center px-4 my-6 z-10">
                  {spreadType === 'single' && (
                    <div className="flex flex-col items-center gap-4">
                      <div className="text-xs uppercase font-serif tracking-[0.2em] text-purple-400">
                        {getPositionLabel(0)}
                      </div>
                      <div className="w-[200px] shadow-2xl rounded-xl overflow-hidden border border-purple-500/20">
                        <TarotCardComponent
                          card={drawnCards[0].card}
                          deckId={deckId}
                          traditionId={traditionId}
                          faceDown={false}
                        />
                      </div>
                      <div className="text-lg font-serif text-amber-100 tracking-wide">
                        {drawnCards[0].card.name}
                      </div>
                    </div>
                  )}

                  {spreadType === 'three' && (
                    <div className="grid grid-cols-3 gap-8 w-full max-w-4xl px-8">
                      {drawnCards.map((item, i) => (
                        <div key={item.card.id + i} className="flex flex-col items-center gap-4 text-center">
                          <div className="text-[11px] uppercase font-serif tracking-[0.2em] text-purple-400">
                            {getPositionLabel(i)}
                          </div>
                          <div className="w-[170px] shadow-2xl rounded-xl overflow-hidden border border-purple-500/10">
                            <TarotCardComponent
                              card={item.card}
                              deckId={deckId}
                              traditionId={traditionId}
                              faceDown={false}
                            />
                          </div>
                          <div className="text-sm font-serif text-amber-100 tracking-wide max-w-[150px] truncate">
                            {item.card.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {spreadType === 'celtic' && (
                    <div className="flex flex-col gap-6 w-full max-w-5xl px-4">
                      {/* Grid structure for the 10 cards: 2 rows of 5 cards */}
                      <div className="grid grid-cols-5 gap-x-4 gap-y-6 w-full">
                        {drawnCards.slice(0, 5).map((item, i) => (
                          <div key={item.card.id + i} className="flex flex-col items-center gap-2 text-center">
                            <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-purple-400 bg-purple-950/40 border border-purple-500/10 px-2 py-0.5 rounded-full w-full truncate">
                              {getPositionLabel(i).replace(/^\d+\.\s*/, '')}
                            </span>
                            <div className="w-[125px] shadow-lg rounded-lg overflow-hidden border border-slate-800">
                              <TarotCardComponent
                                card={item.card}
                                deckId={deckId}
                                traditionId={traditionId}
                                faceDown={false}
                              />
                            </div>
                            <span className="text-[11px] font-serif text-slate-300 font-medium tracking-wide truncate max-w-[120px] block">
                              {item.card.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-5 gap-x-4 gap-y-6 w-full">
                        {drawnCards.slice(5, 10).map((item, i) => {
                          const realIndex = i + 5;
                          return (
                            <div key={item.card.id + realIndex} className="flex flex-col items-center gap-2 text-center">
                              <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-purple-400 bg-purple-950/40 border border-purple-500/10 px-2 py-0.5 rounded-full w-full truncate">
                                {getPositionLabel(realIndex).replace(/^\d+\.\s*/, '')}
                              </span>
                              <div className="w-[125px] shadow-lg rounded-lg overflow-hidden border border-slate-800">
                                <TarotCardComponent
                                  card={item.card}
                                  deckId={deckId}
                                  traditionId={traditionId}
                                  faceDown={false}
                                />
                              </div>
                              <span className="text-[11px] font-serif text-slate-300 font-medium tracking-wide truncate max-w-[120px] block">
                                {item.card.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Postcard Footer */}
                <div className="text-center z-10 mb-2">
                  <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-slate-500">
                    Sintoniza tu destino en el Oráculo del Tarot • Creado por Benjamín Hardoy para la Tarotista Jesica Hardoy
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 w-full justify-center pt-2">
            <button
              onClick={() => { triggerHaptic(15); onClose(); }}
              className="px-5 py-2.5 border border-slate-800 hover:bg-slate-900 text-slate-300 rounded-xl font-medium text-sm transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleDownload}
              disabled={generating}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg ${
                success 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20 hover:shadow-purple-500/30'
              }`}
            >
              <Download className="w-4 h-4" />
              {generating ? 'Generando Foto...' : success ? '¡Descargado!' : 'Descargar Foto de Tirada'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
