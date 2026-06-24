import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  getPeople, savePerson, updatePerson, deletePerson, Person, getUserHistory 
} from '../lib/firebase';
import { tarotDeck } from '../data/tarot';
import { 
  User as UserIcon, UserPlus, Calendar, Clock, MapPin, FileText, 
  Sparkles, Trash2, Edit3, Plus, X, Save, ArrowRight, CornerDownRight, 
  BookOpen, HelpCircle, ArrowLeft 
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import TarotCardComponent from './TarotCard';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../lib/haptic';

interface PeopleSectionProps {
  user: User | null;
  onStartReadingForPerson: (person: Person) => void;
  preselectedPersonId?: string | null;
}

export default function PeopleSection({ user, onStartReadingForPerson, preselectedPersonId }: PeopleSectionProps) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedPersonReadings, setSelectedPersonReadings] = useState<any[]>([]);
  const [loadingReadings, setLoadingReadings] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'details'>('list');
  
  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [notes, setNotes] = useState('');
  
  const [saving, setSaving] = useState(false);

  // Load people list
  const fetchPeople = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getPeople(user.uid);
      setPeople(data);
      
      // Handle preselection or default selection
      if (preselectedPersonId) {
        const found = data.find(p => p.id === preselectedPersonId);
        if (found) {
          setSelectedPerson(found);
          setMobileView('details');
        }
      } else if (data.length > 0 && !selectedPerson) {
        setSelectedPerson(data[0]);
      }
    } catch (e) {
      console.error("Error loading consultants:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, [user, preselectedPersonId]);

  // Load readings of the selected person
  useEffect(() => {
    if (user && selectedPerson) {
      setLoadingReadings(true);
      getUserHistory(user.uid, selectedPerson.id)
        .then(readings => {
          setSelectedPersonReadings(readings);
          setLoadingReadings(false);
        })
        .catch(err => {
          console.error("Error loading reading history for person:", err);
          setLoadingReadings(false);
        });
    } else {
      setSelectedPersonReadings([]);
    }
  }, [user, selectedPerson]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);
    triggerHaptic(30);
    try {
      const personId = await savePerson(
        user.uid,
        name.trim(),
        birthDate,
        birthTime,
        birthPlace,
        notes
      );
      
      // Reset form
      setName('');
      setBirthDate('');
      setBirthTime('');
      setBirthPlace('');
      setNotes('');
      setIsAdding(false);
      setMobileView('details');
      
      // Refresh & select newly added person
      const data = await getPeople(user.uid);
      setPeople(data);
      const newPerson = data.find(p => p.id === personId);
      if (newPerson) setSelectedPerson(newPerson);
      
    } catch (err) {
      console.error("Error saving consultant:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPerson || !name.trim()) return;
    setSaving(true);
    triggerHaptic(30);
    try {
      await updatePerson(user.uid, selectedPerson.id, {
        name: name.trim(),
        birthDate,
        birthTime,
        birthPlace,
        notes
      });
      
      setIsEditing(false);
      setMobileView('details');
      
      // Refresh & update selection
      const data = await getPeople(user.uid);
      setPeople(data);
      const updated = data.find(p => p.id === selectedPerson.id);
      if (updated) setSelectedPerson(updated);
    } catch (err) {
      console.error("Error updating consultant:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (personId: string) => {
    if (!user || !window.confirm("¿Seguro que deseas eliminar a este consultante y todos sus registros asociados de la lista?")) return;
    triggerHaptic(40);
    try {
      await deletePerson(user.uid, personId);
      setSelectedPerson(null);
      setMobileView('list');
      fetchPeople();
    } catch (err) {
      console.error("Error deleting consultant:", err);
    }
  };

  const startEdit = () => {
    if (!selectedPerson) return;
    triggerHaptic(20);
    setName(selectedPerson.name);
    setBirthDate(selectedPerson.birthDate || '');
    setBirthTime(selectedPerson.birthTime || '');
    setBirthPlace(selectedPerson.birthPlace || '');
    setNotes(selectedPerson.notes || '');
    setIsEditing(true);
    setMobileView('details');
  };

  if (!user) {
    return (
      <div className="py-20 text-center text-slate-500">
        <p>Por favor inicia sesión para poder crear y gestionar consultantes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-serif text-purple-100 flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-purple-400" />
            Gestión de Consultantes
          </h2>
          <p className="text-sm text-slate-400">Guarda datos astrológicos y revisa el historial personalizado de tus personas de interés.</p>
        </div>
        
        {!isAdding && !isEditing && (
          <button
            onClick={() => {
              triggerHaptic(25);
              setName('');
              setBirthDate('');
              setBirthTime('');
              setBirthPlace('');
              setNotes('');
              setIsAdding(true);
              setMobileView('details');
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-all shadow-md active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Consultante
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: LIST */}
        <div className={`${mobileView === 'list' ? 'flex' : 'hidden lg:flex'} lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 h-[calc(100vh-280px)] lg:h-[calc(100vh-300px)] min-h-[400px] flex-col`}>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-2 pb-3 mb-2 border-b border-slate-800/80 flex items-center justify-between">
            <span>Lista de Consultantes</span>
            <span className="bg-slate-800 text-purple-300 px-2 py-0.5 rounded-full text-[10px] font-mono">{people.length}</span>
          </h3>

          {loading && people.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm animate-pulse">
              Cargando consultantes...
            </div>
          ) : people.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-slate-600" />
              </div>
              <p className="text-xs leading-relaxed max-w-[200px]">No has registrado a ninguna persona todavía.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {people.map((p) => {
                const isSelected = selectedPerson?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      triggerHaptic(20);
                      setSelectedPerson(p);
                      setIsAdding(false);
                      setIsEditing(false);
                      setMobileView('details');
                    }}
                    className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center gap-3 border ${
                      isSelected 
                        ? 'bg-purple-950/20 border-purple-500/40 text-purple-200' 
                        : 'bg-transparent border-transparent hover:bg-slate-800/30 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}>
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div className="truncate flex-1">
                      <p className="text-sm font-medium font-serif truncate">{p.name}</p>
                      {p.birthDate && (
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                          {format(new Date(p.birthDate + 'T12:00:00'), "d MMM yyyy", { locale: es })}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: WORKSPACE (ADD / EDIT / DETAILS) */}
        <div className={`${mobileView === 'details' ? 'block' : 'hidden lg:block'} lg:col-span-2 space-y-6`}>
          {/* On mobile: back to list button */}
          {mobileView === 'details' && (
            <button
              onClick={() => {
                triggerHaptic(15);
                setIsAdding(false);
                setIsEditing(false);
                setMobileView('list');
              }}
              className="lg:hidden flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium mb-4 active:scale-95 py-2.5 px-4 bg-slate-900 border border-slate-800 rounded-xl w-full justify-center"
            >
              <ArrowLeft className="w-4 h-4" /> Volver a la Lista de Consultantes
            </button>
          )}
          <AnimatePresence mode="wait">
            
            {/* ADDING FORM */}
            {isAdding && (
              <motion.div
                key="add-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-lg font-serif text-slate-100 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-purple-400" />
                    Registrar Nuevo Consultante
                  </h3>
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre Completo</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Sofía Alarcón"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                      />
                    </div>

                    {/* Birth Date */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-purple-400/80" />
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors text-sm font-mono"
                      />
                    </div>

                    {/* Birth Time */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-purple-400/80" />
                        Hora de Nacimiento
                      </label>
                      <input
                        type="time"
                        value={birthTime}
                        onChange={(e) => setBirthTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors text-sm font-mono"
                      />
                    </div>

                    {/* Birth Place */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-purple-400/80" />
                        Lugar de Nacimiento
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Buenos Aires, Argentina"
                        value={birthPlace}
                        onChange={(e) => setBirthPlace(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-purple-400/80" />
                        Notas / Contexto de Vida
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Ej: Interés en temas de carrera. Signo solar Tauro, ascendente Escorpio..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(15);
                        setIsAdding(false);
                        setMobileView('list');
                      }}
                      className="px-5 py-2.5 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-55 text-white rounded-xl text-sm font-medium transition-all"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Guardando...' : 'Guardar Consultante'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* EDITING FORM */}
            {isEditing && selectedPerson && (
              <motion.div
                key="edit-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-lg font-serif text-slate-100 flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-purple-400" />
                    Editar Ficha de {selectedPerson.name}
                  </h3>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre Completo</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                      />
                    </div>

                    {/* Birth Date */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-purple-400/80" />
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors text-sm font-mono"
                      />
                    </div>

                    {/* Birth Time */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-purple-400/80" />
                        Hora de Nacimiento
                      </label>
                      <input
                        type="time"
                        value={birthTime}
                        onChange={(e) => setBirthTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors text-sm font-mono"
                      />
                    </div>

                    {/* Birth Place */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-purple-400/80" />
                        Lugar de Nacimiento
                      </label>
                      <input
                        type="text"
                        value={birthPlace}
                        onChange={(e) => setBirthPlace(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-purple-400/80" />
                        Notas / Contexto de Vida
                      </label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(15);
                        setIsEditing(false);
                      }}
                      className="px-5 py-2.5 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-55 text-white rounded-xl text-sm font-medium transition-all"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* DETAILS AND HISTORIC READINGS OF SELECTED PERSON */}
            {!isAdding && !isEditing && selectedPerson && (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Person Profile Details Card */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-4 gap-4">
                    <div>
                      <span className="text-[10px] font-mono tracking-widest text-purple-400 uppercase">Ficha Astrológica</span>
                      <h3 className="text-2xl font-serif text-slate-100 mt-0.5">{selectedPerson.name}</h3>
                    </div>
                    
                    <div className="flex gap-2.5">
                      <button
                        onClick={startEdit}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-xs transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(selectedPerson.id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 border border-red-900/40 text-red-400 hover:bg-red-950/20 rounded-xl text-xs transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Astronomic and personal metadata grids */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                      
                      {/* Birth Metadata Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Birth date and time */}
                        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50 space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-purple-400/80" /> Nacimiento
                          </span>
                          <p className="text-sm text-slate-200 font-serif font-medium">
                            {selectedPerson.birthDate 
                              ? format(new Date(selectedPerson.birthDate + 'T12:00:00'), "d 'de' MMMM, yyyy", { locale: es })
                              : 'No especificada'}
                          </p>
                          {selectedPerson.birthTime && (
                            <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" /> {selectedPerson.birthTime} hs
                            </p>
                          )}
                        </div>

                        {/* Birth Place */}
                        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50 space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-purple-400/80" /> Lugar de Origen
                          </span>
                          <p className="text-sm text-slate-200 font-serif font-medium truncate">
                            {selectedPerson.birthPlace || 'No especificado'}
                          </p>
                        </div>
                      </div>

                      {/* Notes / Life Story */}
                      <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-800/30 space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-purple-400/80" /> Notas Cósmicas / Observaciones
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed italic whitespace-pre-wrap">
                          {selectedPerson.notes ? `"${selectedPerson.notes}"` : 'Sin anotaciones registradas aún.'}
                        </p>
                      </div>

                    </div>

                    {/* Astro ritual call-to-action cards */}
                    <div className="bg-purple-950/15 border border-purple-500/20 rounded-xl p-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-widest flex items-center gap-1">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          Lecturas Activas
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Conéctate con las vibraciones del presente. Genera tiradas dedicadas exclusivamente para {selectedPerson.name}.
                        </p>
                      </div>

                      <button
                        onClick={() => onStartReadingForPerson(selectedPerson)}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md hover:shadow-purple-500/10 flex items-center justify-center gap-2 font-serif"
                      >
                        Realizar Nueva Lectura
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Historic readings for this person */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    Historial de lecturas para {selectedPerson.name}
                  </h3>

                  {loadingReadings ? (
                    <div className="py-12 text-center text-slate-500 text-sm animate-pulse">
                      Leyendo las constelaciones...
                    </div>
                  ) : selectedPersonReadings.length === 0 ? (
                    <div className="bg-slate-900/20 border border-slate-800 border-dashed rounded-2xl p-12 text-center text-slate-500 space-y-2">
                      <p className="text-sm">No hay registros de lecturas guardadas para esta persona.</p>
                      <button
                        onClick={() => onStartReadingForPerson(selectedPerson)}
                        className="text-xs text-purple-400 hover:text-purple-300 font-serif inline-flex items-center gap-1 underline"
                      >
                        Realizar su primera lectura ahora <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {selectedPersonReadings.map((reading) => {
                        const cards = reading.cards.map((id: string) => tarotDeck.find(c => c.id === id)).filter(Boolean);
                        
                        return (
                          <div key={reading.id} className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
                            
                            {/* Header metadata */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                              <div className="flex items-center gap-2 text-slate-400">
                                <Clock className="w-3.5 h-3.5 text-purple-400" />
                                <span className="text-xs font-mono">
                                  {reading.timestamp?.toDate 
                                    ? format(reading.timestamp.toDate(), "d MMM yyyy, HH:mm", { locale: es }) 
                                    : 'Reciente'}
                                </span>
                              </div>
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-950/50 border border-purple-500/20 text-purple-300 self-start font-serif uppercase tracking-wider">
                                {cards.length === 1 ? 'Carta Única' : cards.length === 3 ? 'Temporal (3)' : 'Cruz Celta (10)'}
                              </span>
                            </div>

                            {/* Focus question if saved */}
                            {reading.question && (
                              <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/40 text-xs text-slate-300 flex items-start gap-2">
                                <HelpCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Pregunta consultada:</span>
                                  <p className="italic font-serif text-purple-300/90">"{reading.question}"</p>
                                </div>
                              </div>
                            )}

                            {/* Cards layouts */}
                            <div className={`grid gap-4 ${
                              cards.length === 1 
                                ? 'grid-cols-1 max-w-[150px]' 
                                : cards.length === 3 
                                  ? 'grid-cols-3 max-w-2xl' 
                                  : 'grid-cols-2 sm:grid-cols-5'
                            }`}>
                              {cards.map((card: any, idx: number) => {
                                const getLabel = (idx: number, tot: number) => {
                                  if (tot === 1) return 'Consejo';
                                  if (tot === 3) return idx === 0 ? 'Pasado' : idx === 1 ? 'Presente' : 'Futuro';
                                  const cCross = [
                                    '1. Actual', '2. Obstáculo', '3. Raíz', '4. Pasado', 
                                    '5. Metas', '6. Futuro', '7. Consultante', '8. Entorno', 
                                    '9. Temores', '10. Resultado'
                                  ];
                                  return cCross[idx] || `Pos. ${idx + 1}`;
                                };

                                return (
                                  <div key={idx} className="flex flex-col items-center gap-2 bg-slate-950/30 p-2.5 rounded-xl border border-slate-800/40">
                                    <span className="text-[9px] font-serif text-slate-500 text-center uppercase truncate leading-none mb-1">
                                      {getLabel(idx, cards.length)}
                                    </span>
                                    <div className="w-full max-w-[110px] aspect-[2/3]">
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
                  )}
                </div>

              </motion.div>
            )}

            {/* EMPTY STATE */}
            {!isAdding && !isEditing && !selectedPerson && (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-slate-900/20 border-2 border-slate-800 border-dashed rounded-3xl p-16 text-center space-y-4 h-[400px] flex flex-col items-center justify-center text-slate-500"
              >
                <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-slate-600 shadow-inner">
                  <UserIcon className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-serif text-slate-300 font-medium">Visualizador de Consultantes</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                    Registra o selecciona un perfil para ver su ficha natal, notas y su historial de lecturas personalizadas.
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
