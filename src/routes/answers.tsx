import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/answers")({ component: SavedAnswersPage });

type SavedAnswer = Database["public"]["Tables"]["saved_answers"]["Row"];

function SavedAnswersPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [answers, setAnswers] = useState<SavedAnswer[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [tags, setTags] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error: loadError } = await supabase
      .from("saved_answers")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (loadError) setError(loadError.message);
    else setAnswers(data ?? []);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setQuestion("");
    setAnswer("");
    setTags("");
    setEditingId(null);
  }

  function edit(item: SavedAnswer) {
    setEditingId(item.id);
    setQuestion(item.question);
    setAnswer(item.answer);
    setTags(item.tags.join(", "));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);

    const normalizedQuestion = question.trim();
    const normalizedAnswer = answer.trim();
    if (!normalizedQuestion || !normalizedAnswer) {
      setError("Question and answer must contain non-whitespace text.");
      setBusy(false);
      return;
    }

    const parsedTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload = {
      user_id: user.id,
      question: normalizedQuestion,
      answer: normalizedAnswer,
      tags: parsedTags,
      updated_at: new Date().toISOString(),
    };

    const result = editingId
      ? await supabase.from("saved_answers").update(payload).eq("id", editingId).eq("user_id", user.id)
      : await supabase.from("saved_answers").insert(payload);

    if (result.error) setError(result.error.message);
    else {
      resetForm();
      await load();
    }
    setBusy(false);
  }

  async function remove(id: string) {
    if (!user) return;
    const { error: deleteError } = await supabase
      .from("saved_answers")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (deleteError) setError(deleteError.message);
    else {
      if (editingId === id) resetForm();
      await load();
    }
  }

  if (loading || !user) return <main style={pageStyle}>Loading saved answers…</main>;

  return (
    <main style={pageStyle}>
      <a href="/dashboard" style={backLink}>← Dashboard</a>
      <h1 style={{ fontSize: 34, marginBottom: 8 }}>Saved application answers</h1>
      <p style={{ color: "#4b5563", lineHeight: 1.6 }}>
        Store factual answers you reuse across applications. Automation may reuse these only when the question matches and the answer is safe; sensitive or uncertain required questions still stop for your input.
      </p>

      <form onSubmit={save} style={formStyle}>
        <h2 style={{ margin: 0, fontSize: 20 }}>{editingId ? "Edit answer" : "Add reusable answer"}</h2>
        <label style={labelStyle}>Question
          <textarea required value={question} onChange={(e) => setQuestion(e.target.value)} style={textareaStyle} rows={3} placeholder="Example: Are you legally authorized to work in the United States?" />
        </label>
        <label style={labelStyle}>Answer
          <textarea required value={answer} onChange={(e) => setAnswer(e.target.value)} style={textareaStyle} rows={5} placeholder="Enter only a factual answer you want saved." />
        </label>
        <label style={labelStyle}>Tags
          <input value={tags} onChange={(e) => setTags(e.target.value)} style={inputStyle} placeholder="work authorization, availability, portfolio" />
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          <button disabled={busy} style={primaryButton}>{busy ? "Saving…" : editingId ? "Update answer" : "Save answer"}</button>
          {editingId ? <button type="button" onClick={resetForm} style={secondaryButton}>Cancel</button> : null}
        </div>
      </form>

      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

      <section style={{ display: "grid", gap: 12 }}>
        {answers.length === 0 ? <p style={{ color: "#6b7280" }}>No saved answers yet.</p> : answers.map((item) => (
          <article key={item.id} style={cardStyle}>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{item.question}</h2>
              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.55, color: "#374151" }}>{item.answer}</p>
              {item.tags.length ? <p style={{ marginBottom: 0, color: "#6b7280", fontSize: 14 }}>Tags: {item.tags.join(", ")}</p> : null}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <button onClick={() => edit(item)} style={secondaryButton}>Edit</button>
              <button onClick={() => void remove(item.id)} style={dangerButton}>Delete</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = { maxWidth: 920, margin: "0 auto", padding: "40px 24px", fontFamily: "system-ui" };
const backLink: React.CSSProperties = { color: "#1d4ed8", textDecoration: "none" };
const formStyle: React.CSSProperties = { display: "grid", gap: 14, border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, margin: "28px 0" };
const labelStyle: React.CSSProperties = { display: "grid", gap: 7, fontWeight: 600 };
const inputStyle: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: 8, padding: "11px 12px", fontSize: 16, fontWeight: 400 };
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: "vertical", fontFamily: "inherit" };
const primaryButton: React.CSSProperties = { border: 0, borderRadius: 8, padding: "11px 14px", background: "#111827", color: "white", cursor: "pointer" };
const secondaryButton: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px", background: "white", cursor: "pointer" };
const dangerButton: React.CSSProperties = { ...secondaryButton, border: "1px solid #fecaca", color: "#b91c1c" };
const cardStyle: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 12, padding: 18, display: "flex", justifyContent: "space-between", gap: 18 };
