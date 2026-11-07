import { useState } from "react";
import { HeroPlate } from "../plate/Plate";
import { supabase } from "../lib/supabase";

export function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Tohle nevypadá jako e-mail.");
    setBusy(true);
    setError("");
    const { error } = await supabase!.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: location.origin } });
    setBusy(false);
    if (error) setError("Odkaz se nepodařilo poslat. Zkus to za chvíli znovu.");
    else setSent(true);
  };

  return (
    <main className="gate">
      <HeroPlate />
      <h1 className="title">Talířek</h1>
      {sent ? (
        <>
          <p className="sub">Odkaz pro přihlášení je na cestě do {email.trim()}. Otevři ho na tomhle zařízení.</p>
          <div className="switch">
            <button className="link" onClick={() => setSent(false)}>
              Zadat jiný e-mail
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="sub">Přihlas se e-mailem, pošleme ti odkaz. Bez hesla.</p>
          <form onSubmit={submit} noValidate>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tvuj@email.cz" autoComplete="email" aria-label="E-mail" enterKeyHint="send" />
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="btn primary" type="submit" disabled={busy}>
              Poslat odkaz
            </button>
          </form>
        </>
      )}
    </main>
  );
}

export function Onboarding({ onDone }: { onDone: (householdId: string) => void }) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("Doma");
  const [me, setMe] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res =
      mode === "create"
        ? await supabase!.rpc("create_household", { p_name: name, p_display_name: me })
        : await supabase!.rpc("join_household", { p_code: code, p_display_name: me });
    setBusy(false);
    if (res.error) setError(mode === "join" ? "Tenhle kód neznáme. Zkontroluj ho u partnera." : "Domácnost se nepodařilo založit.");
    else onDone(res.data as string);
  };

  return (
    <main className="gate">
      <h1 className="title">{mode === "create" ? "Nová domácnost" : "Připojit se"}</h1>
      <p className="sub">{mode === "create" ? "Založíme vám katalog s ukázkovými jídly a spíží. Všechno pak můžete upravit." : "Zadej kód, který najde partner v aplikaci pod kolečkem vpravo nahoře."}</p>
      <form onSubmit={submit} noValidate>
        {mode === "create" ? (
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Název domácnosti" aria-label="Název domácnosti" autoComplete="off" />
        ) : (
          <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Kód domácnosti" aria-label="Kód domácnosti" autoComplete="off" autoCapitalize="none" />
        )}
        <input className="input" value={me} onChange={(e) => setMe(e.target.value)} placeholder="Tvoje jméno" aria-label="Tvoje jméno" autoComplete="given-name" />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="btn primary" type="submit" disabled={busy || (mode === "join" && !code.trim())}>
          {mode === "create" ? "Založit domácnost" : "Připojit se"}
        </button>
      </form>
      <div className="switch">
        <button className="link" onClick={() => setMode(mode === "create" ? "join" : "create")}>
          {mode === "create" ? "Mám kód od partnera" : "Založit novou domácnost"}
        </button>
      </div>
    </main>
  );
}
