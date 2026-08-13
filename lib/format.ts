export function formatDate(value: string) {
  if (!value) return "Архивын нийтлэл";
  const [year, month, day] = value.slice(0, 10).split("-");
  return [year, month, day].join(".");
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("mn-MN").format(value || 0);
}
