import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { getUserStats } from '../lib/firebase';
import { tarotDeck } from '../data/tarot';
import { BarChart3, Star } from 'lucide-react';
import TarotCardComponent from './TarotCard';

export default function StatsSection({ user }: { user: User | null }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getUserStats(user.uid).then(data => {
        setStats(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) return null;
  if (loading) return <div className="py-20 text-center text-purple-400 animate-pulse">Calculando probabilidades cósmicas...</div>;

  if (!stats || stats.totalReadings === 0 || !stats.stats) {
    return (
      <div className="py-20 flex flex-col items-center text-slate-500">
        <BarChart3 className="w-12 h-12 mb-4 opacity-50" />
        <p>Aún no hay suficientes lecturas para generar estadísticas.</p>
      </div>
    );
  }

  // Sort cards by count
  const sortedStats = Object.entries(stats.stats)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 5); // Top 5

  return (
    <div className="space-y-12">
      <div className="space-y-2">
        <h2 className="text-2xl font-serif text-purple-100">Tus Energías Recurrentes</h2>
        <p className="text-sm text-slate-400">Cartas que más han aparecido en tus lecturas.</p>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <span className="text-slate-400">Lecturas totales realizadas</span>
          <span className="text-2xl font-serif text-purple-300">{stats.totalReadings}</span>
        </div>

        <div className="space-y-8">
          <h3 className="text-lg font-serif text-slate-200 flex items-center gap-2">
            <Star className="w-4 h-4 text-purple-400" />
            Cartas más frecuentes
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
            {sortedStats.map(([cardId, count]: any) => {
              const card = tarotDeck.find(c => c.id === cardId);
              if (!card) return null;
              
              return (
                <div key={cardId} className="flex flex-col items-center gap-4">
                  <div className="w-full">
                    <TarotCardComponent card={card} />
                  </div>
                  <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-medium text-slate-300">
                    Apareció {count} veces
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
