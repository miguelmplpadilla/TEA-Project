export type TeaDiagnosis =
  | 'exploring'
  | 'self-suspected'
  | 'in-process'
  | 'diagnosed-unverified';

export const teaDiagnosisOptions: {label: string; value: TeaDiagnosis}[] = [
  {
    label: 'Explorando sin diagnostico indicado',
    value: 'exploring',
  },
  {
    label: 'Creo que soy tea (pendiente de diagnostico).',
    value: 'self-suspected',
  },
  {
    label: 'Diagnostico en proceso',
    value: 'in-process',
  },
  {
    label: 'Diagnostico tea (No verificado).',
    value: 'diagnosed-unverified',
  },
];

export const defaultTeaDiagnosis: TeaDiagnosis = 'exploring';

export function isTeaDiagnosis(value: unknown): value is TeaDiagnosis {
  return teaDiagnosisOptions.some((option) => option.value === value);
}

export function getTeaDiagnosisLabel(value: TeaDiagnosis) {
  return teaDiagnosisOptions.find((option) => option.value === value)?.label ?? teaDiagnosisOptions[0].label;
}

export function getTeaDiagnosisColor(value: TeaDiagnosis) {
  switch (value) {
    case 'exploring':
      return '#8b9490';
    case 'self-suspected':
      return '#2f9e44';
    case 'in-process':
      return '#d63384';
    case 'diagnosed-unverified':
      return '#1c7ed6';
  }
}
