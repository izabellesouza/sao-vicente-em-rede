// Camada de acesso a dados.
// - Com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env → usa o Supabase (dados compartilhados).
// - Sem essas variáveis → MODO DEMONSTRAÇÃO: dados de exemplo salvos no navegador (localStorage).
// As telas usam sempre as mesmas funções abaixo, independentemente do modo.
import type { Tabela } from './types';
import { gerarDadosIniciais } from './seed';

const URL_SB = import.meta.env?.VITE_SUPABASE_URL as string | undefined;
const CHAVE_SB = import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined;

export const MODO: 'supabase' | 'demo' = URL_SB && CHAVE_SB && !URL_SB.includes('SEU-PROJETO') ? 'supabase' : 'demo';

type Filtro = Record<string, string | number | boolean | null>;

// ---------------------------------------------------------------------------
// Avisos de mudança: as telas recarregam quando algum dado é alterado.
// ---------------------------------------------------------------------------
const ouvintes = new Set<() => void>();
export function aoMudar(fn: () => void) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}
const avisar = () => ouvintes.forEach((fn) => fn());

// ---------------------------------------------------------------------------
// Supabase (carregado só quando configurado)
// ---------------------------------------------------------------------------
let clientePromise: Promise<any> | null = null;
export function supabase(): Promise<any> {
  if (!clientePromise) {
    clientePromise = import('@supabase/supabase-js').then(({ createClient }) => createClient(URL_SB!, CHAVE_SB!));
  }
  return clientePromise;
}

/** Cliente sem sessão salva — usado pelo administrador para cadastrar contas sem sair da própria. */
export async function supabaseSemSessao(): Promise<any> {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(URL_SB!, CHAVE_SB!, { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'svr-cadastro' } });
}

function erro(e: any): never {
  const msg = e?.message || String(e);
  if (/row-level security|permission denied/i.test(msg)) throw new Error('Seu perfil não tem permissão para esta ação.');
  throw new Error(msg);
}

// ---------------------------------------------------------------------------
// Modo demonstração (localStorage)
// ---------------------------------------------------------------------------
const CHAVE_LOCAL = 'svr-demo-v1';
type Banco = Record<string, any[]>;

function lerBanco(): Banco {
  try {
    const bruto = localStorage.getItem(CHAVE_LOCAL);
    if (bruto) return JSON.parse(bruto);
  } catch {
    /* navegador sem localStorage: segue com dados em memória */
  }
  const novo = gerarDadosIniciais() as unknown as Banco;
  salvarBanco(novo);
  return novo;
}
let memoria: Banco | null = null;
function banco(): Banco {
  if (!memoria) memoria = lerBanco();
  return memoria;
}
function salvarBanco(b: Banco) {
  memoria = b;
  try {
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify(b));
  } catch {
    /* cota cheia: mantém em memória */
  }
}
export function restaurarDemonstracao() {
  salvarBanco(gerarDadosIniciais() as unknown as Banco);
  avisar();
}
const novoId = () => (crypto as any).randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const combina = (linha: any, f?: Filtro) => !f || Object.entries(f).every(([k, v]) => linha[k] === v);

// ---------------------------------------------------------------------------
// API usada pelas telas
// ---------------------------------------------------------------------------
export async function listar<T>(tabela: Tabela, filtro?: Filtro): Promise<T[]> {
  if (MODO === 'supabase') {
    const sb = await supabase();
    let q = sb.from(tabela).select('*');
    if (filtro) q = q.match(filtro);
    const { data, error } = await q;
    if (error) erro(error);
    return data as T[];
  }
  return (banco()[tabela] || []).filter((l) => combina(l, filtro)).map((l) => ({ ...l })) as T[];
}

export async function inserir<T>(tabela: Tabela, linha: Partial<T>): Promise<T> {
  if (MODO === 'supabase') {
    const sb = await supabase();
    const { data, error } = await sb.from(tabela).insert(linha).select().single();
    if (error) erro(error);
    avisar();
    return data as T;
  }
  const b = banco();
  const nova = { id: novoId(), criado_em: new Date().toISOString(), ...linha };
  b[tabela] = [...(b[tabela] || []), nova];
  salvarBanco(b);
  avisar();
  return nova as T;
}

export async function atualizar<T>(tabela: Tabela, id: string | number, mudancas: Partial<T>): Promise<T> {
  if (MODO === 'supabase') {
    const sb = await supabase();
    const { data, error } = await sb.from(tabela).update(mudancas).eq('id', id).select().single();
    if (error) erro(error);
    avisar();
    return data as T;
  }
  const b = banco();
  let resultado: any = null;
  b[tabela] = (b[tabela] || []).map((l) => (l.id === id ? (resultado = { ...l, ...mudancas }) : l));
  salvarBanco(b);
  avisar();
  return resultado as T;
}

export async function remover(tabela: Tabela, filtro: Filtro): Promise<void> {
  if (MODO === 'supabase') {
    const sb = await supabase();
    const { error } = await sb.from(tabela).delete().match(filtro);
    if (error) erro(error);
    avisar();
    return;
  }
  const b = banco();
  b[tabela] = (b[tabela] || []).filter((l) => !combina(l, filtro));
  salvarBanco(b);
  avisar();
}

/** Envia um arquivo (imagem ou PDF) e devolve o endereço público. */
export async function enviarArquivo(arquivo: File): Promise<{ url: string; nome: string }> {
  if (MODO === 'supabase') {
    const sb = await supabase();
    const caminho = `${Date.now()}-${arquivo.name.normalize('NFD').replace(/[^\w.-]+/g, '_')}`;
    const { error } = await sb.storage.from('materiais').upload(caminho, arquivo, { upsert: false });
    if (error) erro(error);
    const { data } = sb.storage.from('materiais').getPublicUrl(caminho);
    return { url: data.publicUrl, nome: arquivo.name };
  }
  // Demonstração: reduz a imagem e guarda no navegador.
  if (!arquivo.type.startsWith('image/')) return { url: '', nome: arquivo.name };
  const url = await reduzirImagem(arquivo, 900);
  return { url, nome: arquivo.name };
}

function reduzirImagem(arquivo: File, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
      img.onload = () => {
        const escala = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * escala);
        c.height = Math.round(img.height * escala);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      img.src = String(leitor.result);
    };
    leitor.readAsDataURL(arquivo);
  });
}

/** Identificador que não corresponde a nenhum registro (usado em filtros vazios). */
export const SEM_ID = '00000000-0000-0000-0000-000000000000';
