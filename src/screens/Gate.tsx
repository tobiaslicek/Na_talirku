import { useState } from "react";
import { HeroPlate } from "../plate/Plate";
import { supabase } from "../lib/supabase";
import { tidy } from "../lib/format";

type Step = "email" | "sent" | "code";

export function Login() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim());

  const go = (next: Step) => {
    setError("");
    setStep(next);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validEmail) return setError("Tohle nevypadá jako e-mail.");
    setBusy(true);
    setError("");
    const { error } = await supabase!.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: location.origin } });
    setBusy(false);
    if (!error) go("sent");
    else setError(error.status === 429 ? "E-mailů odešlo moc najednou. Zkus to za chvíli, nebo se přihlas kódem z jiného zařízení." : "Odkaz se nepodařilo poslat. Zkus to za chvíli znovu.");
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = code.replace(/\D/g, "");
    if (!validEmail) return setError("Tohle nevypadá jako e-mail.");
    if (token.length < 6) return setError("Opiš celý kód.");
    setBusy(true);
    setError("");
    let res = await supabase!.auth.verifyOtp({ email: email.trim(), token, type: "email" });
    if (res.error) res = await supabase!.auth.verifyOtp({ email: email.trim(), token, type: "magiclink" });
    setBusy(false);
    if (res.error) setError("Kód nesedí nebo už vypršel. Nech si ukázat nový.");
  };

  const errorLine = error && (
    <p className="error" role="alert">
      {error}
    </p>
  );

  return (
    <main className="gate">
      <HeroPlate />
      <h1 className="title">Na talířku</h1>
      {step === "email" && (
        <>
          <p className="sub">Přihlas se e-mailem, pošleme ti odkaz. Bez hesla.</p>
          <form onSubmit={send} noValidate>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tvuj@email.cz" autoComplete="email" aria-label="E-mail" enterKeyHint="send" />
            {errorLine}
            <button className="btn primary" type="submit" disabled={busy}>
              Poslat odkaz
            </button>
          </form>
          <div className="switch">
            <button className="link" onClick={() => go("code")}>
              Mám kód z jiného zařízení
            </button>
          </div>
        </>
      )}
      {step === "sent" && (
        <>
          <p className="sub">{tidy(`Odkaz je na cestě do ${email.trim()}. Otevře se ve výchozím prohlížeči a tam tě přihlásí.`)}</p>
          <p className="hint">{tidy("Chceš být přihlášený i jinde, třeba v Chromu nebo v aplikaci na ploše? Tam, kde už přihlášený jsi, otevři kolečko vpravo nahoře a nech si ukázat kód.")}</p>
          <div className="switch">
            <button className="link" onClick={() => go("code")}>
              Mám kód z jiného zařízení
            </button>
            <button className="link" onClick={() => go("email")}>
              Zadat jiný e-mail
            </button>
          </div>
        </>
      )}
      {step === "code" && (
        <>
          <p className="sub">{tidy("Kód ti ukáže aplikace tam, kde už přihlášený jsi: kolečko vpravo nahoře, pak „Ukázat kód pro přihlášení“.")}</p>
          <form onSubmit={verify} noValidate>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tvuj@email.cz" autoComplete="email" aria-label="E-mail" />
            <input className="input otp" value={code} onChange={(e) => setCode(e.target.value)} placeholder="kód" aria-label="Kód" inputMode="numeric" autoComplete="one-time-code" maxLength={12} enterKeyHint="go" />
            {errorLine}
            <button className="btn primary" type="submit" disabled={busy}>
              Přihlásit
            </button>
          </form>
          <div className="switch">
            <button className="link" onClick={() => go("email")}>
              Přihlásit se odkazem z e-mailu
            </button>
          </div>
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
      <p className="sub">{mode === "create" ? "Založíme vám katalog jídel a spíž. Všechno pak můžete upravit." : "Zadej kód, který najde partner v aplikaci pod kolečkem vpravo nahoře."}</p>
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
