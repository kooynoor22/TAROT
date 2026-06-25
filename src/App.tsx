import React, { useState, useEffect } from 'react';
import { TarotCard, tarotDeck } from './data/tarot';
import TarotCardComponent from './components/TarotCard';
import { Sparkles, MoonStar, History, BarChart3, LayoutDashboard, LogIn, LogOut, Users, Volume2, VolumeX } from 'lucide-react';
import { initAuth, signInWithGoogle, signOutUser, Person } from './lib/firebase';
import { User } from 'firebase/auth';
import DrawSection from './components/DrawSection';
import PeopleSection from './components/PeopleSection';
import HistorySection from './components/HistorySection';
import StatsSection from './components/StatsSection';
import InstallPrompt from './components/InstallPrompt';
import { triggerHaptic } from './lib/haptic';
import { soundManager } from './lib/sound';

export default function App() {
  const [activeTab, setActiveTab] = useState<'draw' | 'people' | 'history' | 'stats'>('draw');
  const [user, setUser] = useState<User | null>(null);
  const [preselectedPerson, setPreselectedPerson] = useState<Person | null>(null);
  const [muted, setMuted] = useState(soundManager.getMuted());

  useEffect(() => {
    // Subscribe to global mute state changes
    return soundManager.subscribe((isMuted) => {
      setMuted(isMuted);
    });
  }, []);

  useEffect(() => {
    // Attempt to start ambient audio on first user interaction if sound is unmuted
    const handleFirstInteraction = () => {
      if (!soundManager.getMuted()) {
        soundManager.startAmbient();
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  useEffect(() => {
    initAuth((u) => {
      setUser(u);
      // Reset state if user logs out
      if (!u) {
        setPreselectedPerson(null);
        setActiveTab('draw');
      }
    });
  }, []);

  const handleStartReadingForPerson = (person: Person) => {
    triggerHaptic(25);
    setPreselectedPerson(person);
    setActiveTab('draw');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full lg:w-auto justify-center lg:justify-start">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <MoonStar className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-center lg:text-left">
              <h1 className="text-xl sm:text-2xl font-serif text-slate-100 tracking-wide flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-x-2.5 gap-y-1.5">
                <span className="flex items-center gap-1.5">
                  Oráculo del Tarot
                  <Sparkles className="w-4 h-4 text-purple-400/70" />
                </span>
                <span className="text-[10px] sm:text-xs font-sans text-amber-400/90 font-semibold bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  {user ? (user.displayName || user.email || 'Tarotista') : 'Tarotista Invitado'}
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium tracking-widest uppercase mt-0.5">
                {user ? `Conectado: ${user.displayName || user.email || 'Místico'}` : 'Sintonizando energías...'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 w-full lg:w-auto">
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 overflow-x-auto max-w-full custom-scrollbar">
              <NavButton active={activeTab === 'draw'} onClick={() => setActiveTab('draw')} icon={<LayoutDashboard className="w-4 h-4" />} label="Tirada" />
              {user && (
                <NavButton active={activeTab === 'people'} onClick={() => setActiveTab('people')} icon={<Users className="w-4 h-4" />} label="Consultantes" />
              )}
              <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History className="w-4 h-4" />} label="Historial" />
              <NavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<BarChart3 className="w-4 h-4" />} label="Estadísticas" />
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  triggerHaptic(20);
                  soundManager.setMuted(!muted);
                }}
                className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all ${
                  muted 
                    ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-900' 
                    : 'bg-purple-600/20 text-purple-300 border-purple-500/30 hover:bg-purple-600/30 shadow-[0_0_15px_rgba(147,51,234,0.15)]'
                }`}
                title={muted ? "Activar Sonido" : "Silenciar"}
              >
                {muted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5 animate-pulse" />
                )}
              </button>

              {user ? (
                <button 
                  onClick={() => { triggerHaptic(30); signOutUser(); }}
                  className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium uppercase tracking-wider rounded-md text-slate-400 hover:text-red-400 transition-colors min-h-[40px]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Salir</span>
                </button>
              ) : (
                <button 
                  onClick={() => { triggerHaptic(30); signInWithGoogle(); }}
                  className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium uppercase tracking-wider rounded-md bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/40 transition-colors min-h-[40px]"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Entrar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-12">
        {!user && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-8 text-sm text-purple-200 max-w-2xl mx-auto flex flex-col items-center text-center">
            <p className="font-semibold mb-2 text-purple-300">Conéctate para guardar tu progreso</p>
            <p className="text-purple-300/80 mb-4">
              Inicia sesión con Google para llevar un registro de tus tiradas, gestionar consultantes y visualizar tus estadísticas.
            </p>
            <button 
                onClick={() => { triggerHaptic(35); signInWithGoogle(); }}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium uppercase tracking-wider rounded-md bg-purple-600 text-white shadow hover:bg-purple-500 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Entrar con Google
            </button>
          </div>
        )}
        {activeTab === 'draw' && (
          <DrawSection 
            user={user} 
            preselectedPerson={preselectedPerson}
            onClearPreselectedPerson={() => setPreselectedPerson(null)}
          />
        )}
        {activeTab === 'people' && user && (
          <PeopleSection 
            user={user} 
            onStartReadingForPerson={handleStartReadingForPerson}
            preselectedPersonId={preselectedPerson?.id}
          />
        )}
        {activeTab === 'history' && <HistorySection user={user} />}
        {activeTab === 'stats' && <StatsSection user={user} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/40 py-8 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono tracking-wider">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500/50 animate-pulse"></span>
            <span>Oráculo del Tarot • Versión 1.5</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-right">
            <span>Creado por <span className="text-slate-400 font-medium">Benjamín Hardoy</span></span>
            <span className="hidden sm:inline text-slate-800">|</span>
            <span>Sesión de: <span className="text-purple-400/80 font-medium">{user ? (user.displayName || user.email || 'Tarotista') : 'Invitado'}</span></span>
          </div>
        </div>
      </footer>

      {/* PWA Install Notice */}
      <InstallPrompt />
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  const handleClick = () => {
    triggerHaptic(15);
    onClick();
  };
  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider rounded-md transition-colors whitespace-nowrap ${
        active
          ? 'bg-slate-800 text-purple-300 shadow-sm'
          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
