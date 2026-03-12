"use client";

import { useState, useTransition } from "react";
import type { Document } from "@/lib/types";
import type { ClientLinkRow, ContactRow } from "@/lib/data/client-queries";
import { useClient, useClientDocs } from "@/hooks/useStoreData";
import { useClientContacts } from "@/hooks/useClientContacts";
import { useClientLinks } from "@/hooks/useClientLinks";
import {
  createContactAction,
  createClientLinkAction,
  deleteContactAction,
  deleteClientLinkAction,
} from "@/lib/store/actions";
import { deleteDocument } from "@/app/(dashboard)/actions/documents";
import { AddDocForm } from "@/components/AddDocForm";
import { DeleteMenu } from "@/components/DeleteMenu";
import { useStore } from "@/lib/store";

type Props = {
  clientId: string;
};

export function ClientDetailSidebar({ clientId }: Props) {
  const client = useClient(clientId);
  const { contacts, refresh: refreshContacts } = useClientContacts(clientId);
  const { links, refresh: refreshLinks } = useClientLinks(clientId);
  const docs = useClientDocs(clientId);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isPendingDoc, startDocTransition] = useTransition();

  function handleDeleteDoc(docId: string) {
    startDocTransition(async () => {
      const err = await deleteDocument(docId);
      if (!err.error) {
        useStore.getState().loadData();
      }
    });
  }

  function handleAddContact() {
    const n = contactName.trim();
    if (!n) return;
    startTransition(async () => {
      const err = await createContactAction({
        clientId,
        name: n,
        email: contactEmail.trim() || undefined,
        isPrimary: contacts.length === 0,
      });
      if (!err.error) {
        setContactName("");
        setContactEmail("");
        setShowAddContact(false);
        refreshContacts();
        useStore.getState().loadData();
      }
    });
  }

  function handleAddLink() {
    const l = linkLabel.trim();
    const u = linkUrl.trim();
    if (!l || !u) return;
    startTransition(async () => {
      const err = await createClientLinkAction({ clientId, label: l, url: u });
      if (!err.error) {
        setLinkLabel("");
        setLinkUrl("");
        setShowAddLink(false);
        refreshLinks();
      }
    });
  }

  const detailOpen = useStore((s) => s.detailSidebarOpen);
  const closeDetail = useStore((s) => s.closeDetailSidebar);

  if (!client) return null;

  return (
    <>
      {detailOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={closeDetail} />
      )}
      <aside
        className={`fixed bottom-0 z-40 flex flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 transition-transform duration-200 md:translate-x-0 ${
          detailOpen ? "translate-x-0" : "-translate-x-full"
        } md:!translate-x-0 w-[min(320px,85vw)] md:w-[var(--client-detail-sidebar-w)]`}
        style={{
          left: "var(--sidebar-w)",
          top: "calc(var(--nav-h) + var(--breadcrumb-h))",
        }}
      >
        {/* ── Sections scrollables (nav top = breadcrumb commun) ── */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Contacts */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Contacts ({contacts.length})
              </span>
              <button
                onClick={() => { setShowAddContact((v) => !v); setShowAddLink(false); setShowAddDoc(false); }}
                className="w-6 h-6 rounded flex items-center justify-center text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                +
              </button>
            </div>
            <div className="space-y-1">
              {showAddContact && (
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 space-y-2 mb-2">
                  <input
                    type="text"
                    placeholder="Nom"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                  <div className="flex gap-1">
                    <button onClick={handleAddContact} disabled={!contactName.trim() || isPending} className="flex-1 py-1 text-xs rounded text-white disabled:opacity-50" style={{ background: client.color }}>
                      OK
                    </button>
                    <button onClick={() => { setShowAddContact(false); setContactName(""); setContactEmail(""); }} className="px-2 py-1 text-xs text-zinc-500">✕</button>
                  </div>
                </div>
              )}
              {contacts.length === 0 && !showAddContact && <p className="text-xs text-zinc-500 py-1">Aucun contact</p>}
              {contacts.map((c) => (
                <div key={c.id} className="group flex items-center justify-between gap-1 py-1.5 px-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{c.name}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-600 truncate">{c.role || c.email || "—"}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 shrink-0">
                    <DeleteMenu onDelete={() => { startTransition(async () => { await deleteContactAction(c.id); refreshContacts(); useStore.getState().loadData(); }); }} confirmLabel="Supprimer ce contact ?" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Liens */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Liens ({links.length})
              </span>
              <button
                onClick={() => { setShowAddLink((v) => !v); setShowAddContact(false); setShowAddDoc(false); }}
                className="w-6 h-6 rounded flex items-center justify-center text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                +
              </button>
            </div>
            <div className="space-y-1">
              {showAddLink && (
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 space-y-2 mb-2">
                  <input type="text" placeholder="Label (Figma, Dropbox…)" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} className="w-full px-2 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800" />
                  <input type="url" placeholder="URL" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="w-full px-2 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800" />
                  <div className="flex gap-1">
                    <button onClick={handleAddLink} disabled={!linkLabel.trim() || !linkUrl.trim() || isPending} className="flex-1 py-1 text-xs rounded text-white disabled:opacity-50" style={{ background: client.color }}>OK</button>
                    <button onClick={() => { setShowAddLink(false); setLinkLabel(""); setLinkUrl(""); }} className="px-2 py-1 text-xs text-zinc-500">✕</button>
                  </div>
                </div>
              )}
              {links.length === 0 && !showAddLink && <p className="text-xs text-zinc-500 py-1">Aucun lien</p>}
              {links.map((link) => (
                <div key={link.id} className="group flex items-center justify-between gap-1 py-1.5 px-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/50">
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 truncate text-sm font-medium" style={{ color: client.color }}>
                    {link.label}
                  </a>
                  <div className="opacity-0 group-hover:opacity-100 shrink-0">
                    <DeleteMenu onDelete={() => { startTransition(async () => { await deleteClientLinkAction(link.id); refreshLinks(); }); }} confirmLabel="Supprimer ce lien ?" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Documents */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Documents ({docs.length})
              </span>
              <button
                onClick={() => { setShowAddDoc((v) => !v); setShowAddContact(false); setShowAddLink(false); }}
                className="w-6 h-6 rounded flex items-center justify-center text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                +
              </button>
            </div>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {showAddDoc && (
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 border-dashed mb-2">
                  <AddDocForm clientId={clientId} clientColor={client.color} onSuccess={() => setShowAddDoc(false)} />
                </div>
              )}
              {docs.length === 0 && !showAddDoc && <p className="text-xs text-zinc-500 py-1">Aucun document</p>}
              {docs.map((doc) => (
                <div key={doc.id} className="group flex items-center justify-between gap-1 py-1.5 px-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/50">
                  <button onClick={() => useStore.getState().setViewerDocId(doc.id)} className="flex-1 min-w-0 text-left truncate text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white">
                    {doc.isPinned && <span className="text-amber-500 mr-1">📌</span>}
                    {doc.name}
                  </button>
                  <div className="opacity-0 group-hover:opacity-100 shrink-0">
                    <DeleteMenu onDelete={() => handleDeleteDoc(doc.id)} confirmLabel="Supprimer ce document ?" disabled={isPendingDoc} />
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </aside>
    </>
  );
}
