export const reportReasons = [
  'Acoso',
  'Spam',
  'Contenido sexual',
  'Suplantacion',
  'Discurso ofensivo',
  'Comportamiento extraño',
  'Contenido inapropiado',
  'Otra razon',
] as const;

export type ReportReason = (typeof reportReasons)[number];
export type ReportTargetType = 'publication' | 'profile';

export function isReportReason(value: unknown): value is ReportReason {
  return reportReasons.some((reason) => reason === value);
}
