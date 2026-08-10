import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-surface-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <span className="font-semibold text-zinc-100">Session Live</span>
          </div>
          <Link
            href="/create"
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
          >
            Créer une session
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-soft" />
            Temps réel avec Supabase
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-zinc-50 mb-4">
            Collaborez sur des
            <br />
            <span className="text-accent">conversations IA</span>
          </h1>

          <p className="text-lg text-zinc-400 mb-10 leading-relaxed">
            Plusieurs personnes peuvent regarder la même conversation IA se
            dérouler en direct, intervenir, et prendre la main — comme Figma
            ou Google Docs.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/create"
              className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Démarrer une session
            </Link>
            <Link
              href="/sessions"
              className="px-6 py-3 bg-surface-overlay hover:bg-surface-border border border-surface-border text-zinc-300 font-medium rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              📋 Mes sessions
            </Link>
            <Link
              href="/logs"
              className="px-6 py-3 bg-surface-overlay hover:bg-surface-border border border-surface-border text-zinc-300 font-medium rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              📋 Logs
            </Link>
            <Link
              href="/download"
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              📥 Télécharger l'extension
            </Link>
          </div>
        </div>
      </main>

      <section id="features" className="border-t border-surface-border py-16 px-6">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: "⚡",
              title: "Temps réel",
              desc: "Messages, participants et interventions synchronisés instantanément via Supabase Realtime.",
            },
            {
              icon: "🤝",
              title: "Prise de main",
              desc: "Un seul participant contrôle la saisie à la fois. Demandez ou passez la main facilement.",
            },
            {
              icon: "🔌",
              title: "Extension Chrome",
              desc: "Capture automatique des conversations ChatGPT et Claude.ai vers votre session live.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="glass rounded-2xl p-6 animate-slide-up"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-zinc-100 mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
