"use client";

interface MessageInputProps {
  hasHand: boolean;
  onSend: (contenu: string) => void;
}

export default function MessageInput({ hasHand, onSend }: MessageInputProps) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("message") as HTMLInputElement;
    const contenu = input.value.trim();
    if (!contenu) return;
    onSend(contenu);
    input.value = "";
  }

  return (
    <div className="border-t border-surface-border p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          name="message"
          type="text"
          placeholder="Écrire un message..."
          autoComplete="off"
          className="flex-1 bg-surface-overlay border border-surface-border rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        <button
          type="submit"
          className="px-5 py-3 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-xl transition-colors"
        >
          Envoyer
        </button>
      </form>
      <p className="text-xs text-zinc-600 mt-2 text-center">
        💡 Le message sera copié dans votre presse-papier. Collez-le dans ChatGPT.
      </p>
    </div>
  );
}
