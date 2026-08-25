import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  DOCUMENT_KINDS,
  DOCUMENT_KIND_LABELS,
  DOCUMENT_STORAGE_BUCKET,
  documentStoragePath,
  type CandidateDocument,
  type DocumentKind,
} from "@/lib/domain-types";

export const Route = createFileRoute("/documents")({ component: DocumentsPage });

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

function DocumentsPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<DocumentKind>("resume");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    const { data, error: loadError } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (loadError) {
      setError(loadError.message);
      setDocuments([]);
      return;
    }
    setDocuments(data ?? []);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function uploadDocument(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError("File is too large. Maximum size is 10 MB.");
      return;
    }
    if (file.type && !ACCEPTED_TYPES.has(file.type)) {
      setError("Use a PDF, DOC, DOCX, or TXT file.");
      return;
    }

    setBusy(true);
    setError(null);
    const path = documentStoragePath(user.id, file.name);
    const { error: uploadError } = await supabase.storage
      .from(DOCUMENT_STORAGE_BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type || undefined });

    if (uploadError) {
      setError(uploadError.message);
      setBusy(false);
      return;
    }

    const { error: recordError } = await supabase.from("documents").insert({
      user_id: user.id,
      kind,
      name: file.name,
      storage_path: path,
      mime_type: file.type || null,
      size_bytes: file.size,
    });

    if (recordError) {
      await supabase.storage.from(DOCUMENT_STORAGE_BUCKET).remove([path]);
      setError(recordError.message);
    } else {
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      await load();
    }
    setBusy(false);
  }

  async function openDocument(doc: CandidateDocument) {
    if (!doc.storage_path) return;
    setError(null);
    const { data, error: signedError } = await supabase.storage
      .from(DOCUMENT_STORAGE_BUCKET)
      .createSignedUrl(doc.storage_path, 60);
    if (signedError) {
      setError(signedError.message);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function changeKind(doc: CandidateDocument, next: DocumentKind) {
    if (!user) return;
    setError(null);
    const { error: updateError } = await supabase
      .from("documents")
      .update({ kind: next, is_default: false })
      .eq("id", doc.id)
      .eq("user_id", user.id);
    if (updateError) setError(updateError.message);
    else await load();
  }

  async function makeDefault(doc: CandidateDocument) {
    if (!user) return;
    setError(null);
    const { error: clearError } = await supabase
      .from("documents")
      .update({ is_default: false })
      .eq("user_id", user.id)
      .eq("kind", doc.kind);
    if (clearError) {
      setError(clearError.message);
      return;
    }
    const { error: setErrorResult } = await supabase
      .from("documents")
      .update({ is_default: true })
      .eq("id", doc.id)
      .eq("user_id", user.id);
    if (setErrorResult) setError(setErrorResult.message);
    else await load();
  }

  async function removeDocument(doc: CandidateDocument) {
    if (!user) return;
    setError(null);
    if (doc.storage_path) {
      const { error: storageError } = await supabase.storage
        .from(DOCUMENT_STORAGE_BUCKET)
        .remove([doc.storage_path]);
      if (storageError) {
        setError(storageError.message);
        return;
      }
    }
    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", doc.id)
      .eq("user_id", user.id);
    if (deleteError) setError(deleteError.message);
    else await load();
  }

  if (loading || !user) return <main style={pageStyle}>Loading documents…</main>;

  return (
    <main style={pageStyle}>
      <nav style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 28 }}>
        <a href="/dashboard" style={navLink}>Dashboard</a>
        <a href="/jobs" style={navLink}>Jobs</a>
        <a href="/applications" style={navLink}>Applications</a>
      </nav>

      <h1 style={{ fontSize: 34, marginBottom: 8 }}>Documents</h1>
      <p style={{ color: "#4b5563" }}>
        Store resumes and application documents privately. Files are opened only through short-lived links.
      </p>

      <form onSubmit={uploadDocument} style={panelStyle}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Upload document</h2>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          style={inputStyle}
        />
        <select value={kind} onChange={(event) => setKind(event.target.value as DocumentKind)} style={inputStyle}>
          {DOCUMENT_KINDS.map((value) => (
            <option key={value} value={value}>{DOCUMENT_KIND_LABELS[value]}</option>
          ))}
        </select>
        <button disabled={!file || busy} style={primaryButton}>
          {busy ? "Uploading…" : "Upload"}
        </button>
        <small style={{ color: "#6b7280" }}>PDF, DOC, DOCX, or TXT · maximum 10 MB</small>
      </form>

      {error ? <p role="alert" style={{ color: "#b91c1c" }}>{error}</p> : null}

      <section style={{ display: "grid", gap: 12 }}>
        {documents.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No documents uploaded yet.</p>
        ) : documents.map((doc) => (
          <article key={doc.id} style={cardStyle}>
            <div>
              <strong>{doc.name}</strong>{doc.is_default ? <span style={defaultTag}>Default</span> : null}
              <div style={{ color: "#6b7280", fontSize: 14, marginTop: 6 }}>
                {DOCUMENT_KIND_LABELS[doc.kind]} · {doc.size_bytes ? `${Math.ceil(doc.size_bytes / 1024)} KB` : "size unknown"}
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
              <select
                aria-label={`Kind for ${doc.name}`}
                value={doc.kind}
                onChange={(event) => void changeKind(doc, event.target.value as DocumentKind)}
                style={{ ...inputStyle, padding: "8px 10px" }}
              >
                {DOCUMENT_KINDS.map((value) => <option key={value} value={value}>{DOCUMENT_KIND_LABELS[value]}</option>)}
              </select>
              <button type="button" disabled={doc.is_default} onClick={() => void makeDefault(doc)} style={secondaryButton}>Make default</button>
              <button type="button" onClick={() => void openDocument(doc)} style={secondaryButton}>Open</button>
              <button type="button" onClick={() => void removeDocument(doc)} style={dangerButton}>Delete</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = { maxWidth: 980, margin: "0 auto", padding: "40px 24px", fontFamily: "system-ui" };
const navLink: React.CSSProperties = { color: "#1d4ed8", textDecoration: "none" };
const panelStyle: React.CSSProperties = { display: "grid", gap: 12, border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, margin: "28px 0" };
const cardStyle: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 12, padding: 18, display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center" };
const inputStyle: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: 8, padding: "11px 12px", fontSize: 16, background: "white" };
const primaryButton: React.CSSProperties = { border: 0, borderRadius: 8, padding: "11px 14px", background: "#111827", color: "white", cursor: "pointer" };
const secondaryButton: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: 8, padding: "8px 11px", background: "white", color: "#111827", cursor: "pointer" };
const dangerButton: React.CSSProperties = { border: "1px solid #fecaca", borderRadius: 8, padding: "8px 11px", background: "#fff", color: "#b91c1c", cursor: "pointer" };
const defaultTag: React.CSSProperties = { marginLeft: 8, fontSize: 12, background: "#e0e7ff", color: "#3730a3", padding: "3px 7px", borderRadius: 999 };
