import { useState } from "react";
import { useToast } from "../components/Toast";
import { resetLocal } from "../lib/localBackend";
import { useStore } from "../lib/store";
import { supabase } from "../lib/supabase";
import { tidy } from "../lib/format";

export function HomeSheet() {
  const store = useStore();
  const toast = useToast();
  const { household, members } = store.snap;
  const [copied, setCopied] = useState(false);
  const [device, setDevice] = useState<{ email: string; code: string } | null>(null);
  const [busy, setBusy] = useState(false);
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

  const showDeviceCode = async () => {
    setBusy(true);
    const { data, error } = await supabase!.functions.invoke("device-code");
    setBusy(false);
    if (error || !data?.code) return toast("Kód se nepodařilo vytvořit. Zkus to za chvíli znovu.");
    setDevice(data);
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
          <span className="form-label">Přihlásit další zařízení</span>
          {device ? (
            <>
              <div className="code">
                <strong>{device.code.replace(/(\d{4})(?=\d)/g, "$1\u00a0")}</strong>
              </div>
              <p className="hint">{tidy(`Na druhém zařízení zvol „Mám kód z jiného zařízení“, zadej ${device.email} a tenhle kód. Platí hodinu a jen jednou.`)}</p>
            </>
          ) : (
            <>
              <button className="btn ghost" onClick={showDeviceCode} disabled={busy}>
                Ukázat kód pro přihlášení
              </button>
              <p className="hint">{tidy("Třeba v jiném prohlížeči, na druhém počítači nebo v aplikaci na ploše telefonu. Odkaz z e-mailu se otevře jen ve výchozím prohlížeči.")}</p>
            </>
          )}
          <button className="btn ghost" onClick={() => supabase?.auth.signOut()}>
            Odhlásit se
          </button>
        </div>
      )}
    </div>
  );
}
