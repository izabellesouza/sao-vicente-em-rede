// Página inicial do portal público.
import { Link } from '../lib/router';
import { Icone } from '../lib/icons';
import { Carregando, Vazio } from '../lib/ui';
import { ordenarPorData, situacaoPublica, useConfig, useTabela } from '../lib/dados';
import { MESES, hojeISO, partes, periodo } from '../lib/format';
import type { Campanha } from '../lib/types';
import { CartaoCampanha, FotoEquipe, SeloSituacao } from './componentes';

export default function Inicio() {
  const cfg = useConfig();
  const { dados, carregando } = useTabela<Campanha>('campanhas', { publicado: true });
  const campanhas = [...dados].sort(ordenarPorData);
  const hoje = hojeISO();

  const destaque =
    campanhas.find((c) => situacaoPublica(c) === 'em_andamento') ||
    campanhas.find((c) => situacaoPublica(c) === 'planejada') ||
    campanhas[campanhas.length - 1];

  const futuras = campanhas.filter((c) => c.fim >= hoje);
  const passadas = campanhas.filter((c) => c.fim < hoje).reverse();
  const proximas = [...passadas.slice(0, Math.max(0, 3 - futuras.length)).reverse(), ...futuras].slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="container hero__grade">
          <div className="hero__texto">
            <span className="pilula"><span className="ponto" /> Solidariedade que transforma</span>
            <h1>Juntos, podemos ampliar o alcance de cada campanha.</h1>
            <p>
              O {cfg.instituicao} mobiliza pessoas em ações de saúde, acolhimento e solidariedade. Informação segura e participação oficial,
              agora em um só lugar.
            </p>
            <div className="hero__acoes">
              <Link to="/portal/campanhas" className="btn btn--primario">Ver campanhas <Icone nome="arrow-right" /></Link>
              <Link to="/portal/como-apoiar" className="btn btn--texto">Como apoiar</Link>
            </div>
            <ul className="hero__garantias">
              <li><Icone nome="check" tamanho={16} /> Canais oficiais</li>
              <li><Icone nome="heart" tamanho={16} /> Ações humanizadas</li>
            </ul>
          </div>
          <div className="hero__visual">
            <FotoEquipe className="hero__foto" />
            <div className="cartao-flutuante hero__cartao">
              <span className="cartao-flutuante__icone amarelo"><Icone nome="users" /></span>
              <div>
                <strong>Uma rede de cuidado</strong>
                <small>{cfg.cidade.replace(' • ', ', ')}</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {carregando ? (
        <Carregando />
      ) : destaque ? (
        <section className="secao">
          <div className="container destaque">
            <div className="destaque__arte" style={{ ['--cor' as any]: destaque.cor }}>
              <span className="destaque__fita">{MESES[partes(destaque.inicio).mes]}</span>
              <span className="destaque__barras" aria-hidden="true"><i /><i /><i /></span>
              <p className="destaque__rotulo">Campanha em destaque</p>
              <p className="destaque__nome">{destaque.titulo}</p>
              <p className="destaque__chamada">{destaque.resumo}</p>
            </div>
            <div className="destaque__texto">
              <SeloSituacao campanha={destaque} />
              <h2>{destaque.resumo}</h2>
              <p>{resumir(destaque.descricao)}</p>
              <ul className="lista-icones">
                <li><Icone nome="calendar" /> {periodo(destaque.inicio, destaque.fim)}</li>
                {destaque.programacao.slice(0, 2).length > 0 && (
                  <li><Icone nome="megaphone" /> {destaque.programacao.filter((p) => p.data).map((p) => p.titulo.split(':')[0]).join(' e ') || destaque.programacao[0].titulo}</li>
                )}
                <li><Icone nome="users" /> {destaque.publico}</li>
              </ul>
              <Link to={`/portal/campanhas/${destaque.slug}`} className="btn btn--contorno">Conhecer a campanha <Icone nome="arrow-right" /></Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="secao secao--suave">
        <div className="container">
          <div className="secao__topo">
            <div>
              <p className="etiqueta">Fique por dentro</p>
              <h2 className="titulo-secao">Próximas campanhas</h2>
            </div>
            <Link to="/portal/calendario" className="link-seta">Ver calendário completo <Icone nome="arrow-right" /></Link>
          </div>
          {proximas.length ? (
            <div className="grade-cartoes">{proximas.map((c) => <CartaoCampanha key={c.id} campanha={c} />)}</div>
          ) : (
            !carregando && <Vazio titulo="Nenhuma campanha publicada ainda" texto="Em breve, novas ações serão divulgadas aqui." />
          )}
        </div>
      </section>

      <BlocoParticipar />
    </>
  );
}

export function BlocoParticipar() {
  const cfg = useConfig();
  return (
    <section className="secao">
      <div className="container">
        <div className="centro">
          <p className="etiqueta">Faça parte</p>
          <h2 className="titulo-secao">Como você pode participar</h2>
          <p className="subtitulo">Toda forma de apoio fortalece nossa rede e ajuda a informação a chegar mais longe.</p>
        </div>
        <div className="grade-cartoes grade-cartoes--centro">
          {[
            { i: 'megaphone', t: 'Divulgue', d: 'Compartilhe campanhas e informações oficiais com sua rede.' },
            { i: 'users', t: 'Participe', d: 'Esteja presente em caminhadas, palestras e eventos.' },
            { i: 'heart', t: 'Apoie', d: 'Adquira camisas e contribua pelos canais institucionais.' },
          ].map((x) => (
            <div key={x.t} className="cartao-simples">
              <span className="circulo-icone"><Icone nome={x.i} tamanho={22} /></span>
              <h3>{x.t}</h3>
              <p>{x.d}</p>
            </div>
          ))}
        </div>
        <div className="faixa-seguranca">
          <span className="faixa-seguranca__icone"><Icone nome="lock" /></span>
          <div>
            <strong>Seu apoio, com segurança e transparência</strong>
            <p>Use sempre os canais oficiais validados pelo {cfg.instituicao}. Esta plataforma não processa pagamentos.</p>
          </div>
          <Link to="/portal/como-apoiar" className="btn btn--contorno">Ver canais oficiais <Icone nome="arrow-right" /></Link>
        </div>
      </div>
    </section>
  );
}

/** Primeiras duas frases de um texto. */
function resumir(texto: string) {
  const frases = texto.split(/(?<=\.)\s+/);
  return frases.slice(0, 2).join(' ');
}
