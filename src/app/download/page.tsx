import Link from "next/link";

export default function DownloadPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full glass rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📦</span>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Télécharger l'extension</h1>
        <p className="text-zinc-400 mb-6">
          Téléchargez le fichier ZIP de l'extension Chrome
        </p>

        <a
          href="/api/download-extension"
          download="ai-session-live-extension.zip"
          className="inline-block w-full py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-xl transition-colors mb-4"
        >
          📥 Télécharger l'extension
        </a>

        <div className="bg-surface-overlay rounded-lg p-4 text-left text-sm text-zinc-300 mb-4">
          <h3 className="font-semibold mb-2">Instructions d'installation :</h3>
          <ol className="space-y-2 text-zinc-400">
            <li>1. Décompressez le fichier ZIP téléchargé</li>
            <li>2. Allez sur <code className="bg-surface-border px-1 rounded">chrome://extensions/</code></li>
            <li>3. Activez "Mode développeur"</li>
            <li>4. Cliquez sur "Charger l'extension non empaquetée"</li>
            <li>5. Sélectionnez le dossier décompressé</li>
          </ol>
        </div>

        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}