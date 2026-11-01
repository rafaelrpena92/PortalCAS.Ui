/** Cor de cada CAS, a mesma das regiões do mapa. */
export const CAS_COLORS: Record<string, string> = {
  'CAS Cascavel': '#dd68a9',
  'CAS Umuarama': '#E2686C',
  'CAS Maringá': '#F8ACAE',
  'CAS Apucarana': '#0C6682',
  'CAS Francisco Beltrão': '#A62629',
  'CAS Guarapuava': '#FF5254',
  'CAS Curitiba': '#5CACC4'
};

export const casColor = (name?: string | null) => (name && CAS_COLORS[name]) || '#8a919c';
