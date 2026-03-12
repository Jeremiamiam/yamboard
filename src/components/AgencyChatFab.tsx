"use client";

import { useState } from "react";
import { AgencyChatDrawer } from "@/components/AgencyChatDrawer";
import { useClient, useClientProjects } from "@/hooks/useStoreData";
import { getContrastTextColor } from "@/lib/color-utils";
import { useStore } from "@/lib/store";

export function AgencyChatFab() {
  const [open, setOpen] = useState(false);
  const selectedClientId = useStore((s) => s.selectedClientId);
  const selectedProjectId = useStore((s) => s.selectedProjectId);
  const currentView = useStore((s) => s.currentView);
  const hasClient = !!selectedClientId && (currentView === "client" || currentView === "project");
  const hasProject = !!selectedProjectId && currentView === "project";
  const client = useClient(hasClient ? selectedClientId : undefined);
  const projects = useClientProjects(hasClient ? selectedClientId : undefined);
  const project = hasProject && projects ? projects.find((p) => p.id === selectedProjectId) ?? null : null;

  const bgColor = !open && client ? client.color : null;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center cursor-pointer overflow-hidden ${
          open ? "bg-zinc-500 hover:bg-zinc-600 text-white" : client ? "" : "bg-emerald-600 hover:bg-emerald-700 text-white"
        }`}
        style={bgColor ? { background: bgColor, color: getContrastTextColor(bgColor) } : undefined}
        title={open ? "Fermer Brandon" : client ? `Chat — ${client.name}` : "Chat agence — Brandon"}
        aria-label={open ? "Fermer Brandon" : "Ouvrir Brandon"}
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>
      <AgencyChatDrawer open={open} onClose={() => setOpen(false)} client={client} project={project} />
    </>
  );
}
