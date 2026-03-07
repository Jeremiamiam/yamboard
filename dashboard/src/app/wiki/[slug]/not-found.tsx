import Link from "next/link";

export default function WikiNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <h1 className="text-xl font-semibold tracking-tight text-white mb-2">
        Wiki non trouvé
      </h1>
      <p className="text-sm text-zinc-500 mb-6">
        Ce client n&apos;a pas encore de wiki synchronisé.
      </p>
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        ← Retour au dashboard
      </Link>
    </div>
  );
}
