export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

export async function shareText(title: string, text: string, url: string): Promise<ShareResult> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return "copied";
  } catch {
    return "failed";
  }
}

export const SHARE_TOAST: Record<ShareResult, string | null> = {
  shared: null,
  cancelled: null,
  copied: "Zkopírováno. Vlož to do zprávy.",
  failed: "Sdílení se nepovedlo.",
};
