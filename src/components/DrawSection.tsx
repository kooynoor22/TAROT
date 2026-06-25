import { useState, useEffect } from 'react';
import { TarotCard, getDeckForTradition, TRADITIONS, DECKS, getInterpretation } from '../data/tarot';
import TarotCardComponent from './TarotCard';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Save, Layers, RefreshCw, Zap, Check, HelpCircle, ArrowRight, CornerDownRight, Eye, BookOpen, AlertCircle, User as UserIcon, X, Camera } from 'lucide-react';
import { User } from 'firebase/auth';
import { saveReading, getPeople, Person } from '../lib/firebase';
import { triggerHaptic } from '../lib/haptic';
import { soundManager } from '../lib/sound';
import SharePostcardModal from './SharePostcardModal';

type Step = 'setup' | 'shuffle' | 'cut' | 'reveal';
type SpreadType = 'single' | 'three' | 'celtic';

interface DrawnCardState {
  card: TarotCard;
  faceDown: boolean;
}

interface DrawSectionProps {
  user: User | null;
  preselectedPerson?: Person | null;
  onClearPreselectedPerson?: () => void;
}

export default function DrawSection({ user, preselectedPerson, onClearPreselectedPerson }: DrawSectionProps) {
  const [step, setStep] = useState<Step>('setup');
  const [traditionId, setTraditionId] = useState<string>('rws');
  const [deckId, setDeckId] = useState<string>(DECKS[0].id);
  const [spreadType, setSpreadType] = useState<SpreadType>('three');
  const [question, setQuestion] = useState<string>('');
  
  // People/Consultant selection states
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');

  // Fetch people list if logged in
  useEffect(() => {
    if (user) {
      getPeople(user.uid)
        .then(data => {
          setPeople(data);
          // Set default selected person to the "isSelf" person if no preselection exists
          if (!preselectedPerson) {
            const selfPerson = data.find(p => p.isSelf === true);
            if (selfPerson) {
              setSelectedPersonId(selfPerson.id);
            }
          }
        })
        .catch(err => {
          console.error("Error loading people in DrawSection:", err);
        });
    } else {
      setPeople([]);
    }
  }, [user, preselectedPerson]);

  // Sync preselected person
  useEffect(() => {
    if (preselectedPerson) {
      setSelectedPersonId(preselectedPerson.id);
    } else {
      // If we cleared preselected, fall back to self person if available
      const selfPerson = people.find(p => p.isSelf === true);
      if (selfPerson) {
        setSelectedPersonId(selfPerson.id);
      } else {
        setSelectedPersonId('');
      }
    }
  }, [preselectedPerson, people]);

  // Ritual / Shuffling states
  const [shufflingProgress, setShufflingProgress] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleLog, setShuffleLog] = useState<string>('');
  
  // Cut States
  const [cutState, setCutState] = useState<'uncut' | 'divided' | 'reunited'>('uncut');
  
  // Drawn cards
  const [drawnCards, setDrawnCards] = useState<DrawnCardState[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Active card details to inspect
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Fisher-Yates Shuffle Algorithm with visual simulation
  const performFisherYatesShuffle = () => {
    setIsShuffling(true);
    setShufflingProgress(0);
    setShuffleLog('Iniciando Algoritmo de Fisher-Yates...');
    triggerHaptic(30);
    soundManager.playShuffle(4500); // Play shuffle sound for 4.5 seconds
    
    // Retrieve deck according to tradition
    const sourceDeck = getDeckForTradition(traditionId);
    let currentDeck = [...sourceDeck];
    let i = currentDeck.length - 1;
    
    // Calculate interval to distribute shuffling evenly over exactly 4.5 seconds
    const intervalTime = Math.floor(4500 / (currentDeck.length - 1 || 1));
    
    const interval = setInterval(() => {
      if (i > 0) {
        // Pick a random index from 0 to i
        const j = Math.floor(Math.random() * (i + 1));
        // Swap elements i and j
        const temp = currentDeck[i];
        currentDeck[i] = currentDeck[j];
        currentDeck[j] = temp;
        
        const percent = Math.round(((sourceDeck.length - 1 - i) / (sourceDeck.length - 1)) * 100);
        setShufflingProgress(percent);
        setShuffleLog(`Algoritmo: Permutando posición ${i} por ${j}...`);
        
        // Rhythmic gentle vibrations during shuffle
        if (i % 4 === 0) {
          triggerHaptic(10);
        }
        
        i--;
      } else {
        clearInterval(interval);
        setShufflingProgress(100);
        setShuffleLog('¡Mazo ordenado matemáticamente con equiprobabilidad de Fisher-Yates!');
        triggerHaptic([35, 50, 35]); // Done haptic
        
        // Select cards based on spread
        let numCards = 3;
        if (spreadType === 'single') numCards = 1;
        if (spreadType === 'celtic') numCards = 10;
        
        const selected = currentDeck.slice(0, numCards).map(card => ({ card, faceDown: true }));
        setDrawnCards(selected);
        
        setTimeout(() => {
          setIsShuffling(false);
          setStep('cut');
        }, 1200);
      }
    }, intervalTime);
  };

  const handleCardClick = (index: number) => {
    if (drawnCards[index].faceDown) {
      triggerHaptic(25);
      soundManager.playFlip(); // Play flip sound effect
      setDrawnCards(prev => {
        const next = [...prev];
        next[index].faceDown = false;
        return next;
      });
      setActiveCardIndex(index);
      
      // Auto smooth scroll to interpretation section on mobile so they don't miss it!
      setTimeout(() => {
        const interpretationElement = document.getElementById('interpretation-section');
        if (interpretationElement) {
          interpretationElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 150);
    } else {
      triggerHaptic(15);
      // Toggle details display if already revealed
      const nextIndex = activeCardIndex === index ? null : index;
      setActiveCardIndex(nextIndex);
      
      if (nextIndex !== null) {
        setTimeout(() => {
          const interpretationElement = document.getElementById('interpretation-section');
          if (interpretationElement) {
            interpretationElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 150);
      }
    }
  };

  const handleCutMazo = () => {
    triggerHaptic([20, 35, 20]);
    setCutState('divided');
  };

  const handleReunitePiles = () => {
    triggerHaptic(40);
    setCutState('reunited');
    setTimeout(() => {
      setStep('reveal');
    }, 1200);
  };

  const allFlipped = drawnCards.length > 0 && drawnCards.every(c => !c.faceDown);

  const handleSave = async () => {
    if (!user || !allFlipped || saved) return;
    setSaving(true);
    triggerHaptic(20);
    try {
      let activePerson = people.find(p => p.id === selectedPersonId);
      if (!activePerson) {
        activePerson = people.find(p => p.isSelf === true);
      }
      await saveReading(
        user.uid, 
        drawnCards.map(c => c.card.id), 
        deckId,
        activePerson?.id || undefined,
        activePerson?.name || undefined,
        question || undefined
      );
      setSaved(true);
      triggerHaptic([20, 50, 20]); // Success double haptic
    } catch (e) {
      console.error("Failed to save reading", e);
    } finally {
      setSaving(false);
    }
  };

  const startNewRitual = () => {
    triggerHaptic(20);
    setStep('setup');
    setDrawnCards([]);
    setCutState('uncut');
    setSaved(false);
    setShufflingProgress(0);
    setQuestion('');
    setActiveCardIndex(null);
  };

  const getSpreadInfo = () => {
    switch (spreadType) {
      case 'single':
        return { name: 'Carta Única', desc: 'Consejo rápido o respuesta Sí/No para sintonizar el presente.' };
      case 'celtic':
        return { name: 'Cruz Celta', desc: 'Lectura completa de 10 posiciones. Analiza la situación actual, subconsciente, obstáculos y desenlace.' };
      default:
        return { name: 'Lectura de 3 Cartas', desc: 'Análisis clásico temporal que describe tu Pasado, Presente y Futuro.' };
    }
  };

  const getPositionLabel = (index: number) => {
    if (spreadType === 'single') return 'Consejo del Oráculo';
    if (spreadType === 'three') {
      return index === 0 ? 'Pasado' : index === 1 ? 'Presente' : 'Futuro';
    }
    const celticCrossPositions = [
      '1. Situación Actual',
      '2. Obstáculo / Desafío',
      '3. Subconsciente / Raíz',
      '4. Pasado Reciente',
      '5. Coronación / Metas',
      '6. Futuro Inmediato',
      '7. El Consultante',
      '8. Entorno / Influencias',
      '9. Esperanzas y Temores',
      '10. Resultado Final'
    ];
    return celticCrossPositions[index] || `Posición ${index + 1}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12">
      <AnimatePresence mode="wait">
        
        {/* STEP 1: SETUP */}
        {step === 'setup' && (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="text-center space-y-8 w-full max-w-3xl px-4"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shadow-[0_0_50px_-10px_rgba(168,85,247,0.4)] animate-pulse">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            
            <div>
              <h2 className="text-3xl font-serif text-slate-100 mb-3 tracking-wide">Ritual de Consulta al Tarot</h2>
              <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
                Antes de barajar, define tu intención, selecciona tu mazo tradicional o tu oráculo místico predilecto.
              </p>
            </div>

            <div className="bg-slate-900/50 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6 text-left shadow-2xl backdrop-blur-sm">
              
              {/* Tradition Selection (RWS, Marsella, Egipcio, Lenormand) */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Elegir Tradición del Sistema
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TRADITIONS.map((trad) => {
                    const active = traditionId === trad.id;
                    return (
                      <button
                        key={trad.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic(15);
                          setTraditionId(trad.id);
                          // Reset spread compatibility if needed
                          if (trad.id === 'lenormand' && spreadType === 'celtic') {
                            setSpreadType('three'); // Lenormand default is 3 cards, not celtic cross
                          }
                        }}
                        className={`p-4 rounded-xl text-left border transition-all duration-300 flex flex-col justify-between ${
                          active 
                            ? 'bg-purple-950/30 border-purple-500 shadow-md shadow-purple-500/10' 
                            : 'bg-slate-950 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/40'
                        }`}
                      >
                        <div>
                          <div className={`text-sm font-serif font-semibold flex items-center gap-2 ${active ? 'text-purple-300' : 'text-slate-200'}`}>
                            {trad.name}
                            {active && <Check className="w-4 h-4 text-purple-400" />}
                          </div>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-sans">
                            {trad.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Consultant Selector */}
              {user && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-purple-400" />
                    Consultante de la Lectura
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedPersonId}
                      onChange={(e) => {
                        setSelectedPersonId(e.target.value);
                        if (e.target.value === '' && onClearPreselectedPerson) {
                          onClearPreselectedPerson();
                        }
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                    >
                      <option value="">Para mí / Consulta General</option>
                      {people.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.isSelf ? `Mi Ficha Personal: ${p.name}` : `Ficha: ${p.name}`}
                        </option>
                      ))}
                    </select>
                    {selectedPersonId && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPersonId('');
                          if (onClearPreselectedPerson) {
                            onClearPreselectedPerson();
                          }
                        }}
                        className="px-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 rounded-xl transition-all flex items-center justify-center"
                        title="Limpiar Selección"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {selectedPersonId && (() => {
                    const activePerson = people.find(p => p.id === selectedPersonId);
                    if (!activePerson) return null;
                    return (
                      <p className="text-xs text-purple-300 italic px-1">
                        Esta lectura se guardará e indexará en el historial de <strong className="font-semibold">{activePerson.name}</strong>.
                      </p>
                    );
                  })()}
                </div>
              )}

              {/* Question Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-400" />
                  Escribe tu Pregunta o Intención
                </label>
                <input 
                  type="text" 
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ej: ¿Qué camino debo tomar en mi vida profesional? (Opcional)"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors placeholder:text-slate-600 text-sm"
                />
              </div>

              {/* Spread Type Selection */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  Selección: Cantidad de Cartas
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['single', 'three', 'celtic'] as SpreadType[]).map((type) => {
                    // Celtic Cross is disabled or discouraged for Lenormand
                    const isLenormand = traditionId === 'lenormand';
                    const isDisabled = isLenormand && type === 'celtic';
                    const active = spreadType === type;
                    const labels = {
                      single: { title: 'Carta Única', cards: '1 Carta' },
                      three: { title: 'Temporal', cards: '3 Cartas' },
                      celtic: { title: 'Cruz Celta', cards: '10 Cartas' }
                    };
                    return (
                      <button
                        key={type}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          triggerHaptic(15);
                          setSpreadType(type);
                        }}
                        className={`p-4 rounded-xl text-left border transition-all ${
                          active 
                            ? 'bg-purple-900/20 border-purple-500 shadow-lg shadow-purple-500/10' 
                            : isDisabled
                              ? 'bg-slate-950/20 border-slate-900 opacity-40 cursor-not-allowed'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className={`text-sm font-medium ${active ? 'text-purple-300' : 'text-slate-300'}`}>
                          {labels[type].title}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {labels[type].cards} {isDisabled && '(Solo 1 o 3 en Lenormand)'}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 italic mt-1 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/40">
                  {getSpreadInfo().desc}
                </p>
              </div>

              {/* Deck Selection (Only show if not Lenormand, as Lenormand is its own system) */}
              {traditionId !== 'lenormand' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    Variante de Mazo Xilográfico / Artístico
                  </label>
                  <select 
                    value={deckId} 
                    onChange={(e) => setDeckId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                  >
                    {DECKS.map(deck => (
                      <option key={deck.id} value={deck.id}>{deck.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <button
                onClick={() => setStep('shuffle')}
                className="w-full mt-2 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium tracking-wide transition-all shadow-lg shadow-purple-500/25 active:scale-95 flex items-center justify-center gap-2 font-serif"
              >
                Comenzar Preparación
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: SHUFFLING (FISHER-YATES) */}
        {step === 'shuffle' && (
          <motion.div 
            key="shuffle"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="text-center space-y-8 w-full max-w-xl px-4"
          >
            <div className="space-y-2">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">Paso 1 de 3</span>
              <h2 className="text-2xl font-serif text-slate-100">Conexión previa & Barajado</h2>
              <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                <strong>Conexión previa:</strong> Baraja las cartas mientras te concentras profundamente en el consultante o en la pregunta que deseas resolver.
              </p>
            </div>

            {question && (
              <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 max-w-md mx-auto text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Tu pregunta de enfoque:</p>
                <p className="text-sm text-purple-300 italic">"{question}"</p>
              </div>
            )}

            {/* Simulated interactive card deck display */}
            <div className="relative h-44 flex items-center justify-center overflow-hidden">
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    animate={isShuffling ? {
                      x: [0, (i - 2) * 50, -(i - 2) * 50, 0],
                      y: [0, -10, 10, 0],
                      rotate: [0, (i - 2) * 8, -(i - 2) * 8, 0],
                    } : {}}
                    transition={{
                      repeat: Infinity,
                      duration: 0.8,
                      ease: "easeInOut",
                      delay: i * 0.05
                    }}
                    className="w-20 aspect-[2/3] bg-slate-950 border border-purple-900/60 rounded-lg shadow-xl flex items-center justify-center relative overflow-hidden"
                  >
                    {/* Tarot card pattern */}
                    <div className="absolute inset-1.5 border border-purple-500/20 rounded-md flex items-center justify-center bg-purple-950/10">
                      <div className="w-6 h-6 rounded-full border border-purple-500/30 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-purple-500/50" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
              <div className="text-left space-y-2.5 bg-slate-950/40 p-4 rounded-xl border border-slate-800/40 text-xs text-slate-400 leading-relaxed">
                <p className="font-semibold text-slate-300 flex items-center gap-1.5 font-serif">
                  <Zap className="w-4 h-4 text-amber-500" />
                  El Algoritmo de Fisher-Yates
                </p>
                <p>
                  Para aplicaciones de software o generadores automáticos de cartas, se utiliza el <strong>Algoritmo de Fisher-Yates</strong>. Es el método estándar de la informática para generar permutaciones verdaderamente aleatorias, asegurando que cualquier carta pueda salir en cualquier posición con la misma probabilidad exacta.
                </p>
              </div>

              {isShuffling ? (
                <div className="space-y-3">
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-purple-500"
                      initial={{ width: '0%' }}
                      animate={{ width: `${shufflingProgress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 font-mono text-center truncate h-4">
                    {shuffleLog}
                  </p>
                </div>
              ) : (
                <button
                  onClick={performFisherYatesShuffle}
                  className="w-full px-6 py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium tracking-wide transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 font-serif"
                >
                  <RefreshCw className="w-4 h-4" />
                  Barajar con Fisher-Yates
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 3: CUTTING THE DECK (3 PILES LEFT HANDED) */}
        {step === 'cut' && (
          <motion.div 
            key="cut"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="text-center space-y-8 w-full max-w-xl px-4"
          >
            <div className="space-y-2">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">Paso 2 de 3</span>
              <h2 className="text-2xl font-serif text-slate-100">Corte del Mazo</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                <strong>Corte del mazo:</strong> Divide el mazo en tres pilas con tu mano izquierda, luego vuelve a unirlas en un solo bloque para transferir tu energía a la baraja.
              </p>
            </div>

            {/* Cutting Area */}
            <div className="min-h-[220px] flex items-center justify-center">
              {cutState === 'uncut' && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative group cursor-pointer animate-bounce-subtle"
                  onClick={handleCutMazo}
                >
                  {/* Visual block representing stacked cards */}
                  <div className="absolute top-2 left-2 w-32 aspect-[2/3] bg-purple-950/20 rounded-xl border border-slate-800 shadow-md transform rotate-1" />
                  <div className="absolute top-1 left-1 w-32 aspect-[2/3] bg-purple-900/10 rounded-xl border border-slate-800 shadow-md transform -rotate-1" />
                  <div className="relative w-32 aspect-[2/3] bg-slate-950 border-2 border-purple-500/30 rounded-xl shadow-2xl flex flex-col items-center justify-center p-3 text-center transition-all duration-300 group-hover:border-purple-500/70">
                    <div className="absolute inset-2 border border-purple-500/10 rounded-lg flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full border border-purple-500/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="text-[10px] uppercase text-slate-500 tracking-wider font-serif">
                        {traditionId === 'lenormand' ? '36 Cartas' : '78 Cartas'}
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 text-xs font-medium text-purple-400 group-hover:text-purple-300 animate-pulse">
                    Toca aquí con tu mano izquierda para realizar el corte
                  </p>
                </motion.div>
              )}

              {cutState === 'divided' && (
                <div className="grid grid-cols-3 gap-4 w-full">
                  {(['Pila Izquierda', 'Pila Central', 'Pila Derecha']).map((pile, index) => (
                    <motion.div 
                      key={pile}
                      initial={{ 
                        opacity: 0, 
                        x: index === 0 ? 80 : index === 2 ? -80 : 0,
                        scale: 0.8
                      }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="w-24 aspect-[2/3] bg-slate-950 border border-purple-500/30 rounded-lg shadow-xl relative flex items-center justify-center">
                        <div className="absolute inset-1 border border-purple-500/10 rounded flex items-center justify-center bg-purple-950/5">
                          <span className="text-[10px] uppercase text-slate-500 font-mono">Pila {index + 1}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-serif text-purple-300/80">{pile}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {cutState === 'reunited' && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-32 aspect-[2/3] bg-slate-950 border-2 border-emerald-500/40 rounded-xl shadow-2xl flex flex-col items-center justify-center p-3 text-center"
                >
                  <div className="absolute inset-2 border border-emerald-500/10 rounded-lg flex flex-col items-center justify-center gap-2">
                    <Check className="w-6 h-6 text-emerald-400" />
                    <span className="text-[9px] uppercase text-emerald-400/80 tracking-wider font-mono">Pilas Reunidas</span>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex justify-center">
              {cutState === 'uncut' ? (
                <button
                  onClick={handleCutMazo}
                  className="px-6 py-2.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-xl text-sm font-medium transition-all"
                >
                  Cortar Mazo con la Mano Izquierda
                </button>
              ) : cutState === 'divided' ? (
                <button
                  onClick={handleReunitePiles}
                  className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-all shadow-md active:scale-95"
                >
                  Reunir Pilas en un Solo Bloque
                </button>
              ) : (
                <div className="text-xs text-emerald-400 flex items-center gap-2">
                  <Check className="w-4 h-4" /> El mazo está preparado para revelar el destino...
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 4: REVEAL CARDS (INDIVIDUAL FLIP CARDS ON CLICK) */}
        {step === 'reveal' && (
          <motion.div 
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center space-y-12"
          >
            <div className="text-center space-y-2 max-w-xl">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">Paso 3 de 3</span>
              <h2 className="text-3xl font-serif text-slate-100">Revelación del Oráculo</h2>
              <p className="text-sm text-slate-400">
                Las cartas se colocaron de forma misteriosa. <strong>Presiona cada carta</strong> para revelarla e inspeccionar su significado místico.
              </p>
              {question && (
                <div className="mt-2 bg-slate-900/40 px-4 py-2 rounded-lg border border-slate-800 inline-block text-xs text-purple-300">
                  Pregunta de enfoque: <span className="italic">"{question}"</span>
                </div>
              )}
            </div>

            {/* Snap-scrolling swipeable container on mobile, grid on desktop */}
            <div className="w-full max-w-5xl">
              <div 
                className={`flex sm:grid gap-6 overflow-x-auto sm:overflow-x-visible snap-x snap-mandatory pb-4 w-full px-4 scroll-smooth max-w-full justify-start sm:justify-center ${
                  spreadType === 'single' 
                    ? 'sm:grid-cols-1 sm:max-w-[240px] mx-auto' 
                    : spreadType === 'three' 
                      ? 'sm:grid-cols-3' 
                      : 'grid-cols-2 sm:grid-cols-5'
                }`}
              >
                <AnimatePresence>
                  {drawnCards.map((item, i) => {
                    const isRevealed = !item.faceDown;
                    const isSelected = activeCardIndex === i;
                    return (
                      <motion.div
                        key={item.card.id + i}
                        id={`revealed-card-container-${i}`}
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ 
                          opacity: 1, 
                          scale: isSelected ? 1.05 : 1, 
                          y: 0,
                          borderColor: isSelected ? 'rgba(168,85,247,0.5)' : 'rgba(30,41,59,0.4)'
                        }}
                        transition={{ delay: i * 0.05, type: "spring", stiffness: 100 }}
                        className={`snap-center shrink-0 w-[240px] sm:w-auto flex flex-col items-center gap-4 bg-slate-900/30 p-4 rounded-xl border transition-all ${
                          isSelected ? 'border-purple-500/50 bg-purple-950/5 shadow-lg shadow-purple-500/5' : 'border-slate-800/40'
                        }`}
                      >
                        <span className="text-xs font-serif tracking-widest text-purple-300/80 uppercase border-b border-purple-500/20 pb-1 w-full text-center truncate px-2">
                          {getPositionLabel(i)}
                        </span>
                        <div className="w-full max-w-[180px]">
                          <TarotCardComponent
                            card={item.card}
                            deckId={deckId}
                            traditionId={traditionId}
                            faceDown={item.faceDown}
                            onClick={() => handleCardClick(i)}
                          />
                        </div>
                        
                        {/* Tiny tip indicator below card */}
                        {item.faceDown ? (
                          <span className="text-[10px] text-purple-400/80 animate-pulse tracking-wide font-mono flex items-center gap-1">
                            <CornerDownRight className="w-3 h-3 text-purple-400" /> Clic para revelar
                          </span>
                        ) : (
                          <button 
                            onClick={() => setActiveCardIndex(isSelected ? null : i)}
                            className={`text-xs px-2.5 py-1 rounded-full font-serif border flex items-center gap-1.5 transition-colors ${
                              isSelected 
                                ? 'bg-purple-600/20 border-purple-500/40 text-purple-300' 
                                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            Ver Significado
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Carousel navigation dots on mobile */}
              {drawnCards.length > 1 && (
                <div className="flex sm:hidden justify-center gap-2 mt-4 px-4 py-2">
                  {drawnCards.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={() => {
                        triggerHaptic(10);
                        setActiveCardIndex(dotIdx);
                        const cardEl = document.getElementById(`revealed-card-container-${dotIdx}`);
                        if (cardEl) {
                          cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                        }
                      }}
                      className={`w-3 h-3 rounded-full transition-all duration-300 border border-purple-500/20 ${
                        activeCardIndex === dotIdx 
                          ? 'bg-purple-500 w-6' 
                          : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                      aria-label={`Ver carta ${dotIdx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Active Card Interpretation Details Section */}
            {activeCardIndex !== null && !drawnCards[activeCardIndex].faceDown && (() => {
              const activeItem = drawnCards[activeCardIndex];
              const info = getInterpretation(activeItem.card, traditionId);
              return (
                <motion.div 
                  id="interpretation-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-3xl bg-slate-900 border border-purple-500/20 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Card Title Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
                    <div>
                      <span className="text-[10px] font-mono tracking-widest text-purple-400 uppercase">
                        Posición: {getPositionLabel(activeCardIndex)}
                      </span>
                      <h3 className="text-2xl font-serif text-slate-100 flex items-center gap-2 mt-0.5">
                        {info.title}
                        {activeItem.card.playingCard && (
                          <span className="text-sm px-2 py-0.5 rounded bg-slate-950 text-slate-400 font-mono">
                            {activeItem.card.playingCard}
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="text-xs px-3 py-1 rounded-full bg-purple-950/40 text-purple-300 border border-purple-500/20 inline-block self-start font-medium font-serif">
                      Tradición: {info.traditionName}
                    </div>
                  </div>

                  {/* Core Interpretative text */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1.5 font-serif">
                          <Check className="w-4 h-4" />
                          Significado General / Luz
                        </span>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {info.meaning}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-rose-400 flex items-center gap-1.5 font-serif">
                          <AlertCircle className="w-4 h-4" />
                          Desafío / Sombra / Obstáculo
                        </span>
                        <p className="text-sm text-slate-400 leading-relaxed">
                          {info.obstacle}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 bg-slate-950/40 p-5 rounded-xl border border-slate-800/40">
                      <div className="space-y-1">
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-purple-300 flex items-center gap-1.5 font-serif">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          Consejo de la Tirada
                        </span>
                        <p className="text-sm text-slate-300 italic leading-relaxed">
                          "{info.advice}"
                        </p>
                      </div>

                      <div className="border-t border-slate-800/60 pt-3 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-mono">Plano Correspondiente:</span>
                        <span className="font-semibold text-purple-300 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                          {info.aspect}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
            
            {/* Action buttons footer */}
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <button
                onClick={startNewRitual}
                className="px-6 py-2.5 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-full font-medium transition-colors text-sm"
              >
                Nueva Tirada / Reiniciar
              </button>

              {allFlipped && (
                <button
                  onClick={() => { triggerHaptic(20); setIsShareModalOpen(true); }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all text-sm bg-gradient-to-r from-amber-500/20 to-purple-600/20 hover:from-amber-500/30 hover:to-purple-600/30 text-amber-300 border border-amber-500/30 hover:border-amber-400/50 shadow-lg shadow-amber-500/5 animate-bounce-slow"
                >
                  <Camera className="w-4 h-4 text-amber-400" />
                  Descargar Postal (Foto)
                </button>
              )}
              
              {allFlipped && user && (
                <button
                  onClick={handleSave}
                  disabled={saving || saved}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all text-sm ${
                    saved 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' 
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {saved ? 'Guardado' : saving ? 'Guardando...' : 'Guardar en Historial'}
                </button>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      <SharePostcardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        drawnCards={drawnCards}
        spreadType={spreadType}
        traditionId={traditionId}
        deckId={deckId}
        tarotistName={user?.displayName || user?.email || 'Tarotista'}
        consultantName={people.find(p => p.id === selectedPersonId)?.name || 'Consulta General'}
        question={question}
      />
    </div>
  );
}
