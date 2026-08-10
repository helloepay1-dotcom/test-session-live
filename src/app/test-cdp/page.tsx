"use client";

import { useState } from "react";

export default function TestCDP() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testCDP = async () => {
    setLoading(true);
    setResult("");
    
    try {
      // Envoyer un message à l'extension pour tester CDP
      const response = await chrome.runtime.sendMessage({
        type: "INJECT_INTERVENTION",
        text: message
      });
      
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult(`Erreur: ${error.message}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Test CDP</h1>
        
        <div className="space-y-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message à injecter"
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
          />
          
          <button
            onClick={testCDP}
            disabled={loading || !message}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 text-white rounded"
          >
            {loading ? "Injection..." : "Tester CDP"}
          </button>
          
          {result && (
            <pre className="p-4 bg-zinc-800 border border-zinc-700 rounded text-green-400 overflow-auto">
              {result}
            </pre>
          )}
        </div>
        
        <div className="mt-8 p-4 bg-zinc-800 border border-zinc-700 rounded">
          <h2 className="text-lg font-bold text-white mb-2">Instructions :</h2>
          <ol className="text-zinc-300 space-y-2 list-decimal list-inside">
            <li>Ouvrez ChatGPT dans un onglet</li>
            <li>Entrez un message ci-dessus</li>
            <li>Cliquez sur "Tester CDP"</li>
            <li>Le message devrait apparaître dans ChatGPT</li>
          </ol>
        </div>
      </div>
    </div>
  );
}