// Utilitários de datas e textos em português.
export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const MESES_CURTOS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

/** Data de hoje no formato AAAA-MM-DD (fuso local). */
export function hojeISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Converte "AAAA-MM-DD" em partes numéricas sem problemas de fuso. */
export function partes(iso: string) {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return { ano: a, mes: m - 1, dia: d };
}

export const dia2 = (iso: string) => String(partes(iso).dia).padStart(2, '0');
export const mesCurto = (iso: string) => MESES_CURTOS[partes(iso).mes];

/** "01 a 30 de novembro" ou "28 de novembro a 05 de dezembro". */
export function periodo(inicio: string, fim: string): string {
  const a = partes(inicio);
  const b = partes(fim);
  const da = String(a.dia).padStart(2, '0');
  const db = String(b.dia).padStart(2, '0');
  if (a.mes === b.mes && a.ano === b.ano) return `${da} a ${db} de ${MESES[a.mes]}`;
  return `${da} de ${MESES[a.mes]} a ${db} de ${MESES[b.mes]}`;
}

/** "17 de novembro" */
export function dataExtenso(iso: string): string {
  const p = partes(iso);
  return `${String(p.dia).padStart(2, '0')} de ${MESES[p.mes]}`;
}

/** "05 nov" */
export const dataCurta = (iso: string | null) => (iso ? `${dia2(iso)} ${mesCurto(iso).toLowerCase()}` : 'Sem prazo');

/** "SEGUNDA-FEIRA, 24 DE NOVEMBRO" */
export function hojePorExtenso(): string {
  const d = new Date();
  return `${DIAS[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} de ${MESES[d.getMonth()]}`;
}

/** Diferença em dias entre hoje e uma data (positivo = futuro). */
export function diasAte(iso: string): number {
  const p = partes(iso);
  const alvo = new Date(p.ano, p.mes, p.dia).getTime();
  const h = new Date();
  const hoje = new Date(h.getFullYear(), h.getMonth(), h.getDate()).getTime();
  return Math.round((alvo - hoje) / 86400000);
}

/** "Há 25 min", "Há 3 h", "Ontem", "04 nov" */
export function tempoRelativo(iso?: string | null): string {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'Agora';
  if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Há ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return 'Ontem';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')} ${MESES_CURTOS[d.getMonth()].toLowerCase()}`;
}

/** "04 nov, 10:32" */
export function dataHora(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')} ${MESES_CURTOS[d.getMonth()].toLowerCase()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export const moeda = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export const pct = (parte: number, total: number) => (total > 0 ? Math.round((parte / total) * 100) : 0);

export const doisDigitos = (n: number) => String(n).padStart(2, '0');

export const iniciais = (nome?: string) => (nome || '?').trim().charAt(0).toUpperCase();

/** "Novembro Azul" -> "novembro-azul" */
export function slugify(t: string): string {
  return t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
