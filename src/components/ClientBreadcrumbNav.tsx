"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { ClientAvatar, invalidateLogoCache } from "@/components/ClientAvatar";
import {
  createClientLogoUploadUrl,
  saveClientLogo,
  getClientLogoForDownload,
  getClientLogoSignedUrl,
  removeClientLogo,
} from "@/app/(dashboard)/actions/clients";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { Button, SectionHeader, Surface, Dialog } from "@/components/ui";
import type { Client, Project } from "@/lib/types";

type Props = {
  client: Client;
  project?: Project | null;
  clientId: string;
  rightSlot?: React.ReactNode;
};

export function ClientBreadcrumbNav({ client, project, clientId, rightSlot }: Props) {
  const navigateTo = useStore((s) => s.navigateTo);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isPendingLogo, startLogoTransition] = useTransition();
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showLogoModal || !client.logoPath) return;
    getClientLogoSignedUrl(client.logoPath).then((r) => {
      if ("signedUrl" in r) setLogoPreviewUrl(r.signedUrl);
    });
  }, [showLogoModal, client.logoPath]);

  async function handleDownloadSvg() {
    if (!client.logoPath) return;
    const result = await getClientLogoForDownload(client.logoPath);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    const blob = new Blob([result.content], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${client.name.replace(/[^a-zA-Z0-9-_]/g, "-")}-logo.svg`;
    a.click();
    URL.revokeObjectURL(url);
    setShowLogoModal(false);
    toast.success("Logo téléchargé");
  }

  function handleAvatarClick(e: React.MouseEvent) {
    e.stopPropagation();
    setShowLogoModal(true);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".svg") && file.type !== "image/svg+xml") {
      toast.error("Seuls les fichiers SVG sont acceptés");
      return;
    }
    e.target.value = "";
    startLogoTransition(async () => {
      const urlResult = await createClientLogoUploadUrl(clientId);
      if ("error" in urlResult) {
        toast.error(urlResult.error);
        return;
      }
      const supabase = createBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .uploadToSignedUrl(urlResult.path, urlResult.token, file, {
          contentType: "image/svg+xml",
        });
      if (uploadError) {
        toast.error(uploadError.message);
        return;
      }
      const saveResult = await saveClientLogo(clientId, urlResult.path);
      if (saveResult.error) {
        toast.error(saveResult.error);
        return;
      }
      invalidateLogoCache(urlResult.path);
      invalidateLogoCache(client.logoPath);
      setShowLogoModal(false);
      toast.success("Logo mis à jour");
      useStore.getState().loadData();
    });
  }

  async function handleRemoveLogo() {
    startLogoTransition(async () => {
      const result = await removeClientLogo(clientId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      invalidateLogoCache(client.logoPath);
      setShowLogoModal(false);
      toast.success("Logo supprimé");
      useStore.getState().loadData();
    });
  }

  return (
    <header
      className="fixed right-0 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 border-b overflow-hidden"
      style={{
        top: "var(--nav-h)",
        left: "var(--sidebar-w)",
        right: 0,
        height: "var(--breadcrumb-h)",
        background: "var(--color-foreground)",
        borderColor: "var(--color-mist)",
      }}
    >
      <nav className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden" aria-label="Fil d'Ariane">
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAvatarClick}
            className="shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
            title="Logo client"
          >
            <ClientAvatar client={client} size="sm" rounded="lg" />
          </button>
          <button
            onClick={() => navigateTo(clientId)}
            className="font-medium truncate max-w-[120px] sm:max-w-none hover:opacity-90 transition-opacity text-left"
            style={{ color: "var(--color-text)" }}
          >
            {client.name}
          </button>
        </div>
        {project && (
          <>
            <span className="shrink-0" style={{ color: "var(--color-text-supporting)" }}>/</span>
            <button
              onClick={() => navigateTo(clientId, project.id)}
              className="font-medium truncate hover:opacity-90 transition-opacity cursor-pointer max-w-[100px] sm:max-w-[200px] md:max-w-none"
              style={{ color: "var(--color-text)" }}
            >
              {project.name}
            </button>
          </>
        )}
      </nav>
      {rightSlot && <div className="shrink-0 flex items-center">{rightSlot}</div>}

      <Dialog open={showLogoModal} onClose={() => setShowLogoModal(false)}>
        <input
          ref={logoInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          className="hidden"
          onChange={handleLogoUpload}
        />
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <SectionHeader level="h2" as="h2" id="logo-modal-title">
            Logo {client.name}
          </SectionHeader>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          {client.logoPath ? (
            <>
              {logoPreviewUrl && (
                <Surface variant="muted" padding="md" className="w-32 h-32 flex items-center justify-center rounded-lg">
                  <img
                    src={logoPreviewUrl}
                    alt={`Logo ${client.name}`}
                    className="max-w-full max-h-full object-contain"
                  />
                </Surface>
              )}
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDownloadSvg}
                >
                  Télécharger le SVG
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isPendingLogo}
                >
                  {isPendingLogo ? "…" : "Changer"}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleRemoveLogo}
                  disabled={isPendingLogo}
                >
                  Supprimer le logo
                </Button>
              </div>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => logoInputRef.current?.click()}
              disabled={isPendingLogo}
            >
              {isPendingLogo ? "Upload…" : "Ajouter un logo SVG"}
            </Button>
          )}
        </div>
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => setShowLogoModal(false)}
          >
            Fermer
          </Button>
        </div>
      </Dialog>
    </header>
  );
}
