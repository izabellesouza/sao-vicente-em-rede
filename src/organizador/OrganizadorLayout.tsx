// Estrutura do organizador interno: menu lateral, barra superior e proteção por login.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useRouter } from '../lib/router';
import { Icone, Logo } from '../lib/icons';
import { FUNCOES, pode, useAuth } from '../lib/auth';
import { Avatar, Carregando } from '../lib/ui';
import { MODO } from '../lib/backend';
import { atrasada, useConfig, useTabela } from '../lib/dados';
import { dataCurta, diasAte } from '../lib/format';
import type { Material, Tarefa } from '../lib/types';

const MENU = [
  { to: '/organizador/visao-geral', rotulo: 'Visão geral', icone: 'home' },
  { to: '/organizador/campanhas', rotulo: 'Campanhas', icone: 'megaphone' },
  { to: '/organizador/calendario', rotulo: 'Calendário', icone: 'calendar' },
  { to: '/organizador/tarefas', rotulo: 'Minhas tarefas', icone: 'tasks' },
  { to: '/organizador/materiais', rotulo: 'Materiais', icone: 'file' },
  { to: '/organizador/aprovacoes', rotulo: 'Aprovações', icone: 'approve' },
  { to: '/organizador/conteudo-publico', rotulo: 'Conteúdo público', icone: 'globe' },
  { to: '/organizador/resultados', rotulo: 'Resultados', icone: 'chart' },
  { to: '/organizador/usuarios', rotulo: 'Usuários', icone: 'user-plus' },
  { to: '/organizador/configuracoes', rotulo: 'Configurações', icone: 'settings' },
];

export default function OrganizadorLayout({ titulo, children }: { titulo: string; children: ReactNode }) {
  const { perfil, carregando, sair } = useAuth();
  const { path, navigate } = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);
  const cfg = useConfig();
  const { dados: materiais } = useTabela<Material>('materiais', { status: 'aguardando_aprovacao' });

  useEffect(() => {
    if (!carregando && !perfil) navigate('/organizador/login');
  }, [carregando, perfil]);
  useEffect(() => setMenuAberto(false), [path]);

  if (carregando || !perfil) return <Carregando />;

  const pendentesAprovacao = materiais.length;

  return (
    <div className="org">
      <a className="pular-link" href="#conteudo">Pular para o conteúdo</a>
      <aside className={`org-lateral ${menuAberto ? 'org-lateral--aberta' : ''}`} id="menu-org">
        <div className="org-lateral__logo">
          <Link to="/organizador/visao-geral" aria-label="Visão geral"><Logo claro /></Link>
          <span>Organizador interno</span>
        </div>
        <nav aria-label="Menu do organizador">
          {MENU.map((m) => {
            const ativo = path.startsWith(m.to);
            return (
              <Link key={m.to} to={m.to} className={ativo ? 'ativo' : ''} aria-current={ativo ? 'page' : undefined}>
                <Icone nome={m.icone} />
                {m.rotulo}
                {m.to.endsWith('aprovacoes') && pendentesAprovacao > 0 && (
                  <span className="contador" aria-label={`${pendentesAprovacao} aguardando`}>{pendentesAprovacao}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="org-lateral__usuario">
          <Avatar nome={perfil.nome} tamanho={40} />
          <div>
            <strong>{perfil.nome.split(' ')[0]}</strong>
            <small>{FUNCOES[perfil.funcao].rotulo}</small>
          </div>
          <button type="button" className="btn-icone" onClick={() => sair().then(() => navigate('/organizador/login'))} aria-label="Sair">
            <Icone nome="logout" />
          </button>
        </div>
      </aside>
      {menuAberto && <div className="org-sombra" onClick={() => setMenuAberto(false)} />}

      <div className="org-principal">
        <header className="org-topo">
          <button type="button" className="btn-icone org-topo__menu" aria-expanded={menuAberto} aria-controls="menu-org" onClick={() => setMenuAberto(!menuAberto)}>
            <Icone nome="menu" tamanho={22} />
            <span className="visualmente-oculto">Abrir menu</span>
          </button>
          <p className="trilha">
            <span>{cfg.instituicao.replace('Hospital ', 'Hosp. ')}</span> / <strong>{titulo}</strong>
          </p>
          <div className="org-topo__acoes">
            <Link to="/portal" className="btn btn--suave btn--pequeno"><Icone nome="globe" /> <span className="some-movel">Ver portal</span></Link>
            <Notificacoes perfilId={perfil.id} aprovador={pode.aprovar(perfil)} />
            <Avatar nome={perfil.nome} tamanho={38} />
          </div>
        </header>
        {MODO === 'demo' && (
          <p className="faixa-demo">
            <Icone nome="alert" tamanho={16} /> Modo demonstração: os dados ficam salvos apenas neste navegador. Configure o Supabase para dados compartilhados.
          </p>
        )}
        <main id="conteudo" className="org-conteudo" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

function Notificacoes({ perfilId, aprovador }: { perfilId: string; aprovador: boolean }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { dados: tarefas } = useTabela<Tarefa>('tarefas', { responsavel_id: perfilId });
  const { dados: materiais } = useTabela<Material>('materiais', { status: 'aguardando_aprovacao' });
  const { dados: ajustes } = useTabela<Material>('materiais', { status: 'ajuste_solicitado', autor_id: perfilId });

  const urgentes = tarefas.filter((t) => t.status !== 'concluido' && t.prazo && diasAte(t.prazo) <= 2).sort((a, b) => a.prazo!.localeCompare(b.prazo!));
  const itens = [
    ...urgentes.map((t) => ({ id: t.id, to: '/organizador/tarefas', texto: t.titulo, sub: atrasada(t) ? `Atrasada • ${dataCurta(t.prazo)}` : `Prazo: ${dataCurta(t.prazo)}`, icone: 'clock' })),
    ...(aprovador ? materiais.map((m) => ({ id: m.id, to: `/organizador/aprovacoes/${m.id}`, texto: m.titulo, sub: 'Aguardando sua aprovação', icone: 'approve' })) : []),
    ...ajustes.map((m) => ({ id: `a${m.id}`, to: `/organizador/aprovacoes/${m.id}`, texto: m.titulo, sub: 'Ajuste solicitado', icone: 'pencil' })),
  ];

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [aberto]);

  return (
    <div className="notificacoes" ref={ref}>
      <button type="button" className="btn-icone btn-icone--borda" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
        <Icone nome="bell" />
        {itens.length > 0 && <span className="notificacoes__ponto" />}
        <span className="visualmente-oculto">Notificações ({itens.length})</span>
      </button>
      {aberto && (
        <div className="notificacoes__painel">
          <strong>Notificações</strong>
          {itens.length === 0 ? (
            <p className="texto-suave">Tudo em dia por aqui.</p>
          ) : (
            <ul>
              {itens.map((i) => (
                <li key={i.id}>
                  <Link to={i.to} onClick={() => setAberto(false)}>
                    <Icone nome={i.icone} />
                    <span><b>{i.texto}</b><small>{i.sub}</small></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Cabeçalho padrão das páginas internas. */
export function TituloPagina({ titulo, texto, children }: { titulo: string; texto?: string; children?: ReactNode }) {
  return (
    <div className="org-titulo">
      <div>
        <h1>{titulo}</h1>
        {texto && <p>{texto}</p>}
      </div>
      {children && <div className="org-titulo__acoes">{children}</div>}
    </div>
  );
}

/** Mapa id → perfil, para mostrar nomes. */
export function usePerfis() {
  const { dados } = useTabela<import('../lib/types').Perfil>('perfis');
  const mapa = new Map(dados.map((p) => [p.id, p]));
  return { lista: dados, nome: (id?: string | null) => (id && mapa.get(id)?.nome) || '—', mapa };
}
