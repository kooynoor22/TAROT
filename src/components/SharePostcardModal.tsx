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

// Helper to sanitize Tailwind v4 oklch colors before capturing with html2canvas (which crashes on oklch)
async function sanitizeStylesheetsForHtml2Canvas() {
  const restorations: Array<{
    element: HTMLStyleElement | HTMLLinkElement;
    originalText?: string;
    wasDisabled?: boolean;
    tempStyle?: HTMLStyleElement;
  }> = [];

  // 1. Handle <style> elements
  const styleElements = Array.from(document.querySelectorAll('style'));
  for (const styleEl of styleElements) {
    if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
      restorations.push({
        element: styleEl,
        originalText: styleEl.textContent
      });
      // Replace oklch(...) with a basic hex/rgb color so html2canvas doesn't crash
      styleEl.textContent = styleEl.textContent.replace(/oklch\([^)]+\)/g, 'rgb(15, 23, 42)');
    }
  }

  // 2. Handle <link rel="stylesheet"> elements
  const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
  for (const linkEl of linkElements) {
    try {
      const response = await fetch(linkEl.href);
      if (response.ok) {
        let cssText = await response.text();
        if (cssText.includes('oklch')) {
          cssText = cssText.replace(/oklch\([^)]+\)/g, 'rgb(15, 23, 42)');
          
          const tempStyle = document.createElement('style');
          tempStyle.textContent = cssText;
          document.head.appendChild(tempStyle);
          
          const wasDisabled = linkEl.disabled;
          linkEl.disabled = true;
          
          restorations.push({
            element: linkEl,
            wasDisabled,
            tempStyle
          });
        }
      }
    } catch (err) {
      console.warn('Could not sanitize link stylesheet:', linkEl.href, err);
    }
  }

  return () => {
    for (const r of restorations) {
      if (r.originalText !== undefined) {
        r.element.textContent = r.originalText;
      }
      if (r.tempStyle) {
        r.tempStyle.remove();
      }
      if (r.wasDisabled !== undefined) {
        (r.element as HTMLLinkElement).disabled = r.wasDisabled;
      }
    }
  };
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

    let restoreStylesheets: (() => void) | null = null;

    try {
      // Clean up oklch styles from stylesheets temporarily to prevent html2canvas crashing
      try {
        restoreStylesheets = await sanitizeStylesheetsForHtml2Canvas();
      } catch (styleErr) {
        console.warn('Failed to sanitize stylesheets:', styleErr);
      }

      // Wait for any rendering/image decoding to settle
      await new Promise((resolve) => setTimeout(resolve, 400));

      const canvas = await html2canvas(exportRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 2, // 2x scale for ultra crisp high-res screenshot (perfect for WhatsApp state/sharing)
        backgroundColor: '#020617', // Slate 950 base color
        logging: false,
        width: 1000,
        height: 1000,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1000,
        windowHeight: 1000
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
      // Always restore original styles
      if (restoreStylesheets) {
        restoreStylesheets();
      }
      setGenerating(false);
    }
  };

  const renderPostcardContent = () => (
    <>
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
        <h1 className="text-3xl sm:text-4xl font-serif text-slate-100 tracking-wide font-normal">
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
            <div className="text-xs uppercase font-serif tracking-[0.2em] text-purple-400 bg-purple-950/30 border border-purple-500/10 px-4 py-1 rounded-full">
              {getPositionLabel(0)}
            </div>
            <div 
              className="w-[240px] shadow-2xl rounded-2xl overflow-hidden border border-purple-500/20 aspect-[2/3]"
              style={{ transform: 'rotate(-2deg)' }}
            >
              <TarotCardComponent
                card={drawnCards[0].card}
                deckId={deckId}
                traditionId={traditionId}
                faceDown={false}
                staticMode={true}
              />
            </div>
            <div className="text-xl font-serif text-amber-100 tracking-wide mt-1">
              {drawnCards[0].card.name}
            </div>
          </div>
        )}

        {spreadType === 'three' && (
          <div className="flex flex-col items-center justify-center w-full max-w-3xl my-4">
            {/* The Fan Container */}
            <div className="relative h-[340px] w-[580px] flex items-center justify-center overflow-visible">
              {drawnCards.map((item, i) => {
                // Determine translation & rotation for 3-card fan
                let rotation = '0deg';
                let translateX = '0px';
                let translateY = '0px';
                let zIndex = 20;

                if (i === 0) {
                  rotation = '-12deg';
                  translateX = '-135px';
                  translateY = '15px';
                  zIndex = 10;
                } else if (i === 1) {
                  rotation = '0deg';
                  translateX = '0px';
                  translateY = '0px';
                  zIndex = 30; // Center card on top
                } else if (i === 2) {
                  rotation = '12deg';
                  translateX = '135px';
                  translateY = '15px';
                  zIndex = 20; // Right card slightly overlapping or under
                }

                return (
                  <div
                    key={item.card.id + i}
                    className="absolute flex flex-col items-center transition-all duration-300"
                    style={{
                      transform: `translateX(${translateX}) translateY(${translateY}) rotate(${rotation})`,
                      zIndex: zIndex,
                      width: '180px'
                    }}
                  >
                    {/* Position Label Badge embedded inside the card or floating nicely */}
                    <div className="text-[10px] uppercase font-serif tracking-[0.15em] text-purple-300 bg-slate-950/90 border border-purple-500/30 px-2.5 py-0.5 rounded-full mb-2 shadow-md max-w-[150px] truncate">
                      {getPositionLabel(i).replace(/^\d+\.\s*/, '')}
                    </div>

                    <div className="w-[160px] shadow-2xl rounded-2xl overflow-hidden border border-purple-500/20 aspect-[2/3] bg-slate-900">
                      <TarotCardComponent
                        card={item.card}
                        deckId={deckId}
                        traditionId={traditionId}
                        faceDown={false}
                        staticMode={true}
                      />
                    </div>

                    <div className="text-xs font-serif text-amber-100 tracking-wide mt-2 bg-slate-950/90 px-2.5 py-0.5 rounded border border-slate-800/50 shadow truncate max-w-[150px]">
                      {item.card.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {spreadType === 'celtic' ? (
          <div className="flex flex-col items-center justify-center w-full max-w-5xl my-4">
            {/* Beautiful horizontal arc/fan layout for Celtic / 10 cards */}
            <div className="relative h-[360px] w-[850px] flex items-center justify-center overflow-visible">
              {drawnCards.map((item, i) => {
                const totalCards = 10;
                const angleSpread = 64; // total angle spread in degrees
                const startAngle = -angleSpread / 2;
                const angleStep = angleSpread / (totalCards - 1);
                const angle = startAngle + i * angleStep;
                
                // Lay cards along a circle arc
                const radius = 620; // radius of the circle
                const rad = (angle * Math.PI) / 180;
                
                const translateX = Math.sin(rad) * radius;
                const translateY = (Math.cos(rad) * radius) - radius + 25; // gentle arc
                
                return (
                  <div
                    key={item.card.id + i}
                    className="absolute flex flex-col items-center transition-all duration-300"
                    style={{
                      transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${angle}deg)`,
                      zIndex: 10 + i,
                      width: '110px'
                    }}
                  >
                    {/* Tiny badge with card position/number */}
                    <div className="text-[8px] font-sans font-semibold uppercase tracking-wider text-purple-300 bg-slate-950/90 border border-purple-500/30 px-1.5 py-0.5 rounded-full mb-1 shadow truncate max-w-[95px]">
                      {i + 1}. {getPositionLabel(i).replace(/^\d+\.\s*/, '')}
                    </div>

                    <div className="w-[100px] shadow-xl rounded-xl overflow-hidden border border-purple-500/15 aspect-[2/3] bg-slate-900">
                      <TarotCardComponent
                        card={item.card}
                        deckId={deckId}
                        traditionId={traditionId}
                        faceDown={false}
                        staticMode={true}
                      />
                    </div>

                    <div className="text-[9px] font-serif text-amber-100 tracking-wide mt-1 bg-slate-950/90 px-1.5 py-0.5 rounded border border-slate-800/50 shadow truncate max-w-[95px] text-center">
                      {item.card.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/* Postcard Footer */}
      <div className="text-center z-10 mb-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">
          Tarotista: {tarotistName}
        </p>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      
      {/* 
        OFF-SCREEN EXPORTABLE CANVAS TARGET 
        This is perfectly unscaled, unskewed, fixed-size 1000px square, absolutely positioned outside the viewport.
        This resolves all browser scaling/responsive resizing bugs when html2canvas captures canvas bounds!
      */}
      <div className="absolute pointer-events-none" style={{ position: 'fixed', left: '-9999px', top: '-9999px', width: '1000px', height: '1000px', zIndex: -999 }}>
        <div 
          ref={exportRef}
          className="w-[1000px] h-[1000px] relative bg-slate-950 p-10 flex flex-col justify-between overflow-hidden select-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(88, 28, 135, 0.25) 0%, rgba(15, 23, 42, 0) 65%), radial-gradient(circle at 10% 90%, rgba(58, 48, 120, 0.15) 0%, rgba(15, 23, 42, 0) 50%)'
          }}
        >
          {renderPostcardContent()}
        </div>
      </div>

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
            Hemos diseñado esta postal con un estilo de fotografía profesional para tus redes sociales. Presiona el botón de descargar para guardarla con máxima resolución y compartirla en tus Estados o mensajes de WhatsApp.
          </p>

          {/* PREVIEW CONTAINER - Scaled down dynamically to fit the screen size */}
          <div className="w-full flex justify-center items-center overflow-x-auto py-2 scrollbar-none">
            <div className="relative shrink-0 border border-purple-500/10 shadow-2xl rounded-lg overflow-hidden bg-slate-950 origin-center scale-[0.45] sm:scale-[0.6] md:scale-[0.75] lg:scale-100 my-[-250px] sm:my-[-160px] md:my-[-90px] lg:my-0" style={{ width: '1000px', height: '1000px' }}>
              <div 
                className="w-[1000px] h-[1000px] relative bg-slate-950 p-10 flex flex-col justify-between overflow-hidden select-none"
                style={{
                  backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(88, 28, 135, 0.25) 0%, rgba(15, 23, 42, 0) 65%), radial-gradient(circle at 10% 90%, rgba(58, 48, 120, 0.15) 0%, rgba(15, 23, 42, 0) 50%)'
                }}
              >
                {renderPostcardContent()}
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
