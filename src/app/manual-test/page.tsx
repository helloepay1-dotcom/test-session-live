"use client";

import { useState } from "react";

const testScript = `(function() {
  console.log("🧪 AI Session Live - Test d'injection");
  
  // Trouver le composer
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
      console.log("✅ Composer trouvé avec:", selector, element);
      break;
    }
  }

  if (!foundElement) {
    console.error("❌ Aucun composer trouvé");
    return;
  }

  // Tester l'injection
  const testText = "TEST MULTIPLAYER";
  console.log("📝 Injection de:", testText);

  try {
    if (foundElement instanceof HTMLTextAreaElement) {
      foundElement.value = testText;
      foundElement.dispatchEvent(new Event('input', { bubbles: true }));
      console.log("✅ Injection textarea réussie");
    } else {
      // ContentEditable
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(foundElement);
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      const inserted = document.execCommand('insertText', false, testText);
      if (inserted) {
        console.log("✅ Injection execCommand réussie");
      } else {
        foundElement.textContent = testText;
        console.log("✅ Injection textContent réussie");
      }
    }

    console.log("🎉 Test terminé - vérifiez si le texte apparaît dans ChatGPT");
    
    // Vérifier le contenu
    setTimeout(() => {
      console.log("📋 Contenu actuel:", foundElement.innerText || foundElement.value);
    }, 100);

  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : String(error);
    console.error("❌ Erreur:", message);
  }
})();`;

export default function ManualTest() {
  const [copied, setCopied] = useState(false);

  const copyScript = () => {
    navigator.clipboard.writeText(testScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Test Manuel d'Injection</h1>
        
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Instructions :</h2>
          <ol className="text-zinc-300 space-y-3 list-decimal list-inside">
            <li>Allez sur <span className="text-blue-400">https://chatgpt.com</span></li>
            <li>Ouvrez la console développeur (F12 ou Cmd+Option+I)</li>
            <li>Allez dans l'onglet "Console"</li>
            <li>Cliquez sur le bouton "Copier le script" ci-dessous</li>
            <li>Collez le script dans la console ChatGPT</li>
            <li>Appuyez sur Entrée</li>
            <li>Regardez les logs dans la console</li>
          </ol>
        </div>

        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Script de test :</h2>
            <button
              onClick={copyScript}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
            >
              {copied ? "✅ Copié !" : "Copier le script"}
            </button>
          </div>
          
          <pre className="bg-zinc-900 border border-zinc-700 rounded p-4 text-xs text-green-400 overflow-auto max-h-96">
            {testScript}
          </pre>
        </div>

        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4">Interprétation des résultats :</h2>
          
          <div className="space-y-4">
            <div className="bg-red-900/20 border border-red-700 rounded p-4">
              <h3 className="font-bold text-red-400 mb-2">Cas A : ❌ Aucun composer trouvé</h3>
              <p className="text-zinc-300 text-sm">
                Le sélecteur ne fonctionne pas. ChatGPT a peut-être changé son interface.
              </p>
            </div>
            
            <div className="bg-green-900/20 border border-green-700 rounded p-4">
              <h3 className="font-bold text-green-400 mb-2">Cas B : ✅ Injection réussie + texte apparaît</h3>
              <p className="text-zinc-300 text-sm">
                L'injection fonctionne ! Le problème est ailleurs (polling, userId, etc.).
              </p>
            </div>
            
            <div className="bg-yellow-900/20 border border-yellow-700 rounded p-4">
              <h3 className="font-bold text-yellow-400 mb-2">Cas C : ✅ Injection réussie mais texte n'apparaît pas</h3>
              <p className="text-zinc-300 text-sm">
                L'injection fonctionne mais ChatGPT ne détecte pas le changement (events).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}