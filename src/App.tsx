import { useEffect } from 'react';
import { RouterProvider, match, useRouter, Link } from './lib/router';
import { AuthProvider } from './lib/auth';
import { Avisos } from './lib/ui';
import ApresentacaoProjeto from './projeto/ApresentacaoProjeto';
import PortalLayout from './portal/PortalLayout';
import Inicio from './portal/Inicio';
import Campanhas from './portal/Campanhas';
import Calendario from './portal/Calendario';
import CampanhaPagina from './portal/CampanhaPagina';
import ComoApoiar from './portal/ComoApoiar';
import Contato from './portal/Contato';
import OrganizadorLayout from './organizador/OrganizadorLayout';
import Login from './organizador/Login';
import VisaoGeral from './organizador/VisaoGeral';
import CampanhasOrg from './organizador/CampanhasOrg';
import CampanhaForm from './organizador/CampanhaForm';
import CalendarioOrg from './organizador/CalendarioOrg';
import Tarefas from './organizador/Tarefas';
import Materiais from './organizador/Materiais';
import Aprovacoes from './organizador/Aprovacoes';
import AprovacaoDetalhe from './organizador/AprovacaoDetalhe';
import ConteudoPublico from './organizador/ConteudoPublico';
import Resultados from './organizador/Resultados';
import Usuarios from './organizador/Usuarios';
import Configuracoes from './organizador/Configuracoes';

type Rota = { p: string; el: (params: Record<string, string>) => JSX.Element; titulo: string };

const ROTAS_PORTAL: Rota[] = [
  { p: '/portal', el: () => <Inicio />, titulo: 'Início' },
  { p: '/portal/campanhas', el: () => <Campanhas />, titulo: 'Campanhas' },
  { p: '/portal/campanhas/:slug', el: (x) => <CampanhaPagina slug={x.slug} />, titulo: 'Campanha' },
  { p: '/portal/calendario', el: () => <Calendario />, titulo: 'Calendário' },
  { p: '/portal/como-apoiar', el: () => <ComoApoiar />, titulo: 'Como apoiar' },
  { p: '/portal/contato', el: () => <Contato />, titulo: 'Contato' },
];

const ROTAS_ORG: Rota[] = [
  { p: '/organizador/visao-geral', el: () => <VisaoGeral />, titulo: 'Visão geral' },
  { p: '/organizador/campanhas', el: () => <CampanhasOrg />, titulo: 'Campanhas' },
  { p: '/organizador/campanhas/nova', el: () => <CampanhaForm />, titulo: 'Nova campanha' },
  { p: '/organizador/campanhas/:id', el: (x) => <CampanhaForm id={x.id} />, titulo: 'Campanha' },
  { p: '/organizador/calendario', el: () => <CalendarioOrg />, titulo: 'Calendário' },
  { p: '/organizador/tarefas', el: () => <Tarefas />, titulo: 'Minhas tarefas' },
  { p: '/organizador/materiais', el: () => <Materiais />, titulo: 'Materiais' },
  { p: '/organizador/aprovacoes', el: () => <Aprovacoes />, titulo: 'Aprovações' },
  { p: '/organizador/aprovacoes/:id', el: (x) => <AprovacaoDetalhe id={x.id} />, titulo: 'Aprovação de material' },
  { p: '/organizador/conteudo-publico', el: () => <ConteudoPublico />, titulo: 'Conteúdo público' },
  { p: '/organizador/resultados', el: () => <Resultados />, titulo: 'Resultados' },
  { p: '/organizador/usuarios', el: () => <Usuarios />, titulo: 'Usuários' },
  { p: '/organizador/configuracoes', el: () => <Configuracoes />, titulo: 'Configurações' },
];

function encontrar(rotas: Rota[], path: string) {
  for (const r of rotas) {
    const params = match(r.p, path);
    if (params) return { rota: r, params };
  }
  return null;
}

function NaoEncontrada() {
  return (
    <main className="nao-encontrada" id="conteudo">
      <h1>Página não encontrada</h1>
      <p>O endereço acessado não existe ou foi alterado.</p>
      <Link className="btn btn--primario" to="/portal">Ir para o portal</Link>
    </main>
  );
}

function Rotas() {
  const { path, navigate } = useRouter();
  const limpo = path.replace(/\/+$/, '') || '/';

  useEffect(() => {
    if (limpo === '/organizador') navigate('/organizador/visao-geral');
  }, [limpo]);

  if (limpo === '/') return <ApresentacaoProjeto />;
  if (limpo === '/organizador/login') return <Login />;

  const portal = encontrar(ROTAS_PORTAL, limpo);
  if (portal) {
    document.title = `${portal.rota.titulo} • São Vicente em Rede`;
    return <PortalLayout>{portal.rota.el(portal.params)}</PortalLayout>;
  }
  const org = encontrar(ROTAS_ORG, limpo);
  if (org) {
    document.title = `${org.rota.titulo} • Organizador • São Vicente em Rede`;
    return <OrganizadorLayout titulo={org.rota.titulo}>{org.rota.el(org.params)}</OrganizadorLayout>;
  }
  if (limpo === '/organizador') return null;
  return <NaoEncontrada />;
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <Rotas />
        <Avisos />
      </AuthProvider>
    </RouterProvider>
  );
}
