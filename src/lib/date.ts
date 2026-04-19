export function formatDate(iso: string, locale: string = "ko-KR"): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateLong(iso: string, locale: string = "ko-KR"): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
