import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { getUserHistory } from '../lib/firebase';
import { tarotDeck } from '../data/tarot';
import { Clock, MoonStar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import TarotCardComponent from './TarotCard';

export default function HistorySection({ user }: { user: User | null }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getUserHistory(user.uid).then(data => {
        setHistory(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="py-20 text-center text-slate-500">
        <p>Conectando con los astros...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-purple-400 animate-pulse">
        <p>Leyendo los registros akáshicos...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center text-slate-500">
        <MoonStar className="w-12 h-12 mb-4 opacity-50" />
        <p>Aún no has realizado ninguna lectura.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="space-y-2">
        <h2 className="text-2xl font-serif text-purple-100">Tus Lecturas Pasadas</h2>
        <p className="text-sm text-slate-400">Revisa las energías que te han acompañado.</p>
      </div>

      <div className="space-y-12">
        {history.map((reading) => {
          const cards = reading.cards.map((id: string) => tarotDeck.find(c => c.id === id)).filter(Boolean);
          
          return (
            <div key={reading.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2 text-slate-400 border-b border-slate-800 pb-4">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium tracking-wide">
                  {reading.timestamp?.toDate ? format(reading.timestamp.toDate(), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es }) : 'Reciente'}
                </span>
                <span className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full ml-auto">
                  {cards.length === 1 ? 'Carta Única' : cards.length === 3 ? 'Tirada de 3 Cartas' : 'Cruz Celta (10 Cartas)'}
                </span>
              </div>
              
              <div className={`grid gap-4 sm:gap-6 mx-auto ${
                cards.length === 1 
                  ? 'grid-cols-1 max-w-[200px]' 
                  : cards.length === 3 
                    ? 'grid-cols-3 max-w-3xl' 
                    : 'grid-cols-2 sm:grid-cols-5 max-w-5xl'
              }`}>
                {cards.map((card: any, i: number) => {
                  const getPositionLabel = (index: number, total: number) => {
                    if (total === 1) return 'Consejo';
                    if (total === 3) {
                      return index === 0 ? 'Pasado' : index === 1 ? 'Presente' : 'Futuro';
                    }
                    const celticCrossLabels = [
                      '1. Situación Actual',
                      '2. Obstáculo',
                      '3. Raíz / Subconsciente',
                      '4. Pasado Reciente',
                      '5. Metas / Coronación',
                      '6. Futuro Inmediato',
                      '7. El Consultante',
                      '8. Entorno / Influencias',
                      '9. Esperanzas / Temores',
                      '10. Resultado Final'
                    ];
                    return celticCrossLabels[index] || `Posición ${index + 1}`;
                  };
                  
                  return (
                    <div key={i} className="flex flex-col items-center gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                      <span className="text-[10px] font-serif tracking-widest text-slate-400 text-center uppercase min-h-[32px] flex items-center justify-center leading-tight">
                        {getPositionLabel(i, cards.length)}
                      </span>
                      <div className="w-full max-w-[140px] aspect-[2/3]">
                        <TarotCardComponent card={card} deckId={reading.deckId || '1909-pam-a'} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
