import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Download, X, Star, Smartphone, HelpCircle, Share2, PlusSquare, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showHowToModal, setShowHowToModal] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / standalone mode
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    // 2. Check if user dismissed prompt recently (within last 3 days)
    const dismissedTime = localStorage.getItem('tarot-install-prompt-dismissed');
    const hasDismissedRecently = dismissedTime && (Date.now() - parseInt(dismissedTime, 10) < 3 * 24 * 60 * 60 * 1000);

    // 3. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIPhoneOrIPad = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIPhoneOrIPad);

    // 4. Handle Android/Desktop beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      if (!hasDismissedRecently) {
        // Show after a brief delay so they feel the vibe of the app first
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3500);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. For iOS, since there's no native event, show custom prompt after some time
    if (isIPhoneOrIPad && !hasDismissedRecently) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 4500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    triggerHaptic(30);
    if (isIOS) {
      // Show iOS specific tutorial modal
      setShowHowToModal(true);
      return;
    }

    if (!deferredPrompt) {
      // If we don't have the event, show standard how-to
      setShowHowToModal(true);
      return;
    }

    // Trigger Android/Desktop native install prompt
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the tarot install prompt');
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('Error triggering PWA install prompt:', err);
      setShowHowToModal(true);
    }
  };

  const handleDismiss = () => {
    triggerHaptic(15);
    setShowPrompt(false);
    localStorage.setItem('tarot-install-prompt-dismissed', Date.now().toString());
  };

  // If already installed, don't show anything
  if (isStandalone) return null;

  return (
    <>
      {/* Visual Bottom Notification Banner */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-slate-900/95 border border-purple-500/30 backdrop-blur-md rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col gap-3.5"
            id="pwa-install-banner"
          >
            {/* Background sparkle accent */}
            <div className="absolute top-0 right-0 overflow-hidden rounded-2xl w-full h-full pointer-events-none">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-purple-600/10 rounded-full blur-xl" />
            </div>

            <div className="flex items-start gap-3.5 z-10">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-serif font-semibold text-slate-100 tracking-wide">
                    Oráculo del Tarot en tu Celular
                  </h4>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {isIOS 
                    ? 'Agrega la app a tu pantalla de inicio para acceder rápido como una aplicación real.' 
                    : 'Instala esta aplicación mágica en tu celular para usarla a pantalla completa.'}
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg transition-colors shrink-0"
                aria-label="Cerrar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2.5 z-10">
              <button
                onClick={handleInstallClick}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-900/20 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isIOS ? '¿Cómo Instalar?' : 'Instalar Aplicación'}</span>
              </button>
              
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Tal vez luego
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS or Fallback Installation Tutorial Modal */}
      <AnimatePresence>
        {showHowToModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHowToModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100 z-10"
              id="pwa-install-tutorial"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-purple-400" />
                  <span className="font-serif font-semibold tracking-wide text-slate-200">Guía de Instalación</span>
                </div>
                <button
                  onClick={() => { triggerHaptic(15); setShowHowToModal(false); }}
                  className="text-slate-500 hover:text-slate-300 p-1 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isIOS ? (
                // iOS Safari Steps
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sigue estos simples pasos místicos en Safari para tener el Oráculo en tu pantalla de inicio:
                  </p>
                  
                  <div className="space-y-3.5 my-2">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xs font-serif font-bold text-purple-300 shrink-0">
                        1
                      </div>
                      <div className="text-xs text-slate-300">
                        Presiona el botón de <span className="font-semibold text-purple-300 flex items-center gap-1 inline-flex bg-slate-800 px-1.5 py-0.5 rounded">Compartir <Share2 className="w-3 h-3 text-purple-400" /></span> en la barra inferior de tu navegador Safari.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xs font-serif font-bold text-purple-300 shrink-0">
                        2
                      </div>
                      <div className="text-xs text-slate-300">
                        Desplázate hacia abajo por el menú y selecciona la opción <span className="font-semibold text-purple-300 flex items-center gap-1 inline-flex bg-slate-800 px-1.5 py-0.5 rounded">Agregar a Inicio <PlusSquare className="w-3 h-3 text-purple-400" /></span>.
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xs font-serif font-bold text-purple-300 shrink-0">
                        3
                      </div>
                      <div className="text-xs text-slate-300">
                        Presiona <span className="font-semibold text-purple-300 bg-slate-800 px-1.5 py-0.5 rounded">Agregar</span> en la esquina superior derecha y listo. ¡El icono aparecerá en tu teléfono!
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Desktop or regular mobile instructions (Android/Chrome fallback)
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sigue estos pasos para instalar el Oráculo de Tarot en tu celular:
                  </p>
                  
                  <div className="space-y-3.5 my-2">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xs font-serif font-bold text-purple-300 shrink-0">
                        1
                      </div>
                      <div className="text-xs text-slate-300">
                        Abre el menú del navegador (usualmente <span className="font-semibold">tres puntos ⋮</span> arriba a la derecha).
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xs font-serif font-bold text-purple-300 shrink-0">
                        2
                      </div>
                      <div className="text-xs text-slate-300">
                        Selecciona <span className="font-semibold text-purple-300">Instalar Aplicación</span> o <span className="font-semibold text-purple-300">Agregar a la Pantalla Principal</span>.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => { triggerHaptic(15); setShowHowToModal(false); }}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-xl shadow transition-colors cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
