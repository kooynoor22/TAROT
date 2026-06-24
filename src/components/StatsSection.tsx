import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { getUserStats, exportUserData, importUserData } from '../lib/firebase';
import { tarotDeck } from '../data/tarot';
import { BarChart3, Star, Database, Download, Upload, Check, AlertCircle, RefreshCw } from 'lucide-react';
import TarotCardComponent from './TarotCard';
import { triggerHaptic } from '../lib/haptic';

export default function StatsSection({ user }: { user: User | null }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Backup states
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [backupData, setBackupData] = useState<any>(null);
  const [importResult, setImportResult] = useState<{ importedPeople: number, importedReadings: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStats = () => {
    if (user) {
      setLoading(true);
      getUserStats(user.uid).then(data => {
        setStats(data);
        setLoading(false);
      }).catch(err => {
        console.error("Error loading stats:", err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user]);

  if (!user) return null;

  const handleExport = async () => {
    if (!user || exporting) return;
    triggerHaptic(30);
    setExporting(true);
    setErrorMessage(null);

    try {
      const data = await exportUserData(user.uid);
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      
      const formattedDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      downloadAnchor.setAttribute('download', `oraculo_tarot_backup_${formattedDate}.json`);
      
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      triggerHaptic([40, 60]);
    } catch (err) {
      console.error("Export error:", err);
      setErrorMessage("Error al exportar los datos. Inténtalo de nuevo.");
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic(20);
    setBackupFile(file);
    setImportResult(null);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.people || !parsed.readings) {
          throw new Error("Formato de backup inválido.");
        }
        setBackupData(parsed);
      } catch (err) {
        setErrorMessage("El archivo seleccionado no es una copia de seguridad válida.");
        setBackupFile(null);
        setBackupData(null);
        triggerHaptic([50, 50]);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!user || !backupData || importing) return;
    triggerHaptic(40);
    setImporting(true);
    setErrorMessage(null);

    try {
      const result = await importUserData(user.uid, backupData);
      setImportResult(result);
      setBackupFile(null);
      setBackupData(null);
      triggerHaptic([40, 60, 40]);
      // Reload stats immediately
      loadStats();
    } catch (err: any) {
      console.error("Import error:", err);
      setErrorMessage(err?.message || "Error al restaurar la copia de seguridad.");
    } finally {
      setImporting(false);
    }
  };

  const hasStats = stats && stats.totalReadings > 0 && stats.stats;
  const sortedStats = hasStats 
    ? Object.entries(stats.stats).sort(([, a]: any, [, b]: any) => b - a).slice(0, 5)
    : [];

  return (
    <div className="space-y-12 pb-16">
      {/* Title block */}
      <div className="space-y-2">
        <h2 className="text-2xl font-serif text-purple-100">Energías y Respaldos</h2>
        <p className="text-sm text-slate-400">Analiza tus lecturas recurrentes y gestiona tus copias de seguridad de forma segura.</p>
      </div>

      {/* Stats Block */}
      {loading ? (
        <div className="py-12 text-center text-purple-400 animate-pulse font-serif text-sm">
          Calculando probabilidades cósmicas...
        </div>
      ) : !hasStats ? (
        <div className="bg-slate-900/30 border border-slate-900/60 rounded-2xl p-8 text-center flex flex-col items-center">
          <BarChart3 className="w-10 h-10 mb-3 text-slate-600" />
          <p className="text-sm text-slate-500 max-w-sm">Aún no hay suficientes lecturas para generar estadísticas místicas. Realiza tiradas para ver tus energías recurrentes.</p>
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
            <span className="text-slate-400 text-sm">Lecturas totales realizadas</span>
            <span className="text-2xl font-serif text-purple-300">{stats.totalReadings}</span>
          </div>

          <div className="space-y-8">
            <h3 className="text-base font-serif text-slate-200 flex items-center gap-2">
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
                    <div className="bg-slate-800 px-3 py-1 rounded-full text-[11px] font-medium text-slate-300">
                      Apareció {count} {count === 1 ? 'vez' : 'veces'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Backup & Restore Block */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-serif text-slate-100">Copia de Seguridad y Restauración</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Exporta todos tus consultantes (fichas) y el historial completo de tiradas en un archivo JSON seguro para guardarlo localmente. Puedes importarlo en cualquier momento para restaurar todos tus datos místicos.
            </p>
          </div>
        </div>

        <div className="h-[1px] bg-slate-800/50 w-full" />

        {/* Success and Error messages */}
        {errorMessage && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {importResult && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-emerald-200">
              <Check className="w-4 h-4" />
              <span>¡Copia de seguridad restaurada con éxito!</span>
            </div>
            <p className="pl-6 text-[11px] text-slate-400">
              Se han agregado <strong className="text-emerald-400">{importResult.importedPeople}</strong> nuevos consultantes y <strong className="text-emerald-400">{importResult.importedReadings}</strong> lecturas de tarot a tu historial. Las lecturas duplicadas han sido omitidas de manera inteligente.
            </p>
          </div>
        )}

        {/* Actions grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* EXPORT SECTION */}
          <div className="bg-slate-950/40 border border-slate-800/60 p-5 rounded-xl flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-300">Exportar Datos</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Descarga un archivo con formato <code className="text-slate-400 bg-slate-900 px-1 py-0.5 rounded">.json</code> que contiene tu registro completo para resguardar tus datos misticos.
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-medium tracking-wider uppercase transition-all"
            >
              {exporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                  <span>Preparando Archivo...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-purple-400" />
                  <span>Descargar Copia de Seguridad</span>
                </>
              )}
            </button>
          </div>

          {/* IMPORT SECTION */}
          <div className="bg-slate-950/40 border border-slate-800/60 p-5 rounded-xl flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-300">Restaurar Copia</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Sube tu archivo de backup para importar tus consultantes e historial de tiradas. El sistema evitará crear registros idénticos repetidos.
              </p>
            </div>

            <div className="space-y-3">
              {/* File selector trigger */}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />

              {backupFile && backupData ? (
                <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium truncate max-w-[180px]">{backupFile.name}</span>
                    <button 
                      onClick={() => { triggerHaptic(15); setBackupFile(null); setBackupData(null); }}
                      className="text-slate-500 hover:text-slate-300 text-[10px] uppercase font-semibold"
                    >
                      Quitar
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono">
                    <div>Consultantes: <span className="text-purple-300 font-bold">{backupData.people?.length || 0}</span></div>
                    <div>Lecturas: <span className="text-purple-300 font-bold">{backupData.readings?.length || 0}</span></div>
                  </div>
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow-md shadow-purple-950/50"
                  >
                    {importing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Restaurando datos...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Iniciar Restauración</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { triggerHaptic(20); fileInputRef.current?.click(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-950/20 hover:bg-purple-950/35 text-purple-300 border border-purple-900/40 hover:border-purple-800/60 rounded-xl text-xs font-medium tracking-wider uppercase transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>Seleccionar Archivo Backup</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
