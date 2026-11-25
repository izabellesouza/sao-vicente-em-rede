// Autenticação: e-mail e senha (Supabase Auth) ou contas de demonstração.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { MODO, atualizar, listar, supabase } from './backend';
import type { Funcao, Perfil } from './types';

interface AuthValor {
  perfil: Perfil | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
}

const AuthCtx = createContext<AuthValor>(null as any);
export const useAuth = () => useContext(AuthCtx);

export const SENHA_DEMO = 'demo123';
const CHAVE_SESSAO_DEMO = 'svr-demo-sessao';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregarPerfil(id: string | null) {
    if (!id) return setPerfil(null);
    const [p] = await listar<Perfil>('perfis', { id });
    if (p && !p.ativo) {
      setPerfil(null);
      return;
    }
    setPerfil(p || null);
    if (p) atualizar<Perfil>('perfis', p.id, { ultimo_acesso: new Date().toISOString() }).catch(() => undefined);
  }

  useEffect(() => {
    if (MODO === 'demo') {
      carregarPerfil(sessionStorage.getItem(CHAVE_SESSAO_DEMO)).finally(() => setCarregando(false));
      return;
    }
    let cancelar = () => {};
    supabase().then(async (sb) => {
      const { data } = await sb.auth.getSession();
      await carregarPerfil(data.session?.user?.id ?? null).catch(() => setPerfil(null));
      setCarregando(false);
      const { data: sub } = sb.auth.onAuthStateChange((_e: string, sessao: any) => {
        carregarPerfil(sessao?.user?.id ?? null).catch(() => setPerfil(null));
      });
      cancelar = () => sub.subscription.unsubscribe();
    });
    return () => cancelar();
  }, []);

  async function entrar(email: string, senha: string) {
    email = email.trim().toLowerCase();
    if (MODO === 'demo') {
      const [p] = await listar<Perfil>('perfis', { email });
      if (!p || senha !== SENHA_DEMO) throw new Error('E-mail ou senha incorretos.');
      if (!p.ativo) throw new Error('Este acesso está desativado. Procure o administrador.');
      sessionStorage.setItem(CHAVE_SESSAO_DEMO, p.id);
      await carregarPerfil(p.id);
      return;
    }
    const sb = await supabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password: senha });
    if (error) throw new Error(/invalid/i.test(error.message) ? 'E-mail ou senha incorretos.' : error.message);
    await carregarPerfil(data.user.id);
    const [p] = await listar<Perfil>('perfis', { id: data.user.id });
    if (p && !p.ativo) {
      await sb.auth.signOut();
      throw new Error('Seu acesso ainda não foi liberado ou está desativado. Procure o administrador.');
    }
  }

  async function sair() {
    if (MODO === 'demo') sessionStorage.removeItem(CHAVE_SESSAO_DEMO);
    else await (await supabase()).auth.signOut();
    setPerfil(null);
  }

  return <AuthCtx.Provider value={{ perfil, carregando, entrar, sair }}>{children}</AuthCtx.Provider>;
}

// ---------------------------------------------------------------------------
// Perfis de acesso (slides 5 e 17)
// ---------------------------------------------------------------------------
export const FUNCOES: Record<Funcao, { rotulo: string; descricao: string; cor: string }> = {
  marketing: { rotulo: 'Conceito e planejamento', descricao: 'Cria campanhas, distribui tarefas, aprova materiais e publica no portal.', cor: 'coral' },
  producao: { rotulo: 'Publicações e materiais', descricao: 'Consulta briefings, atualiza tarefas e envia materiais para aprovação.', cor: 'petroleo' },
  admin: { rotulo: 'Administrador', descricao: 'Gerencia contas, perfis, formas de apoio e configurações.', cor: 'coral' },
  visualizador: { rotulo: 'Consulta', descricao: 'Acompanha campanhas, indicadores e relatórios, sem editar.', cor: 'petroleo' },
};

const tem = (p: Perfil | null, ...f: Funcao[]) => !!p && f.includes(p.funcao);

export const pode = {
  editarCampanhas: (p: Perfil | null) => tem(p, 'admin', 'marketing'),
  gerenciarTarefas: (p: Perfil | null) => tem(p, 'admin', 'marketing'),
  moverTarefa: (p: Perfil | null, responsavel_id: string | null) =>
    tem(p, 'admin', 'marketing') || (tem(p, 'producao') && responsavel_id === p!.id),
  enviarMaterial: (p: Perfil | null) => tem(p, 'admin', 'marketing', 'producao'),
  aprovar: (p: Perfil | null) => tem(p, 'admin', 'marketing'),
  publicar: (p: Perfil | null) => tem(p, 'admin', 'marketing'),
  editarResultados: (p: Perfil | null) => tem(p, 'admin', 'marketing'),
  gerenciarUsuarios: (p: Perfil | null) => tem(p, 'admin'),
  configurar: (p: Perfil | null) => tem(p, 'admin', 'marketing'),
};
