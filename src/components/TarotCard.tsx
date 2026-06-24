import { TarotCard, getCloudinaryUrl, getCloudinaryBackUrl } from '../data/tarot';
import { motion } from 'motion/react';
import { 
  Compass, Sparkles, Ship, Home, Trees, Cloud, Flame, Skull, Flower, Scissors,
  Feather, Smile, Eye, Shield, Stars, Send, Heart, Hotel, Palmtree, Mountain,
  GitFork, Bug, HeartHandshake, Award, BookOpen, Mail, User, UserCheck, SunDim,
  Sun, Moon, Key, Coins, Anchor, Activity, EyeIcon, AwardIcon
} from 'lucide-react';

interface TarotCardProps {
  card: TarotCard;
  deckId?: string;
  traditionId?: string; // 'rws' | 'marsella' | 'egipcio' | 'lenormand'
  faceDown?: boolean;
  onClick?: () => void;
  className?: string;
  staticMode?: boolean;
}

function LenormandIcon({ name, className }: { name: string; className: string }) {
  switch (name) {
    case 'Compass': return <Compass className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Ship': return <Ship className={className} />;
    case 'Home': return <Home className={className} />;
    case 'Trees': return <Trees className={className} />;
    case 'Cloud': return <Cloud className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'Skull': return <Skull className={className} />;
    case 'Flower': return <Flower className={className} />;
    case 'Scissors': return <Scissors className={className} />;
    case 'Feather': return <Feather className={className} />;
    case 'Smile': return <Smile className={className} />;
    case 'Eye': return <Eye className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'Stars': return <Stars className={className} />;
    case 'Send': return <Send className={className} />;
    case 'Heart': return <Heart className={className} />;
    case 'Hotel': return <Hotel className={className} />;
    case 'Palmtree': return <Palmtree className={className} />;
    case 'Mountain': return <Mountain className={className} />;
    case 'GitFork': return <GitFork className={className} />;
    case 'Bug': return <Bug className={className} />;
    case 'HeartHandshake': return <HeartHandshake className={className} />;
    case 'Award': return <Award className={className} />;
    case 'BookOpen': return <BookOpen className={className} />;
    case 'Mail': return <Mail className={className} />;
    case 'User': return <User className={className} />;
    case 'UserCheck': return <UserCheck className={className} />;
    case 'SunDim': return <SunDim className={className} />;
    case 'Sun': return <Sun className={className} />;
    case 'Moon': return <Moon className={className} />;
    case 'Key': return <Key className={className} />;
    case 'Coins': return <Coins className={className} />;
    case 'Anchor': return <Anchor className={className} />;
    default: return <Activity className={className} />;
  }
}

export default function TarotCardComponent({ 
  card, 
  deckId = '1909-pam-a', 
  traditionId = 'rws',
  faceDown = false, 
  onClick, 
  className = '',
  staticMode = false
}: TarotCardProps) {
  const imageUrl = getCloudinaryUrl(card.index, deckId);
  const backUrl = getCloudinaryBackUrl(deckId);
  const isLenormand = card.type === 'lenormand' || traditionId === 'lenormand';

  // Back of card styles based on tradition
  const getBackDesign = () => {
    switch (traditionId) {
      case 'marsella':
        return (
          <div className="absolute inset-0 bg-amber-950/95 flex items-center justify-center p-3">
            <div className="w-full h-full border-2 border-amber-600/30 rounded-lg flex items-center justify-center relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/40 via-stone-900 to-stone-950">
              {/* Geometric pattern */}
              <div className="absolute inset-2 border border-amber-600/10 rounded" />
              <div className="grid grid-cols-4 gap-2 opacity-15">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="w-4 h-4 rotate-45 border border-amber-500" />
                ))}
              </div>
              <span className="absolute text-[8px] tracking-[0.4em] text-amber-500/40 uppercase font-serif">MARSEILLE</span>
            </div>
          </div>
        );
      case 'egipcio':
        return (
          <div className="absolute inset-0 bg-[#16120c] flex items-center justify-center p-3 border-2 border-amber-900/40 rounded-xl">
            <div className="w-full h-full border border-amber-600/20 rounded-lg flex flex-col items-center justify-center relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/60 via-[#1a150e] to-black">
              {/* Egyptian Eye / Ankh emblem */}
              <div className="w-12 h-12 rounded-full border border-amber-500/30 flex items-center justify-center bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                <SunDim className="w-6 h-6 text-amber-500/50" />
              </div>
              <div className="absolute top-2 text-[7px] text-amber-600/30 font-mono tracking-widest">HERMETISMO</div>
              <div className="absolute bottom-2 text-[7px] text-amber-600/30 font-mono tracking-widest">EGIPCIO</div>
            </div>
          </div>
        );
      case 'lenormand':
        return (
          <div className="absolute inset-0 bg-teal-950/95 flex items-center justify-center p-4">
            <div className="w-full h-full border-2 border-emerald-600/20 rounded-lg flex items-center justify-center relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950/40 via-teal-950 to-stone-950">
              <div className="absolute inset-1.5 border border-emerald-500/10 rounded-md" />
              <div className="w-10 h-10 rounded-full border border-emerald-500/20 flex items-center justify-center bg-emerald-950/20">
                <Flower className="w-5 h-5 text-emerald-500/40" />
              </div>
              <span className="absolute bottom-3 text-[8px] font-serif tracking-widest text-emerald-500/30">LENORMAND</span>
            </div>
          </div>
        );
      default: // Rider Waite classic
        return (
          <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
            <img 
              src={backUrl} 
              alt="Card Back" 
              className="w-full h-full object-cover pointer-events-none opacity-85"
              crossOrigin="anonymous"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop';
              }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/30 via-slate-950/10 to-slate-950/90 pointer-events-none" />
          </div>
        );
    }
  };

  // Render simple flat card when in static export mode
  if (staticMode) {
    return (
      <div 
        className={`relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-lg border ${
          isLenormand 
            ? 'bg-[#f7f3e8] border-2 border-amber-800/40 text-stone-900' 
            : traditionId === 'marsella'
              ? 'bg-stone-950 border border-amber-900/40 text-stone-200'
              : traditionId === 'egipcio'
                ? 'bg-[#16120c] border border-yellow-800/40 text-amber-100'
                : 'bg-slate-900 border border-slate-700/50 text-slate-100'
        } ${className}`}
      >
        {faceDown ? (
          getBackDesign()
        ) : (
          isLenormand ? (
            <div className="w-full h-full p-3 flex flex-col justify-between relative bg-[#f9f6ef]">
              <div className="absolute inset-1 border border-amber-800/10 rounded-lg pointer-events-none" />
              <div className="flex justify-between items-center z-10">
                <div className="w-7 h-7 rounded-full bg-[#fcfaf2] border border-amber-800/30 flex items-center justify-center font-serif text-xs font-bold text-amber-950">
                  {card.number || 1}
                </div>
                <div className="text-[10px] px-1.5 py-0.5 rounded bg-[#f5f1e5] border border-stone-300 font-serif font-bold text-stone-700">
                  {card.playingCard || 'A ♥'}
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center py-2 z-10">
                <LenormandIcon name={card.iconName || 'Compass'} className="w-8 h-8 text-amber-800/85" />
              </div>
              <div className="text-center z-10">
                <h3 className="text-[11px] font-serif font-bold text-amber-950 tracking-wide border-t border-amber-800/10 pt-1">
                  {card.name}
                </h3>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={card.name} 
                  className={`w-full h-full object-cover ${
                    traditionId === 'marsella' 
                      ? 'sepia-[0.35] contrast-[1.1] brightness-[0.9] saturate-[1.15]' 
                      : traditionId === 'egipcio'
                        ? 'sepia contrast-[1.15] brightness-[0.85] saturate-[0.9] hue-rotate-[5deg]'
                        : 'brightness-[0.95]'
                  }`}
                  crossOrigin="anonymous"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1633519446059-e3eb6c336b13?q=80&w=600&auto=format&fit=crop';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 text-xs">
                  Sin imagen
                </div>
              )}
              {traditionId === 'marsella' && (
                <div className="absolute inset-0 bg-amber-900/5 mix-blend-color-burn pointer-events-none" />
              )}
              {traditionId === 'egipcio' && (
                <div className="absolute inset-0 bg-yellow-900/10 mix-blend-color pointer-events-none" />
              )}
            </div>
          )
        )}
      </div>
    );
  }

  return (
    <div 
      className={`relative group perspective-1000 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      style={{ perspective: '1000px' }}
    >
      <motion.div 
        className="w-full aspect-[2/3] relative preserve-3d"
        animate={{ 
          rotateY: faceDown ? 180 : 0,
          scale: faceDown ? 1 : 1.03
        }}
        transition={{ duration: 0.6, type: 'spring', bounce: 0.12 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front of card */}
        <div 
          className={`absolute inset-0 backface-hidden rounded-xl shadow-xl overflow-hidden transition-all duration-500 ease-out ${
            isLenormand 
              ? 'bg-[#f7f3e8] border-2 border-amber-800/40 text-stone-900 group-hover:border-amber-600/80 group-hover:shadow-[0_0_25px_rgba(217,119,6,0.3)]' 
              : traditionId === 'marsella'
                ? 'bg-stone-950 border border-amber-900/40 text-stone-200 group-hover:border-amber-500/60 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]'
                : traditionId === 'egipcio'
                  ? 'bg-slate-950 border border-yellow-800/40 text-amber-100 group-hover:border-yellow-600/60 group-hover:shadow-[0_0_25px_rgba(202,138,4,0.3)]'
                  : 'bg-slate-900 border border-slate-700/50 text-slate-100 group-hover:border-purple-500/50 group-hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]'
          }`}
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(0deg)',
            opacity: faceDown ? 0 : 1,
            zIndex: faceDown ? 0 : 10,
            transition: 'opacity 0.2s ease-in-out'
          }}
        >
          {/* Custom rendering for Lenormand deck front */}
          {isLenormand ? (
            <div className="w-full h-full p-3 flex flex-col justify-between relative bg-[#f9f6ef]">
              {/* Subtle background flourishes */}
              <div className="absolute inset-1 border border-amber-800/10 rounded-lg pointer-events-none" />
              <div className="absolute inset-1.5 border border-amber-800/5 rounded pointer-events-none" />
              
              {/* Top Header Badge */}
              <div className="flex justify-between items-center z-10">
                {/* Number */}
                <div className="w-7 h-7 rounded-full bg-[#fcfaf2] border border-amber-800/30 flex items-center justify-center font-serif text-sm font-semibold text-amber-950 shadow-sm">
                  {card.number || 1}
                </div>
                {/* Playing Card Inserts */}
                <div className="text-xs px-1.5 py-0.5 rounded bg-[#f5f1e5] border border-stone-300 font-serif font-bold text-stone-700">
                  {card.playingCard || 'A ♥'}
                </div>
              </div>

              {/* Central Symbol Icon Illustration */}
              <div className="flex-1 flex flex-col items-center justify-center py-4 z-10">
                <div className="w-16 h-16 rounded-full border border-amber-800/10 bg-amber-500/5 flex items-center justify-center relative shadow-inner">
                  {/* Sunburst background */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-amber-500/5 to-transparent animate-pulse" />
                  <LenormandIcon name={card.iconName || 'Compass'} className="w-9 h-9 text-amber-800/85" />
                </div>
              </div>

              {/* Footer text */}
              <div className="text-center z-10">
                <span className="text-[10px] font-mono tracking-widest text-amber-800/60 uppercase block mb-0.5">ORÁCULO</span>
                <h3 className="text-[13px] font-serif font-semibold text-amber-950 tracking-wide border-t border-amber-800/10 pt-1">
                  {card.name}
                </h3>
              </div>
            </div>
          ) : (
            // Standard Tarot Card with Tradition-specific Filter layer
            <div className="relative w-full h-full">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={card.name} 
                  className={`w-full h-full object-cover pointer-events-none transition-all duration-500 ${
                    traditionId === 'marsella' 
                      ? 'sepia-[0.35] contrast-[1.1] brightness-[0.9] saturate-[1.15]' 
                      : traditionId === 'egipcio'
                        ? 'sepia contrast-[1.15] brightness-[0.85] saturate-[0.9] hue-rotate-[5deg]'
                        : 'brightness-[0.95]'
                  }`}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1633519446059-e3eb6c336b13?q=80&w=600&auto=format&fit=crop';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 text-xs">
                  Sin imagen
                </div>
              )}

              {/* Overlays */}
              {traditionId === 'marsella' && (
                <div className="absolute inset-0 bg-amber-900/5 mix-blend-color-burn pointer-events-none border border-amber-900/20" />
              )}
              {traditionId === 'egipcio' && (
                <div className="absolute inset-0 bg-yellow-900/10 mix-blend-color pointer-events-none border border-yellow-800/30" />
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-transparent to-indigo-500/0 group-hover:from-purple-500/15 group-hover:to-indigo-500/15 pointer-events-none transition-all duration-500" />
            </div>
          )}
        </div>

        {/* Back of card */}
        <motion.div 
          animate={faceDown ? {
            boxShadow: traditionId === 'lenormand'
              ? ['0px 0px 15px -5px rgba(16,185,129,0.3)', '0px 0px 25px 5px rgba(16,185,129,0.5)', '0px 0px 15px -5px rgba(16,185,129,0.3)']
              : traditionId === 'egipcio'
                ? ['0px 0px 15px -5px rgba(245,158,11,0.3)', '0px 0px 25px 5px rgba(245,158,11,0.5)', '0px 0px 15px -5px rgba(245,158,11,0.3)']
                : ['0px 0px 15px -5px rgba(168,85,247,0.3)', '0px 0px 30px 5px rgba(168,85,247,0.6)', '0px 0px 15px -5px rgba(168,85,247,0.3)']
          } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 backface-hidden rounded-xl border border-purple-900/40 shadow-xl overflow-hidden" 
          style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            opacity: faceDown ? 1 : 0,
            zIndex: faceDown ? 10 : 0,
            transition: 'opacity 0.2s ease-in-out'
          }}
        >
          {getBackDesign()}
        </motion.div>
      </motion.div>
    </div>
  );
}
