import { BancaPhase, BancaStatus } from '../Models/BancaAggregate/banca.model';

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const MONTHS_LONG = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

/** Datas da API vêm como "AAAA-MM-DD" (sem fuso). */
const parts = (date?: string | null) => {
  if (!date) return null;
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return { y, m, d };
};

export const dayOf = (date?: string | null) => parts(date) ? String(parts(date)!.d).padStart(2, '0') : '--';
export const monthOf = (date?: string | null) => parts(date) ? MONTHS[parts(date)!.m - 1] : '';
export const yearOf = (date?: string | null) => parts(date)?.y ?? null;

/** 12/12/2026 */
export const formatDate = (date?: string | null) => {
  const p = parts(date);
  return p ? `${String(p.d).padStart(2, '0')}/${String(p.m).padStart(2, '0')}/${p.y}` : 'a definir';
};

/** 12/12 */
export const formatShortDate = (date?: string | null) => formatDate(date).slice(0, 5);

/** 12 de dezembro de 2026 */
export const formatLongDate = (date?: string | null) => {
  const p = parts(date);
  return p ? `${p.d} de ${MONTHS_LONG[p.m - 1]} de ${p.y}` : 'data a definir';
};

export const weekdayOf = (date?: string | null) => {
  const p = parts(date);
  return p ? WEEKDAYS[new Date(p.y, p.m - 1, p.d).getDay()] : '';
};

/** 12/12/2026 a 14/12/2026 (ou só 12/12/2026 se for um dia) */
export const formatPeriod = (start?: string | null, end?: string | null) =>
  !start ? 'a definir' : !end || end === start ? formatDate(start) : `${formatDate(start)} a ${formatDate(end)}`;

/** Dia do bloco de data: "12" ou "12–14" (mesmo mês). */
export const dayRangeOf = (start?: string | null, end?: string | null) =>
  !end || end === start || monthOf(start) !== monthOf(end) ? dayOf(start) : `${dayOf(start)}–${dayOf(end)}`;

/** "Sábado" ou "Sábado a Segunda-feira" */
export const weekdayRangeOf = (start?: string | null, end?: string | null) =>
  !end || end === start ? weekdayOf(start) : `${weekdayOf(start)} a ${weekdayOf(end).toLowerCase()}`;

/** "08:00:00" -> "08:00" */
export const formatTime = (time?: string | null) => time ? time.slice(0, 5) : '';

/** Rótulo e cores de cada fase. */
export const PHASES: Record<BancaPhase, { label: string; bg: string; fg: string }> = {
  [BancaPhase.Rascunho]: { label: 'Rascunho', bg: '#eef1f5', fg: '#3d434d' },
  [BancaPhase.Cancelada]: { label: 'Cancelada', bg: '#fde8e8', fg: '#9b0f13' },
  [BancaPhase.InscricoesEmBreve]: { label: 'Inscrições em breve', bg: '#fff6bf', fg: '#4a3d00' },
  [BancaPhase.InscricoesAbertas]: { label: 'Inscrições abertas', bg: '#e3f4ea', fg: '#0f5b30' },
  [BancaPhase.AguardandoBanca]: { label: 'Aguardando a banca', bg: '#e8f1fa', fg: '#004e87' },
  [BancaPhase.BancaEmAndamento]: { label: 'Banca em andamento', bg: '#ede9fe', fg: '#5b21b6' },
  [BancaPhase.AguardandoResultado]: { label: 'Aguardando resultado', bg: '#eef1f5', fg: '#3d434d' }
};

export const STATUS_LABEL: Record<BancaStatus, string> = {
  [BancaStatus.Rascunho]: 'Rascunho',
  [BancaStatus.Ativa]: 'Ativa',
  [BancaStatus.Cancelada]: 'Cancelada'
};

/** Link de vídeo do YouTube para o formato de incorporar; outros links ficam como estão. */
export const embedVideoUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};
