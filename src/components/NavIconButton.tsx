"use client";

import { Button } from "@/components/ui";

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
    <Button
      variant="ghost"
      size="icon_md"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={className}
    >
      <span className="block w-5 h-5 [&>svg]:w-full [&>svg]:h-full [&>svg]:stroke-[2]">
        {children}
      </span>
    </Button>
  );
}
