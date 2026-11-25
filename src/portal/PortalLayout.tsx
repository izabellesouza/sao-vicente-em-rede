// Estrutura do portal público: faixa superior, cabeçalho, conteúdo e rodapé.
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useRouter } from '../lib/router';
import { Icone, Logo } from '../lib/icons';
import { useConfig } from '../lib/dados';
import { MODO } from '../lib/backend';

const MENU = [
  { to: '/portal', rotulo: 'Início' },
  { to: '/portal/campanhas', rotulo: 'Campanhas' },
  { to: '/portal/calendario', rotulo: 'Calendário' },
  { to: '/portal/como-apoiar', rotulo: 'Como apoiar' },
  { to: '/portal/contato', rotulo: 'Contato' },
];

export default function PortalLayout({ children }: { children: ReactNode }) {
  const { path } = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);
  const cfg = useConfig();

  useEffect(() => setMenuAberto(false), [path]);

  const ativo = (to: string) => (to === '/portal' ? path === '/portal' : path.startsWith(to));

  return (
    <div className="portal">
      <a className="pular-link" href="#conteudo">Pular para o conteúdo</a>
      <div className="faixa-topo">
        <div className="container faixa-topo__in">
          <span>Portal público • Desenvolvido por Iza</span>
          <Link to="/">Conheça o projeto <Icone nome="arrow-right" tamanho={14} /></Link>
        </div>
      </div>

      <header className="cabecalho">
        <div className="container cabecalho__in">
          <Link to="/portal" aria-label="São Vicente em Rede — página inicial">
            <Logo />
          </Link>
          <nav className={`menu ${menuAberto ? 'menu--aberto' : ''}`} aria-label="Navegação principal" id="menu-portal">
            {MENU.map((m) => (
              <Link key={m.to} to={m.to} className={ativo(m.to) ? 'ativo' : ''} aria-current={ativo(m.to) ? 'page' : undefined}>
                {m.rotulo}
              </Link>
            ))}
            <Link to="/portal/campanhas" className="btn btn--primario menu__cta-movel">Conheça as campanhas</Link>
          </nav>
          <Link to="/portal/campanhas" className="btn btn--primario cabecalho__cta">Conheça as campanhas</Link>
          <button type="button" className="btn-icone cabecalho__menu" aria-expanded={menuAberto} aria-controls="menu-portal" onClick={() => setMenuAberto(!menuAberto)}>
            <Icone nome={menuAberto ? 'x' : 'menu'} tamanho={22} />
            <span className="visualmente-oculto">{menuAberto ? 'Fechar menu' : 'Abrir menu'}</span>
          </button>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1}>{children}</main>

      <footer className="rodape">
        <div className="container rodape__grade">
          <div>
            <Logo claro compacto />
            <p className="rodape__frase">Solidariedade, informação e cuidado conectando pessoas.</p>
          </div>
          <nav aria-label="Rodapé">
            <h2>Navegue</h2>
            <Link to="/portal/campanhas">Campanhas</Link>
            <Link to="/portal/calendario">Calendário</Link>
            <Link to="/portal/como-apoiar">Como apoiar</Link>
            <Link to="/portal/contato">Contato</Link>
          </nav>
          <div>
            <h2>Contato</h2>
            {cfg.telefone && <a href={`tel:${cfg.telefone.replace(/\D/g, '')}`}>{cfg.telefone}</a>}
            {cfg.email && <a href={`mailto:${cfg.email}`}>{cfg.email}</a>}
            <div className="rodape__redes">
              {cfg.instagram && <a href={cfg.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram oficial"><Icone nome="instagram" tamanho={16} /></a>}
              {cfg.facebook && <a href={cfg.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook oficial"><Icone nome="facebook" tamanho={16} /></a>}
              {cfg.whatsapp && <a href={`https://wa.me/${cfg.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp oficial"><Icone nome="message" tamanho={16} /></a>}
            </div>
          </div>
          <div>
            <h2>Uma iniciativa vinculada ao</h2>
            <p className="rodape__hospital">{cfg.instituicao}</p>
            <p className="rodape__cidade">{cfg.cidade}</p>
          </div>
        </div>
        <div className="container rodape__base">
          <span>© {new Date().getFullYear()} {cfg.instituicao}. Projeto extensionista São Vicente em Rede.</span>
          <span>{MODO === 'demo' ? 'Versão de demonstração com dados fictícios.' : 'Esta plataforma não processa pagamentos.'}</span>
        </div>
      </footer>
    </div>
  );
}
