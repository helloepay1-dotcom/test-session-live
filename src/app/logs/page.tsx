"use client";

import { useState, useEffect, useRef } from "react";

export default function LogsPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Intercepter console.log pour capturer les logs du navigateur
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (type: string, ...args: any[]) => {
      const timestamp = new Date().toLocaleTimeString();
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setLogs(prev => [...prev, `[${timestamp}] [${type}] ${message}`]);
    };

    console.log = (...args) => {
      originalLog.apply(console, args);
      addLog('LOG', ...args);
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      addLog('ERROR', ...args);
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      addLog('WARN', ...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // Auto-scroll vers le bas
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const clearLogs = () => {
    setLogs([]);
  };

  const filterLogs = (filter: string) => {
    // Cette fonction pourrait être utilisée pour filtrer les logs
    console.log("Filtering logs for:", filter);
  };

  return (
    <div className="min-h-screen bg-zinc-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">📋 Logs de l'application</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                autoScroll ? 'bg-green-600 text-white' : 'bg-zinc-700 text-zinc-300'
              }`}
            >
              {autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
            </button>
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Effacer
            </button>
          </div>
        </div>

        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 mb-4">
          <h2 className="text-sm font-medium text-zinc-300 mb-2">Instructions :</h2>
          <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
            <li>Créez une session et démarrez la capture avec l'extension</li>
            <li>Les logs apparaîtront ici automatiquement</li>
            <li>Regardez particulièrement les logs contenant "POLLING", "MESSAGE", "INJECTION"</li>
            <li>Si vous voyez des boucles, copiez les logs ici pour analyse</li>
          </ul>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 h-[600px] overflow-auto font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-zinc-500 text-center py-8">
              En attente de logs... Créez une session et démarrez la capture.
            </div>
          ) : (
            logs.map((log, i) => (
              <div 
                key={i} 
                className={`mb-1 ${
                  log.includes('ERROR') ? 'text-red-400' :
                  log.includes('WARN') ? 'text-yellow-400' :
                  log.includes('POLLING') ? 'text-blue-400' :
                  log.includes('INJECTION') ? 'text-green-400' :
                  log.includes('MESSAGE') ? 'text-purple-400' :
                  'text-zinc-300'
                }`}
              >
                {log}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => filterLogs('POLLING')}
            className="px-3 py-2 bg-blue-900/30 border border-blue-700 rounded text-blue-400 text-xs hover:bg-blue-900/50 transition-colors"
          >
            Filtrer: POLLING
          </button>
          <button
            onClick={() => filterLogs('MESSAGE')}
            className="px-3 py-2 bg-purple-900/30 border border-purple-700 rounded text-purple-400 text-xs hover:bg-purple-900/50 transition-colors"
          >
            Filtrer: MESSAGE
          </button>
          <button
            onClick={() => filterLogs('INJECTION')}
            className="px-3 py-2 bg-green-900/30 border border-green-700 rounded text-green-400 text-xs hover:bg-green-900/50 transition-colors"
          >
            Filtrer: INJECTION
          </button>
          <button
            onClick={() => filterLogs('ERROR')}
            className="px-3 py-2 bg-red-900/30 border border-red-700 rounded text-red-400 text-xs hover:bg-red-900/50 transition-colors"
          >
            Filtrer: ERROR
          </button>
        </div>
      </div>
    </div>
  );
}