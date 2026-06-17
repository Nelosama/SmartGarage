export const formatCurrency = (value: number | string) => {
  return `L ${Number(value).toFixed(2)}`;
};
export const formatDate = (date: string | Date) => {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('es-HN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
};
export const formatNumber = (value: number | string) => {
  return new Intl.NumberFormat('es-HN').format(Number(value));
};