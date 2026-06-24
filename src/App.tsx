import React, { useState, useEffect } from 'react';
import { TarotCard, tarotDeck } from './data/tarot';
import TarotCardComponent from './components/TarotCard';
import { Sparkles, MoonStar, History, BarChart3, LayoutDashboard, LogIn, LogOut, Users } from 'lucide-react';
import { initAuth, signInWithGoogle, signOutUser, Person } from './lib/firebase';
import { User } from 'firebase/auth';
import DrawSection from './components/DrawSection';
import PeopleSection from './components/PeopleSection';
import HistorySection from './components/HistorySection';
import StatsSection from './components/StatsSection';

export default function App() {
  const [activeTab, setActiveTab] = useState<'draw' | 'people' | 'history' | 'stats'>('draw');
  const [user, setUser] = useState<User | null>(null);
  const [preselectedPerson, setPreselectedPerson] = useState<Person | null>(null);

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
    setPreselectedPerson(person);
    setActiveTab('draw');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <MoonStar className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-serif text-slate-100 tracking-wide flex items-center gap-2">
                Oráculo del Tarot
                <Sparkles className="w-4 h-4 text-purple-400/70" />
              </h1>
              <p className="text-xs text-slate-400 font-medium tracking-widest uppercase">
                {user ? `Conectado: ${user.displayName || user.email || 'Místico'}` : 'Sintonizando energías...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 overflow-x-auto max-w-full">
              <NavButton active={activeTab === 'draw'} onClick={() => setActiveTab('draw')} icon={<LayoutDashboard className="w-4 h-4" />} label="Tirada" />
              {user && (
                <NavButton active={activeTab === 'people'} onClick={() => setActiveTab('people')} icon={<Users className="w-4 h-4" />} label="Consultantes" />
              )}
              <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History className="w-4 h-4" />} label="Historial" />
              <NavButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<BarChart3 className="w-4 h-4" />} label="Estadísticas" />
            </div>
            {user ? (
              <button 
                onClick={signOutUser}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium uppercase tracking-wider rounded-md text-slate-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider rounded-md bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/40 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Entrar con Google</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {!user && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-8 text-sm text-purple-200 max-w-2xl mx-auto flex flex-col items-center text-center">
            <p className="font-semibold mb-2 text-purple-300">Conéctate para guardar tu progreso</p>
            <p className="text-purple-300/80 mb-4">
              Inicia sesión con Google para llevar un registro de tus tiradas, gestionar consultantes y visualizar tus estadísticas.
            </p>
            <button 
                onClick={signInWithGoogle}
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
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
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
