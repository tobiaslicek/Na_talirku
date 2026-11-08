import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Sheet } from "./components/Sheet";
import { DayProvider } from "./components/day";
import { SheetsCtx, type SheetState, type Sheets } from "./components/sheets";
import { TabBar } from "./components/TabBar";
import { ToastProvider, useToast } from "./components/Toast";
import { supabaseBackend, type Backend } from "./lib/backend";
import { localBackend, LOCAL_USER } from "./lib/localBackend";
import { useRoute } from "./lib/route";
import { StoreProvider, useStore } from "./lib/store";
import { scrollToTop, useSmoothScroll } from "./lib/smooth";
import { supabase } from "./lib/supabase";
import { PlateDefs } from "./plate/Plate";
import { Login, Onboarding } from "./screens/Gate";
import { HomeSheet } from "./screens/HomeSheet";
import { IdeaDetail } from "./screens/IdeaDetail";
import { IngredientForm } from "./screens/IngredientForm";
import { PhotoImport } from "./screens/PhotoImport";
import { MealDetail } from "./screens/MealDetail";
import { MealForm } from "./screens/MealForm";
import { Meals } from "./screens/Meals";
import { Pantry } from "./screens/Pantry";
import { Shop } from "./screens/Shop";
import { Today } from "./screens/Today";

function Loading() {
  return <div className="loading" aria-busy="true" aria-label="Načítám" />;
}

function Shell() {
  const store = useStore();
  const { view, param } = useRoute();
  const [sheet, setSheet] = useState<SheetState>(null);
  useSmoothScroll();

  const sheets = useMemo<Sheets>(
    () => ({
      openMeal: (id) => setSheet({ kind: "meal", id }),
      openIdea: (id) => setSheet({ kind: "idea", id }),
      openEdit: (id) => setSheet({ kind: "edit", id }),
      openHome: () => setSheet({ kind: "home" }),
      openIngredient: (id) => setSheet({ kind: "ingredient", id }),
      openImport: (files) => setSheet({ kind: "import", files }),
      close: () => setSheet(null),
    }),
    [],
  );

  useLayoutEffect(() => {
    setSheet(null);
    scrollToTop();
  }, [view]);

  useEffect(() => {
    if (view !== "jidla" || !param) return;
    if (store.mealById(param)) setSheet({ kind: "meal", id: param });
    location.replace("#jidla");
  }, [view, param, store]);

  const me = store.snap.members.find((m) => m.user_id === store.userId);
  const initial = (me?.display_name || store.snap.household.name || "?").charAt(0).toUpperCase();

  const sheetKey = sheet ? `${sheet.kind}:${"id" in sheet ? sheet.id ?? "" : ""}` : "";

  return (
    <SheetsCtx.Provider value={sheets}>
      <button className="home-btn" onClick={sheets.openHome} aria-label="Domácnost">
        {initial}
      </button>
      <main className="app">
        {view === "dnes" && <Today key="dnes" />}
        {view === "jidla" && <Meals key="jidla" />}
        {view === "spiz" && <Pantry key="spiz" />}
        {view === "nakup" && <Shop key="nakup" />}
      </main>
      <TabBar view={view} badge={store.openShop.length} />
      <Sheet open={sheet !== null} onClose={sheets.close} labelledBy="sheet-title" contentKey={sheetKey}>
        {sheet?.kind === "meal" && <MealDetail key={sheet.id} id={sheet.id} />}
        {sheet?.kind === "idea" && <IdeaDetail key={sheet.id} id={sheet.id} />}
        {sheet?.kind === "edit" && <MealForm key={sheet.id ?? "new"} id={sheet.id} />}
        {sheet?.kind === "home" && <HomeSheet />}
        {sheet?.kind === "ingredient" && <IngredientForm key={sheet.id ?? "new"} id={sheet.id} />}
        {sheet?.kind === "import" && <PhotoImport files={sheet.files} />}
      </Sheet>
    </SheetsCtx.Provider>
  );
}

function Household({ backend, userId }: { backend: Backend; userId: string | null }) {
  const toast = useToast();
  const onError = useCallback(
    (e: unknown) => {
      console.error(e);
      toast("Nepovedlo se uložit. Zkontroluj připojení a zkus to znovu.");
    },
    [toast],
  );
  return (
    <StoreProvider backend={backend} userId={userId} onError={onError} fallback={<Loading />}>
      <DayProvider>
        <Shell />
      </DayProvider>
    </StoreProvider>
  );
}

function SupabaseApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [householdId, setHouseholdId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    supabase!.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase!.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const uid = session?.user.id;
  useEffect(() => {
    if (!uid) {
      setHouseholdId(undefined);
      return;
    }
    let live = true;
    supabase!
      .from("members")
      .select("household_id")
      .eq("user_id", uid)
      .order("created_at")
      .limit(1)
      .then(({ data }) => {
        if (live) setHouseholdId(data?.[0]?.household_id ?? null);
      });
    return () => {
      live = false;
    };
  }, [uid]);

  const backend = useMemo(() => (householdId ? supabaseBackend(householdId) : null), [householdId]);

  if (session === undefined) return <Loading />;
  if (!session) return <Login />;
  if (householdId === undefined) return <Loading />;
  if (!householdId || !backend) return <Onboarding onDone={setHouseholdId} />;
  return <Household key={householdId} backend={backend} userId={uid ?? null} />;
}

export function App() {
  const local = useMemo(() => (supabase ? null : localBackend()), []);
  return (
    <ToastProvider>
      <PlateDefs />
      {local ? <Household backend={local} userId={LOCAL_USER} /> : <SupabaseApp />}
    </ToastProvider>
  );
}
