"use client";

import { useState } from "react";

export default function TestInjection() {
  const [logs, setLogs] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testInjection = async () => {
    setTesting(true);
    setLogs([]);
    addLog("🧪 Début du test d'injection...");

    try {
      // Essayer de trouver le composer dans la page actuelle
      const selectors = [
        '#prompt-textarea',
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]',
        'textarea'
      ];

      let foundElement = null;
      let foundSelector = null;

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          foundElement = element;
          foundSelector = selector;
          addLog(`✅ Élément trouvé avec sélecteur: ${selector}`);
          break;
        }
      }

      if (!foundElement) {
        addLog("❌ Aucun élément trouvé - nous ne sommes pas sur ChatGPT");
        addLog("💡 Ce test doit être exécuté sur chatgpt.com");
        setTesting(false);
        return;
      }

      // Tester l'injection
      const testText = "TEST MULTIPLAYER";
      addLog(`📝 Tentative d'injection: "${testText}"`);

      if (foundElement instanceof HTMLTextAreaElement) {
        foundElement.value = testText;
        foundElement.dispatchEvent(new Event('input', { bubbles: true }));
        addLog("✅ Injection dans textarea réussie");
      } else {
        // ContentEditable
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(foundElement);
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        const inserted = document.execCommand('insertText', false, testText);
        if (inserted) {
          addLog("✅ Injection via execCommand réussie");
        } else {
          foundElement.textContent = testText;
          addLog("✅ Injection via textContent réussie");
        }
      }

      addLog("🎉 Test terminé - vérifiez si le texte apparaît dans ChatGPT");

    } catch (error) {
      addLog(`❌ Erreur: ${error instanceof Error ? error.message : String(error)}`);
    }

    setTesting(false);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-zinc-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Test d'Injection ChatGPT</h1>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={testInjection}
            disabled={testing}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 text-white rounded font-medium"
          >
            {testing ? "Test en cours..." : "Lancer le test"}
          </button>
          
          <button
            onClick={clearLogs}
            className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded font-medium ml-2"
          >
            Effacer les logs
          </button>
        </div>

        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
          <h2 className="text-lg font-bold text-white mb-2">Instructions :</h2>
          <ol className="text-zinc-300 space-y-2 list-decimal list-inside mb-4">
            <li>Ouvrez ChatGPT dans un onglet</li>
            <li>Ouvrez cette page de test dans le même onglet (ou dans un nouvel onglet)</li>
            <li>Cliquez sur "Lancer le test"</li>
            <li>Regardez les logs ci-dessous</li>
          </ol>
          
          <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3 text-yellow-200 text-sm">
            ⚠️ Pour un test complet, vous devez être sur chatgpt.com. Cette page simule le test si vous n'êtes pas sur ChatGPT.
          </div>
        </div>

        {logs.length > 0 && (
          <div className="mt-6 bg-zinc-800 border border-zinc-700 rounded-lg p-4">
            <h2 className="text-lg font-bold text-white mb-2">Logs :</h2>
            <div className="space-y-1 font-mono text-sm">
              {logs.map((log, i) => (
                <div key={i} className={log.includes("❌") ? "text-red-400" : log.includes("✅") ? "text-green-400" : "text-zinc-300"}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}