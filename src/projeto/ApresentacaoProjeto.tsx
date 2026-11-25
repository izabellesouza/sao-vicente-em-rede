// Página de apresentação do projeto (primeira tela do protótipo).
import { Link } from '../lib/router';
import { Icone, Logo } from '../lib/icons';
import { useConfig } from '../lib/dados';
import { FotoEquipe } from '../portal/componentes';

export default function ApresentacaoProjeto() {
  const cfg = useConfig();
  document.title = 'São Vicente em Rede';
  return (
    <div className="projeto">
      <header className="container projeto__topo">
        <Logo />
        <span className="projeto__selo">Projeto extensionista</span>
      </header>
      <main id="conteudo">
        <section className="container projeto__hero">
          <div>
            <span className="pilula"><Icone nome="sparkles" tamanho={14} /> Tecnologia que conecta e acolhe</span>
            <h1>Campanhas solidárias mais organizadas. Comunidade mais próxima.</h1>
            <p>
              São Vicente em Rede é uma solução digital criada para organizar as campanhas solidárias do {cfg.instituicao} e facilitar o
              acesso da comunidade às informações e formas oficiais de participação.
            </p>
            <div className="hero__acoes">
              <Link to="/portal" className="btn btn--primario">Explorar portal público <Icone nome="arrow-right" /></Link>
              <Link to="/organizador/login" className="btn btn--contorno">Acessar organizador <Icone nome="lock" /></Link>
            </div>
            <div className="projeto__vinculo">
              <span>Uma iniciativa vinculada ao</span>
              <div>
                <strong>{cfg.instituicao}</strong>
                <small>{cfg.cidade}</small>
              </div>
            </div>
          </div>
          <div className="projeto__visual">
            <FotoEquipe className="projeto__foto" />
            <div className="cartao-flutuante projeto__c1">
              <span className="cartao-flutuante__icone verde"><Icone nome="check" /></span>
              <div><strong>Conteúdo aprovado</strong><small>Pronto para publicar</small></div>
            </div>
            <div className="cartao-flutuante projeto__c2">
              <span className="cartao-flutuante__icone amarelo"><Icone nome="users" /></span>
              <div><strong>Comunidade conectada</strong><small>Participação segura</small></div>
            </div>
            <div className="cartao-flutuante projeto__c3"><span className="ponto" /> Campanhas que mobilizam pessoas</div>
          </div>
        </section>

        <section className="projeto__fluxo">
          <div className="container">
            <p className="etiqueta etiqueta--amarela">Duas áreas, uma só rede</p>
            <h2>Da ideia ao impacto na comunidade</h2>
            <p className="projeto__fluxo-sub">Planejamento, produção, aprovação e divulgação em um fluxo simples e transparente.</p>
            <ol className="fluxo">
              <li>
                <Link to="/organizador/login" className="fluxo__cartao">
                  <span className="fluxo__num">01</span>
                  <span className="fluxo__icone marinho"><Icone nome="tasks" /></span>
                  <span><strong>Organizador interno</strong><small>Planejamento e produção</small></span>
                  <span className="fluxo__autor">Thiago</span>
                </Link>
              </li>
              <li aria-hidden="true" className="fluxo__seta"><Icone nome="arrow-right" /></li>
              <li>
                <div className="fluxo__cartao">
                  <span className="fluxo__num">02</span>
                  <span className="fluxo__icone coral"><Icone nome="approve" /></span>
                  <span><strong>Conteúdo aprovado</strong><small>Curadoria e segurança</small></span>
                  <span className="fluxo__autor">Integração</span>
                </div>
              </li>
              <li aria-hidden="true" className="fluxo__seta"><Icone nome="arrow-right" /></li>
              <li>
                <Link to="/portal" className="fluxo__cartao">
                  <span className="fluxo__num">03</span>
                  <span className="fluxo__icone petroleo"><Icone nome="globe" /></span>
                  <span><strong>Portal público</strong><small>Informação e participação</small></span>
                  <span className="fluxo__autor">Iza</span>
                </Link>
              </li>
            </ol>
            <p className="projeto__creditos">Projeto extensionista • Anne Izabelle Pereira de Souza e Thiago Fernandes Alves Pinto • PUCPR</p>
          </div>
        </section>
      </main>
    </div>
  );
}
