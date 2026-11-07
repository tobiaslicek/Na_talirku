import { useState } from "react";
import { useToast } from "../components/Toast";
import { resetLocal } from "../lib/localBackend";
import { useStore } from "../lib/store";
import { supabase } from "../lib/supabase";

export function HomeSheet() {
  const store = useStore();
  const toast = useToast();
  const { household, members } = store.snap;
  const [copied, setCopied] = useState(false);
  const local = store.backendKind === "local";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(household.invite_code);
      setCopied(true);
      toast("Kód je zkopírovaný.");
    } catch {
      toast("Kód se nepodařilo zkopírovat.");
    }
  };

  return (
    <div>
      <h2 className="sheet-title" id="sheet-title">
        {household.name}
      </h2>
      <p className="meta">{members.map((m) => (m.user_id === store.userId ? `${m.display_name || "já"} (ty)` : m.display_name || "člen")).join(", ")}</p>
      {local ? (
        <div className="sheet-actions">
          <p className="quiet">Ukázkový režim: data jsou jen v tomhle prohlížeči. Po doplnění klíčů k Supabase do .env.local se aplikace přepne na sdílenou domácnost s přihlášením.</p>
          <button
            className="btn ghost"
            onClick={() => {
              if (!confirm("Vrátit ukázková data do výchozího stavu?")) return;
              resetLocal();
              location.reload();
            }}
          >
            Obnovit ukázková data
          </button>
        </div>
      ) : (
        <div className="sheet-actions">
          <span className="form-label">Kód pro připojení do domácnosti</span>
          <div className="code">
            <strong>{household.invite_code}</strong>
            <button className="link" onClick={copy}>
              {copied ? "zkopírováno" : "zkopírovat"}
            </button>
          </div>
          <p className="hint">Druhý člen se přihlásí svým e-mailem a zadá tenhle kód. Můžete mít i jeden společný účet.</p>
          <button className="btn ghost" onClick={() => supabase?.auth.signOut()}>
            Odhlásit se
          </button>
        </div>
      )}
    </div>
  );
}
