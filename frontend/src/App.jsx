import React, { useState, useEffect, useRef, useMemo, useDeferredValue } from 'react';
import { 
  UploadCloud, FileText, CheckCircle2, AlertTriangle, PlusCircle, 
  MinusCircle, Edit3, Search, Filter, ChevronDown, Clock, 
  Settings, FileDown, ZoomIn, ZoomOut, Maximize, Play, 
  Loader2, FileUp, Check, X, MessageSquare, Menu, ChevronRight, Trash2, Mail
} from 'lucide-react';
import { TransformWrapper, TransformComponent, useControls, useTransformContext } from "react-zoom-pan-pinch";

const MOCK_ANOMALIES = [
  { id: 'AN-01', tag: 'PT-102', type: 'ajout', criticality: 'majeure', desc: 'Nouveau capteur de pression ajouté sur la ligne principale.', confidence: 98, location: 'C-4' },
  { id: 'AN-02', tag: 'V-205', type: 'suppression', criticality: 'critique', desc: 'Vanne d\'isolement retirée en amont de la pompe de charge.', confidence: 95, location: 'A-2' },
  { id: 'AN-03', tag: 'L-14', type: 'modification', criticality: 'mineure', desc: 'Diamètre de tuyauterie réduit de 6" à 4".', confidence: 88, location: 'E-6' },
  { id: 'AN-04', tag: 'TE-301', type: 'ajout', criticality: 'mineure', desc: 'Transmetteur de température inséré.', confidence: 92, location: 'B-3' },
  { id: 'AN-05', tag: 'P-101A', type: 'modification', criticality: 'majeure', desc: 'Changement de spécification de la pompe principale.', confidence: 85, location: 'F-1' },
  { id: 'AN-06', tag: 'FIC-400', type: 'suppression', criticality: 'majeure', desc: 'Contrôleur de débit supprimé de la boucle de régulation.', confidence: 96, location: 'D-5' },
  { id: 'AN-07', tag: 'PSV-210', type: 'modification', criticality: 'critique', desc: 'Pression de tarage modifiée sur la soupape de sûreté.', confidence: 99, location: 'C-2' },
  { id: 'AN-08', tag: 'E-05', type: 'ajout', criticality: 'majeure', desc: 'Échangeur de chaleur ajouté sur le circuit secondaire.', confidence: 94, location: 'A-7' }
];



function FileUploadCard({ title, version, file, onFileSelect }) {
  const fileInputRef = React.useRef(null);

  const handleDivClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  if (file) {
    return (
      <div className="bg-blueprint-surface border border-blueprint-border/60 rounded-2xl p-4 flex items-center justify-between group">
        <div className="flex items-center gap-4">
          <div className="w-12 h-16 bg-blueprint-bg border border-blueprint-border/60 shadow-sm flex items-center justify-center rounded-md">
            <FileText className="w-6 h-6 text-blueprint-primary" />
          </div>
          <div>
            <div className="text-xs text-blueprint-text-sec uppercase tracking-wider mb-1">{title}</div>
            <div className="font-mono text-sm text-blueprint-text font-medium truncate max-w-[200px]">{file.name}</div>
            <div className="text-xs text-blueprint-text-sec mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
          </div>
        </div>
        <button 
          onClick={handleDivClick}
          className="px-3 py-1.5 text-xs font-medium border border-blueprint-border/60 rounded-lg text-blueprint-text hover:bg-blueprint-elevated hover:text-blueprint-primary transition-colors"
        >
          Remplacer
        </button>
        <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,image/*" />
      </div>
    );
  }

  return (
    <div 
      onClick={handleDivClick}
      className="bg-blueprint-surface/50 border border-dashed border-blueprint-border/60 hover:border-blueprint-primary/50 hover:bg-blueprint-surface rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
    >
      <FileUp className="w-8 h-8 text-blueprint-text-sec mb-3" />
      <h3 className="text-sm font-medium text-blueprint-text mb-1">Importer {title}</h3>
      <p className="text-xs text-blueprint-text-sec max-w-xs">Format PDF (A3/A0), max 50 Mo. Formats vectoriels recommandés.</p>
      <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,image/*" />
    </div>
  );
}

const Controls = () => {
  const { zoomIn, zoomOut, resetTransform, state } = useControls();
  return (
    <div className="absolute top-4 right-4 z-10 flex items-center bg-blueprint-surface border border-blueprint-border/60 rounded-xl shadow-xl shadow-blueprint-primary/10">
      <button onClick={() => zoomOut()} className="p-2 text-blueprint-text-sec hover:text-blueprint-text hover:bg-blueprint-elevated transition-colors border-r border-blueprint-border/60" title="Zoomer en arrière">
        <ZoomOut className="w-4 h-4" />
      </button>
      <span className="px-3 text-xs font-mono text-blueprint-text min-w-[60px] text-center flex justify-center">
        {Math.round(state.scale * 100)}%
      </span>
      <button onClick={() => zoomIn()} className="p-2 text-blueprint-text-sec hover:text-blueprint-text hover:bg-blueprint-elevated transition-colors border-r border-blueprint-border/60" title="Zoomer en avant">
        <ZoomIn className="w-4 h-4" />
      </button>
      <button onClick={() => resetTransform()} className="p-2 text-blueprint-text-sec hover:text-blueprint-text hover:bg-blueprint-elevated transition-colors" title="Réinitialiser le zoom">
        <Maximize className="w-4 h-4" />
      </button>
    </div>
  );
};

const BlueprintViewer = React.memo(({ referenceImageUrl, resultImageUrl }) => {
  const [showReference, setShowReference] = useState(false);
  
  const currentImageUrl = showReference ? referenceImageUrl : resultImageUrl;

  return (
    <div className="relative w-full h-full bg-blueprint-elevated rounded-2xl overflow-hidden flex flex-col items-center justify-center font-sans border border-blueprint-border/60 group">
      {referenceImageUrl && resultImageUrl && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-blueprint-surface border border-blueprint-border/60 p-1 rounded-xl shadow-xl shadow-blueprint-primary/10 flex text-xs font-medium">
          <button 
            onClick={() => setShowReference(true)}
            className={`px-4 py-1.5 rounded-lg transition-colors ${showReference ? 'bg-blueprint-text text-blueprint-bg' : 'text-blueprint-text-sec hover:text-blueprint-text'}`}
          >
            Plan Référence
          </button>
          <button 
            onClick={() => setShowReference(false)}
            className={`px-4 py-1.5 rounded-lg transition-colors ${!showReference ? 'bg-blueprint-cyan text-blueprint-bg' : 'text-blueprint-text-sec hover:text-blueprint-text'}`}
          >
            Résultat IA
          </button>
        </div>
      )}

      {currentImageUrl ? (
        <TransformWrapper
          initialScale={1}
          minScale={0.1}
          maxScale={10}
          centerOnInit={true}
          wheel={{ step: 0.1 }}
        >
          <Controls />
          <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center cursor-grab active:cursor-grabbing">
            <img 
              src={`http://localhost:8000${currentImageUrl}`} 
              alt="Plan" 
              className="max-w-full max-h-full object-contain shadow-2xl shadow-blueprint-primary/5 pointer-events-none" 
            />
          </TransformComponent>
        </TransformWrapper>
      ) : (
        <div className="text-blueprint-text-sec flex flex-col items-center">
          <p>En attente du rendu IA...</p>
        </div>
      )}
    </div>
  );
});

const SearchInput = ({ initialValue, onSearch }) => {
  const [value, setValue] = useState(initialValue);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, 200);
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blueprint-text-sec" />
      <input 
        type="text" 
        placeholder="Rechercher par tag..." 
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full bg-blueprint-surface border border-blueprint-border/60 rounded-lg pl-9 pr-3 py-1.5 text-sm font-sans focus:outline-none focus:border-blueprint-primary placeholder:text-blueprint-text-sec/60"
      />
    </div>
  );
};

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Les états qui gèrent les vrais fichiers
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  
  // Les états pour suivre le backend
  const [analysisState, setAnalysisState] = useState('idle'); 
  const [progressStep, setProgressStep] = useState(0);
  const [comparisonId, setComparisonId] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/comparisons/');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Erreur chargement historique:", err);
    }
  };

  const handleDeleteAllHistory = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer tout l'historique ?")) return;
    try {
      const res = await fetch('http://localhost:8000/api/comparisons/', { method: 'DELETE' });
      if (res.ok) {
        setHistory([]);
        resetToHome();
      }
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  const handleDeleteItem = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Supprimer cette analyse ?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/comparisons/${id}/`, { method: 'DELETE' });
      if (res.ok) {
        setHistory(prev => prev.filter(item => item.id !== id));
        if (comparisonId === id) resetToHome();
      }
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    fetchHistory().finally(() => {
      setTimeout(() => setIsAppLoading(false), 2500);
    });
  }, []);

  const resetToHome = () => {
    setAnalysisState('idle');
    setFileA(null);
    setFileB(null);
    setProgressStep(0);
    setComparisonId(null);
    setAnalysisResult(null);
  };

  // Le système d'écoute (Polling)
  useEffect(() => {
    if (!comparisonId || analysisState === 'done') return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/comparisons/${comparisonId}/`);
        if (response.ok) {
          const data = await response.json();
          
          if (data.status === 'PROCESSING') {
            setProgressStep(3); // Traitement par Celery
          } else if (data.status === 'SUCCESS') {
            setProgressStep(5);
            setAnalysisState('done');
            setAnalysisResult(data.differences_json);
            fetchHistory(); // Update history after completion
            clearInterval(interval);
          } else if (data.status === 'FAILED') {
            setAnalysisState('idle');
            alert("Erreur lors de l'analyse par l'IA.");
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error("Erreur de connexion au serveur:", error);
      }
    }, 2000); // Interroge toutes les 2 secondes

    return () => clearInterval(interval);
  }, [comparisonId, analysisState]);

  // L'envoi des fichiers à Django
  const handleCompare = async () => {
    if (!fileA || !fileB) return;
    
    setAnalysisState('processing');
    setProgressStep(1); // Étape 1 : Upload

    const formData = new FormData();
    formData.append('file_a', fileA);
    formData.append('file_b', fileB);

    try {
      const response = await fetch('http://localhost:8000/api/upload/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setComparisonId(data.id);
        setProgressStep(2); // Étape 2 : Reçu par Django, en attente de Celery
      } else {
        setAnalysisState('idle');
        alert("Erreur lors de l'envoi des fichiers.");
      }
    } catch (error) {
      console.error(error);
      setAnalysisState('idle');
      alert("Impossible de contacter le serveur Django.");
    }
  };

  const handleExportReport = async () => {
    if (!comparisonId) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/comparisons/${comparisonId}/export/`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la génération du PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_analyse_${comparisonId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error(error);
      alert('Impossible de télécharger le rapport PDF.');
    }
  };

  const getSemanticColor = (type) => {
    switch (type) {
      case 'ajout': return 'emerald-500';
      case 'modification': return 'amber-500';
      case 'suppression': return 'red-500';
      default: return 'slate-500';
    }
  };

  const getSemanticIcon = (type, className) => {
    switch (type) {
      case 'ajout': return <PlusCircle className={className} />;
      case 'modification': return <Edit3 className={className} />;
      case 'suppression': return <MinusCircle className={className} />;
      default: return null;
    }
  };

  const getCriticalityBorder = (crit) => {
    switch (crit) {
      case 'critique': return 'border-l-[3px] border-l-blueprint-text';
      case 'majeure': return 'border-l-2 border-l-blueprint-text-sec';
      case 'mineure': return 'border-l-[1px] border-l-blueprint-border';
      default: return 'border-l border-blueprint-border/60';
    }
  };

  const anomaliesMatchingSearch = useMemo(() => {
    const anomalies = analysisResult?.anomalies || [];
    if (!searchQuery) return anomalies;
    const query = searchQuery.toLowerCase();
    return anomalies.filter(anomaly => 
      (anomaly.tag && anomaly.tag.toLowerCase().includes(query)) ||
      (anomaly.type && anomaly.type.toLowerCase().includes(query))
    );
  }, [analysisResult?.anomalies, searchQuery]);

  const anomalyStats = useMemo(() => {
    return {
      ajout: anomaliesMatchingSearch.filter(a => a.type === 'ajout').length,
      modification: anomaliesMatchingSearch.filter(a => a.type === 'modification').length,
      suppression: anomaliesMatchingSearch.filter(a => a.type === 'suppression').length
    };
  }, [anomaliesMatchingSearch]);

  const filteredAnomalies = useMemo(() => {
    if (typeFilter === 'all') return anomaliesMatchingSearch;
    return anomaliesMatchingSearch.filter(a => a.type === typeFilter);
  }, [anomaliesMatchingSearch, typeFilter]);

  if (isAppLoading) {
    return (
      <div className="fixed inset-0 bg-blueprint-bg flex flex-col items-center justify-center z-50 overflow-hidden">
        <div className="relative w-40 h-40 rounded-full overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.8)] animate-pulse mb-8 flex items-center justify-center bg-[#0b1120] border-2 border-blueprint-primary/50">
           <div className="absolute inset-0 bg-blueprint-primary/20 animate-ping rounded-full"></div>
           <img src="/schematic_logo.png" alt="Logo" className="absolute top-1/2 left-1/2 w-[160%] max-w-none -translate-x-1/2 translate-y-[-42%] z-10" />
        </div>
        <h1 className="text-4xl font-display font-bold text-blueprint-text tracking-widest uppercase mb-3 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
          AI Schematic
        </h1>
        <p className="text-blueprint-primary font-mono text-sm tracking-[0.2em] uppercase animate-pulse">
          Initialisation du système...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-blueprint-bg text-blueprint-text font-sans overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <aside className={`w-64 border-r border-blueprint-border/60 bg-blueprint-surface flex-col shrink-0 ${isSidebarOpen ? 'flex' : 'hidden'}`}>
          <div className="h-14 flex items-center px-4 border-b border-blueprint-border/60 shrink-0">
            <Menu onClick={() => setIsSidebarOpen(false)} className="w-5 h-5 text-blueprint-text-sec mr-3 cursor-pointer hover:text-blueprint-primary transition-colors" />
            <div className="relative w-9 h-9 mr-3 rounded-full overflow-hidden shrink-0 bg-[#0b1120] border border-blueprint-border/50 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.2)]" onClick={resetToHome}>
               <img src="/schematic_logo.png" alt="Logo" className="absolute top-1/2 left-1/2 w-[160%] max-w-none -translate-x-1/2 translate-y-[-42%]" />
            </div>
            <h1 
              onClick={resetToHome}
              className="font-display font-semibold tracking-wide text-lg cursor-pointer hover:text-blueprint-primary transition-colors"
            >
              AI SCHEMATIC
            </h1>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-4 mb-3 flex items-center justify-between">
              <h2 className="text-[10px] uppercase tracking-widest text-blueprint-text-sec font-semibold">Historique des analyses</h2>
              {history.length > 0 && (
                <button 
                  onClick={handleDeleteAllHistory} 
                  className="text-blueprint-text-sec hover:text-red-500 transition-colors"
                  title="Tout supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            {history.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-blueprint-text-sec">
                Aucun historique d'analyse pour le moment.
              </div>
            ) : (
              <div className="px-2 space-y-1">
                {history.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => {
                      setComparisonId(item.id);
                      if (item.status === 'SUCCESS') {
                        setAnalysisState('done');
                        setAnalysisResult(item.differences_json);
                      } else if (item.status === 'PROCESSING') {
                        setAnalysisState('processing');
                      } else {
                        setAnalysisState('idle');
                      }
                    }}
                    className={`p-2 rounded-lg text-sm cursor-pointer transition-colors group ${comparisonId === item.id ? 'bg-blueprint-elevated text-blueprint-primary' : 'text-blueprint-text-sec hover:bg-blueprint-surface hover:text-blueprint-text'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-sans text-xs font-medium mb-1 truncate text-blueprint-text flex-1 pr-2" title={item.file_b || item.id}>
                        {item.file_b ? item.file_b.split('/').pop() : 'Comparaison'}
                      </div>
                      <button 
                        onClick={(e) => handleDeleteItem(e, item.id)}
                        className="opacity-0 group-hover:opacity-100 text-blueprint-text-sec hover:text-red-500 transition-all p-0.5"
                        title="Supprimer cette analyse"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span>{new Date(item.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' })}</span>
                      <span className={`${item.status === 'SUCCESS' ? 'text-emerald-500' : item.status === 'FAILED' ? 'text-red-500' : 'text-amber-500'}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden relative">
          <header className="h-14 border-b border-blueprint-border/60 bg-blueprint-bg flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center">
              {!isSidebarOpen && (
                <div className="mr-4 cursor-pointer" onClick={() => setIsSidebarOpen(true)}>
                  <Menu className="w-5 h-5 text-blueprint-text-sec hover:text-blueprint-primary transition-colors" />
                </div>
              )}
            </div>
            
            {analysisState === 'done' && (
              <div className="flex items-center gap-3">
                <button onClick={handleExportReport} className="flex items-center gap-2 bg-blueprint-cyan text-blueprint-bg font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blueprint-cyan-hover transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                  <FileDown className="w-4.5 h-4.5" /> Exporter le rapport
                </button>
              </div>
            )}
          </header>

          <div className="flex-1 overflow-hidden relative">
            {analysisState !== 'done' && (
              <div className="absolute inset-0 overflow-y-auto p-6 md:p-12 flex flex-col">
                <div className="max-w-4xl mx-auto w-full space-y-8">
                  <div>
                    <h2 className="text-2xl font-display font-semibold text-blueprint-text mb-2">Nouvelle Comparaison MOC</h2>
                    <p className="text-blueprint-text-sec text-sm">Sélectionnez les deux révisions du schéma P&ID à comparer. Le moteur IA identifiera les divergences topologiques et d'instrumentation.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <FileUploadCard 
                      title="Reference File (Référence)" 
                      version="PID-DIST-U4-REV03" 
                      file={fileA} 
                      onFileSelect={setFileA} 
                    />
                    <FileUploadCard 
                      title="Review File (Révisé)" 
                      version="PID-DIST-U4-REV04" 
                      file={fileB} 
                      onFileSelect={setFileB} 
                    />
                  </div>

                  <div className="border-t border-blueprint-border/60 pt-8 flex flex-col items-center">
                    {analysisState === 'idle' ? (
                      <button
                        onClick={handleCompare}
                        disabled={!fileA || !fileB}
                        className={`
                          px-8 py-3 rounded-lg font-medium text-sm transition-all flex items-center gap-2
                          ${(!fileA || !fileB) 
                            ? 'bg-blueprint-surface text-blueprint-text-sec border border-blueprint-border/60 cursor-not-allowed' 
                            : 'bg-blueprint-text text-blueprint-bg hover:bg-white hover:scale-[1.02]'
                          }
                        `}
                      >
                        <Play className="w-4 h-4" /> Lancer l'analyse différentielle
                      </button>
                    ) : (
                      <div className="w-full max-w-md bg-blueprint-surface border border-blueprint-border/60 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="font-medium">Analyse en cours...</h3>
                          <Loader2 className="w-5 h-5 text-blueprint-primary animate-spin" />
                        </div>
                        
                        <div className="space-y-4">
                          {[
                            { step: 1, label: 'Envoi des plans au serveur' },
                            { step: 2, label: 'Préparation et lecture des plans' },
                            { step: 3, label: 'Analyse intelligente des symboles' },
                            { step: 4, label: 'Recherche des différences' },
                            { step: 5, label: 'Génération du rapport' }
                          ].map((s) => (
                            <div key={s.step} className="flex items-center gap-3">
                              <div className={`
                                w-5 h-5 rounded-lg-full flex items-center justify-center border text-[10px]
                                ${progressStep >= s.step ? 'bg-blueprint-cyan border-blueprint-cyan text-blueprint-bg' : 
                                  progressStep === s.step - 1 ? 'border-blueprint-cyan text-blueprint-primary' : 'border-blueprint-border/60 text-blueprint-text-sec'}
                              `}>
                                {progressStep >= s.step ? <Check className="w-3 h-3" /> : s.step}
                              </div>
                              <span className={`text-sm ${progressStep >= s.step ? 'text-blueprint-text' : 'text-blueprint-text-sec'}`}>
                                {s.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {analysisState === 'done' && (
              <div className="absolute inset-0 flex flex-col md:flex-row h-full">
                <div className="flex-1 p-4 h-full">
                  <BlueprintViewer 
                    referenceImageUrl={analysisResult?.reference_image_url} 
                    resultImageUrl={analysisResult?.result_image_url} 
                  />
                </div>
                <div className="w-full md:w-96 border-l border-blueprint-border/60 bg-blueprint-bg flex flex-col h-full shrink-0">
                  <div className="p-4 border-b border-blueprint-border/60 shrink-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display font-semibold text-lg">
                        Écarts ({filteredAnomalies.length} sur {analysisResult?.anomalies?.length || 0})
                      </h2>
                      <div className="relative">
                        <button 
                          onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                          className={`hover:text-blueprint-text transition-colors p-1 rounded-lg ${typeFilter !== 'all' ? 'text-blueprint-primary bg-blueprint-primary/10' : 'text-blueprint-text-sec'}`}
                        >
                          <Filter className="w-4 h-4" />
                        </button>
                        
                        {isFilterMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsFilterMenuOpen(false)}></div>
                            <div className="absolute right-0 top-full mt-1 w-40 bg-blueprint-surface border border-blueprint-border/60 rounded-lg shadow-xl shadow-blueprint-primary/10 z-20 py-1 overflow-hidden">
                              <button onClick={() => { setTypeFilter('all'); setIsFilterMenuOpen(false); }} className={`w-full text-left px-3 py-1.5 text-sm hover:bg-blueprint-bg ${typeFilter === 'all' ? 'text-blueprint-primary font-medium' : 'text-blueprint-text-sec'}`}>Tous les écarts</button>
                              <button onClick={() => { setTypeFilter('ajout'); setIsFilterMenuOpen(false); }} className={`w-full text-left px-3 py-1.5 text-sm hover:bg-blueprint-bg ${typeFilter === 'ajout' ? 'text-emerald-500 font-medium' : 'text-blueprint-text-sec'}`}>Ajouts</button>
                              <button onClick={() => { setTypeFilter('modification'); setIsFilterMenuOpen(false); }} className={`w-full text-left px-3 py-1.5 text-sm hover:bg-blueprint-bg ${typeFilter === 'modification' ? 'text-amber-500 font-medium' : 'text-blueprint-text-sec'}`}>Modifications</button>
                              <button onClick={() => { setTypeFilter('suppression'); setIsFilterMenuOpen(false); }} className={`w-full text-left px-3 py-1.5 text-sm hover:bg-blueprint-bg ${typeFilter === 'suppression' ? 'text-red-500 font-medium' : 'text-blueprint-text-sec'}`}>Suppressions</button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-6 bg-blueprint-surface/50 border border-blueprint-border/60 rounded-xl py-1.5 text-sm font-mono">
                      <div className="flex items-center gap-1.5 text-emerald-500">
                        <PlusCircle className="w-4 h-4" />
                        <span>{anomalyStats.ajout}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-500">
                        <Edit3 className="w-4 h-4" />
                        <span>{anomalyStats.modification}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-red-500">
                        <MinusCircle className="w-4 h-4" />
                        <span>{anomalyStats.suppression}</span>
                      </div>
                    </div>

                    <SearchInput initialValue={searchQuery} onSearch={setSearchQuery} />
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredAnomalies.map((anomaly) => (
                      <div 
                        key={anomaly.id} 
                        className={`bg-blueprint-surface border-y border-r border-blueprint-border/60 rounded-lg-r-md p-3 hover:bg-blueprint-elevated transition-colors group cursor-pointer ${getCriticalityBorder(anomaly.criticality)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-${getSemanticColor(anomaly.type)}`}>
                              {getSemanticIcon(anomaly.type, "w-4 h-4")}
                            </span>
                            <span className="font-mono text-sm font-medium text-blueprint-text">{anomaly.tag}</span>
                          </div>
                          <div className="flex gap-2 text-[10px] font-mono">
                            <span className="text-blueprint-text-sec">Zone {anomaly.location}</span>
                            <span className="text-blueprint-primary">{anomaly.confidence}%</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-blueprint-text-sec leading-snug mb-3">
                          {anomaly.desc}
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t border-blueprint-border/60">
                          <span className="text-[10px] uppercase text-blueprint-text-sec tracking-wider font-semibold">
                            {anomaly.criticality}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <footer className="h-16 shrink-0 border-t border-blueprint-border bg-blueprint-surface px-6 flex items-center justify-between text-xs z-10">
        <div>
          <div className="text-[10px] font-bold text-blueprint-text-sec tracking-widest uppercase mb-1">Designed & Developed by</div>
          <div className="font-semibold text-blueprint-text text-sm">Marouan Aouami</div>
          <div className="text-blueprint-cyan">Big Data & AI Engineer</div>
        </div>
        <div className="flex items-center gap-6">
          <a href="mailto:marouanaouami1@gmail.com" className="flex items-center gap-2 text-blueprint-text-sec hover:text-blueprint-cyan transition-colors">
            <Mail className="w-4 h-4" />
            <span>marouanaouami1@gmail.com</span>
          </a>
          <a href="https://www.linkedin.com/in/marouan-aouami-654649349/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blueprint-text-sec hover:text-[#0a66c2] transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect x="2" y="9" width="4" height="12" />
              <circle cx="4" cy="4" r="2" />
            </svg>
            <span>LinkedIn</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
