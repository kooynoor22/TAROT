import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, X, FileText, Printer, Copy, Check, Star, AlertCircle, 
  RefreshCw, Compass, Moon, Scroll
} from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { soundManager } from '../lib/sound';

interface TarotCard {
  id: string;
  index: number;
  name: string;
  type: string;
  suit?: string;
}

interface DrawnCardState {
  card: TarotCard;
  faceDown: boolean;
  inverted?: boolean;
}

interface AiReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  drawnCards: DrawnCardState[];
  spreadType: string;
  question: string;
  consultantName: string;
  tarotistName: string;
  traditionName: string;
  deckName: string;
}

interface AiReportData {
  introduccion: string;
  analisisCartas: Array<{
    carta: string;
    significado: string;
  }>;
  sintesis: string;
  consejoMagico: string;
}

const LOADING_MESSAGES = [
  "Sintonizando con tus vibraciones astrales...",
  "Abriendo el portal de la Tarotista profesional...",
  "Consultando el Oráculo de los Arcanos con IA...",
  "Tejiendo los hilos sagrados del destino...",
  "Canalizando la sabiduría hermética del plano invisible...",
  "Descifrando las constelaciones en tus cartas..."
];

export default function AiReportModal({
  isOpen,
  onClose,
  drawnCards,
  spreadType,
  question,
  consultantName,
  tarotistName,
  traditionName,
  deckName
}: AiReportModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AiReportData | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  // Rotate loading messages every 3 seconds
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  // Fetch report when modal is opened and we don't have one yet
  useEffect(() => {
    if (isOpen && !report && !loading) {
      generateReport();
    }
  }, [isOpen]);

  // Reset report if the drawn cards change (indicating a new reading)
  useEffect(() => {
    setReport(null);
    setError(null);
  }, [drawnCards]);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setLoadingMsgIdx(0);
    soundManager.playShuffle(3000);

    try {
      const response = await fetch("/api/gemini/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drawnCards,
          spreadType,
          question,
          consultantName,
          tarotistName,
          traditionName,
          deckName
        })
      });

      if (!response.ok) {
        let errMsg = "No se pudo conectar con el oráculo.";
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch (e) {
          try {
            const rawText = await response.text();
            if (rawText) {
              errMsg = rawText.length > 200 ? rawText.substring(0, 200) + "..." : rawText;
            }
          } catch (e2) {}
        }
        throw new Error(errMsg);
      }

      const rawResponseText = await response.text();
      let data;
      try {
        data = JSON.parse(rawResponseText);
      } catch (parseErr) {
        throw new Error(`Respuesta inválida del oráculo. Por favor, intenta de nuevo. Detalle: ${rawResponseText.substring(0, 150)}...`);
      }

      setReport(data);
      soundManager.playFlip();
      triggerHaptic([40, 60]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al generar la devolución mística.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!report) return;
    triggerHaptic(20);

    const textToCopy = `🔮 INFORME DE TAROT PROFESIONAL 🔮
Consultante: ${consultantName || 'Consulta General'}
Tarotista: ${tarotistName}
Tirada: ${spreadType === 'single' ? 'Carta Única' : spreadType === 'three' ? 'Pasado-Presente-Futuro' : 'Cruz Celta'}
Pregunta: "${question || 'Lectura evolutiva general'}"

🌟 INTRODUCCIÓN:
${report.introduccion}

📖 ANÁLISIS DE ARCANOS:
${report.analisisCartas.map((c) => `• ${c.carta}:\n  ${c.significado}`).join('\n\n')}

⚖️ SÍNTESIS INTEGRATIVA:
${report.sintesis}

🕯️ CONSEJO MÁGICO / RITUAL:
${report.consejoMagico}

✨ Que la sabiduría de los Arcanos ilumine tu sendero ✨`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handlePrint = () => {
    triggerHaptic(25);
    window.print();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
        {/* Print Styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
          
          .magic-title {
            font-family: 'Cinzel Decorative', Georgia, serif;
          }
          .magic-body {
            font-family: 'Lora', Georgia, serif;
          }

          @media print {
            body {
              background: #faf6f0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * {
              visibility: hidden;
            }
            .print-scroll, .print-scroll * {
              visibility: visible;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-scroll {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: #faf6f0 !important;
              color: #1a1510 !important;
              font-size: 12pt !important;
            }
            .no-print {
              display: none !important;
            }
            .print-parchment {
              background: #faf6f0 !important;
              border: 1px solid #c5a880 !important;
              border-radius: 0 !important;
              padding: 20mm !important;
              box-shadow: none !important;
            }
            .wood-container {
              background: none !important;
              border: none !important;
              padding: 0 !important;
              box-shadow: none !important;
            }
          }
        `}} />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
        >
          {/* Header (No print) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/60 no-print">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <h2 className="font-serif font-semibold text-slate-100 text-sm sm:text-base flex items-center gap-2">
                  Lectura del Oráculo Místico
                  <span className="text-[10px] font-mono font-medium text-amber-400 border border-amber-500/25 bg-amber-500/5 px-2 py-0.5 rounded-full uppercase">
                    Oráculo Místico
                  </span>
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-400">Devolución e integración evolutiva para el consultante</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-950/20 print:overflow-visible print:p-0">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-6">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-20 h-20 bg-amber-500/10 rounded-full animate-ping border border-amber-500/20" />
                  <div className="w-16 h-16 bg-slate-900 border-2 border-amber-500/50 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/10 animate-pulse">
                    <Moon className="w-7 h-7 text-amber-400 animate-bounce-slow" />
                  </div>
                </div>
                <div className="space-y-2 max-w-sm">
                  <h3 className="font-serif font-medium text-slate-100 text-base">Invocando el Oráculo</h3>
                  <p className="text-sm text-slate-400 min-h-[40px] animate-pulse">
                    {LOADING_MESSAGES[loadingMsgIdx]}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="max-w-md mx-auto my-12 p-6 bg-rose-950/25 border border-rose-900/40 rounded-2xl text-center space-y-4">
                <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
                <h3 className="font-serif font-semibold text-rose-200">Error del Oráculo</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
                <button
                  onClick={generateReport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-900/30 hover:bg-rose-900/45 text-rose-200 border border-rose-500/25 rounded-xl text-xs font-semibold transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reintentar Invocación
                </button>
              </div>
            )}

            {report && !loading && !error && (
              <div className="print-scroll wood-container w-full bg-gradient-to-br from-[#3e2413] via-[#2d190b] to-[#1c0f06] border-[10px] border-[#4e2f18] shadow-2xl rounded-[2rem] p-3 sm:p-5 md:p-7 relative">
                
                {/* Simulated Wood bevel highlights and shadows */}
                <div className="absolute inset-0 border-4 border-[#5d3c23] pointer-events-none rounded-[1.7rem]" />
                <div className="absolute inset-0 border border-black/50 pointer-events-none rounded-[1.6rem]" />

                {/* Golden inner scroll border */}
                <div className="border-2 border-amber-600/30 p-1 sm:p-2 rounded-2xl bg-amber-500/5">
                  
                  {/* Parchment Paper inside */}
                  <div className="print-parchment bg-[#f6ebd9] text-slate-950 rounded-xl p-5 sm:p-8 md:p-12 relative overflow-hidden shadow-inner magic-body select-text">
                    
                    {/* Parchment background detail watermark */}
                    <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#804000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                    <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#804000]/5 to-transparent pointer-events-none" />
                    
                    {/* Top Celestial Flourish */}
                    <div className="flex justify-center items-center gap-4 text-[#8a633a] mb-6 no-print">
                      <Star className="w-4 h-4 fill-current" />
                      <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent to-[#8a633a]" />
                      <Moon className="w-5 h-5 fill-current" />
                      <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent to-[#8a633a]" />
                      <Star className="w-4 h-4 fill-current" />
                    </div>

                    {/* Report Metadata Header */}
                    <div className="text-center space-y-3 pb-8 border-b border-[#8a633a]/25 relative">
                      <h1 className="magic-title text-2xl sm:text-3xl md:text-4xl text-[#4a2f15] font-bold tracking-wide uppercase">
                        Devolución Mística
                      </h1>
                      <div className="text-[10px] sm:text-xs text-[#7c552e] uppercase tracking-widest font-mono flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                        <span>Consultante: <strong className="font-serif font-bold text-[#4a2f15]">{consultantName || 'Consulta General'}</strong></span>
                        <span className="hidden sm:inline">•</span>
                        <span>Tarotista: <strong className="font-serif font-bold text-[#4a2f15]">{tarotistName}</strong></span>
                      </div>

                      {question && (
                        <div className="max-w-xl mx-auto mt-4 px-4 py-2.5 bg-[#f0e2cd] border border-[#d5c3aa] rounded-xl text-center">
                          <p className="text-[11px] uppercase tracking-wider font-semibold text-[#8a633a]">Consulta Realizada:</p>
                          <p className="text-xs sm:text-sm text-[#4a2f15] italic font-medium leading-relaxed">
                            "{question}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 1. Introduction */}
                    <div className="py-8 space-y-3 border-b border-[#8a633a]/15">
                      <h3 className="magic-title text-base sm:text-lg font-bold text-[#4a2f15] flex items-center gap-2 uppercase tracking-wider">
                        <Scroll className="w-5 h-5 text-[#8a633a] shrink-0" />
                        Sintonía Inicial
                      </h3>
                      <p className="text-sm sm:text-base text-[#2c1d11] leading-relaxed italic first-letter:text-4xl first-letter:font-bold first-letter:text-[#4a2f15] first-letter:mr-2 first-letter:float-left">
                        {report.introduccion}
                      </p>
                    </div>

                    {/* 2. Arcana Analysis */}
                    <div className="py-8 space-y-6 border-b border-[#8a633a]/15">
                      <h3 className="magic-title text-base sm:text-lg font-bold text-[#4a2f15] flex items-center gap-2 uppercase tracking-wider">
                        <Sparkles className="w-5 h-5 text-[#8a633a] shrink-0" />
                        Desglose de los Arcanos
                      </h3>
                      
                      <div className="grid gap-6">
                        {report.analisisCartas.map((c, idx) => (
                          <div 
                            key={idx}
                            className="bg-[#faf5ec]/80 border border-[#e8dfcf] p-5 sm:p-6 rounded-2xl space-y-2.5 relative hover:border-[#d7caa7] transition-all duration-300"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-[#e8dfcf] text-[#4a2f15] font-serif font-bold text-xs flex items-center justify-center shrink-0 border border-[#dcd1be]">
                                {idx + 1}
                              </span>
                              <h4 className="magic-title font-bold text-sm sm:text-base text-[#4a2f15] uppercase tracking-wide">
                                {c.carta}
                              </h4>
                            </div>
                            <p className="text-xs sm:text-sm text-[#2c1d11] leading-relaxed font-sans">
                              {c.significado}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3. Synthesis */}
                    <div className="py-8 space-y-3 border-b border-[#8a633a]/15">
                      <h3 className="magic-title text-base sm:text-lg font-bold text-[#4a2f15] flex items-center gap-2 uppercase tracking-wider">
                        <Compass className="w-5 h-5 text-[#8a633a] shrink-0" />
                        Síntesis e Integración
                      </h3>
                      <p className="text-xs sm:text-sm text-[#2c1d11] leading-relaxed whitespace-pre-line">
                        {report.sintesis}
                      </p>
                    </div>

                    {/* 4. Magic Advice / Ritual */}
                    <div className="pt-8 space-y-3 relative">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600/5 rounded-full blur-2xl pointer-events-none" />
                      <h3 className="magic-title text-base sm:text-lg font-bold text-[#4a2f15] flex items-center gap-2 uppercase tracking-wider">
                        <Star className="w-5 h-5 text-[#8a633a] shrink-0 fill-current" />
                        Guía y Ritual Sugerido
                      </h3>
                      <div className="bg-[#ebd9bd]/50 border border-[#dcbc8b] p-5 rounded-2xl italic text-xs sm:text-sm text-[#3b2410] leading-relaxed relative">
                        <span className="absolute -top-3.5 left-4 px-2.5 py-0.5 bg-[#4a2f15] text-[#f6ebd9] text-[9px] uppercase tracking-widest rounded-md font-mono">
                          Consejo Alquímico
                        </span>
                        {report.consejoMagico}
                      </div>
                    </div>

                    {/* Footer Flourish */}
                    <div className="mt-12 text-center text-[10px] text-[#8a633a] italic tracking-widest uppercase font-mono flex flex-col items-center justify-center gap-3">
                      <div className="h-[1px] w-28 bg-[#8a633a]/30" />
                      <p>Que la sabiduría ancestral de las cartas guíe tu camino</p>
                      <p className="text-[8px] tracking-normal lowercase text-[#8a633a]/60">generado en sintonía con las fuerzas sutiles de la tirada</p>
                    </div>

                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer (No print) */}
          {report && !loading && !error && (
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap gap-3 justify-between items-center no-print">
              <div className="text-xs text-slate-400">
                Se generó una devolución profesional completa.
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopy}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 rounded-xl text-xs font-semibold transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar Texto
                    </>
                  )}
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/10"
                >
                  <Printer className="w-4 h-4" />
                  Descargar PDF / Imprimir
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
