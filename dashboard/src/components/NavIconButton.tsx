"use client";

/** Bouton icône homogène pour la nav client — taille et style unifiés */
export function NavIconButton({
  onClick,
  title,
  children,
  className = "",
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${className}`}
      aria-label={title}
    >
      <span className="block w-5 h-5 [&>svg]:w-full [&>svg]:h-full [&>svg]:stroke-[2]">
        {children}
      </span>
    </button>
  );
}
