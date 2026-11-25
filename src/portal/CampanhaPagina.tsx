// Página de uma campanha no portal público.
import { useState } from 'react';
import { Link } from '../lib/router';
import { Icone } from '../lib/icons';
import { Carregando, Modal, PreviaMaterial, Selo, Vazio, avisar } from '../lib/ui';
import { linkWhatsApp, useConfig, useTabela } from '../lib/dados';
import { dataHora, dia2, doisDigitos, mesCurto, periodo } from '../lib/format';
import type { Campanha, CampanhaApoio, FormaApoio, Material } from '../lib/types';
import { SeloSituacao } from './componentes';

export default function CampanhaPagina({ slug }: { slug: string }) {
  const cfg = useConfig();
  const { dados, carregando } = useTabela<Campanha>('campanhas', { slug, publicado: true });
  const campanha = dados[0];

  if (carregando) return <Carregando />;
  if (!campanha)
    return (
      <section className="secao">
        <div className="container">
          <Vazio titulo="Campanha não encontrada" texto="Ela pode ainda não ter sido publicada ou o endereço mudou." icone="search">
            <Link to="/portal/campanhas" className="btn btn--primario">Ver campanhas</Link>
          </Vazio>
        </div>
      </section>
    );

  document.title = `${campanha.titulo} • São Vicente em Rede`;
  const palavras = campanha.titulo.split(' ');
  const ultima = palavras.length > 1 ? palavras.pop() : '';

  return (
    <>
      <section className="campanha-hero" style={{ ['--cor' as any]: campanha.cor }}>
        <div className="container campanha-hero__grade">
          <div>
            <SeloSituacao campanha={campanha} />
            <p className="campanha-hero__tipo">{campanha.tipo}</p>
            <h1>
              {palavras.join(' ')} {ultima && <span>{ultima}</span>}
            </h1>
            <p className="campanha-hero__chamada">{campanha.resumo}</p>
            <ul className="campanha-hero__info">
              <li><Icone nome="calendar" /> {periodo(campanha.inicio, campanha.fim)}</li>
              <li><Icone nome="map" /> {campanha.local}</li>
            </ul>
          </div>
          <div className="campanha-hero__circulo" aria-hidden="true">
            <Icone nome="heart" tamanho={64} />
            <strong>{campanha.tipo.replace(/^Campanha de /i, '')}</strong>
            <small>Informação que cuida</small>
          </div>
        </div>
      </section>

      <section className="secao">
        <div className="container campanha-grade">
          <div className="campanha-conteudo">
            <p className="etiqueta">Sobre a campanha</p>
            <h2 className="titulo-secao titulo-secao--medio">Informação e acolhimento para transformar cuidado em rotina.</h2>
            <p className="texto-corrido">{campanha.descricao}</p>

            <div className="caixa-objetivo">
              <span className="caixa-objetivo__icone"><Icone nome="megaphone" /></span>
              <div>
                <h3>Nosso objetivo</h3>
                <p>{campanha.objetivo}</p>
              </div>
            </div>

            {campanha.programacao.length > 0 && (
              <>
                <h3 className="subtitulo-bloco">Programação</h3>
                <ul className="programacao">
                  {campanha.programacao.map((p, i) => (
                    <li key={i}>
                      <span className="programacao__data">
                        {p.data ? <>{dia2(p.data)}<small>{mesCurto(p.data)}</small></> : <>TODO<small>MÊS</small></>}
                      </span>
                      <div>
                        <strong>{p.titulo}</strong>
                        <span>{[p.local, p.horario].filter(Boolean).join(' • ')}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <MateriaisPublicos campanha={campanha} />
          </div>

          <aside>
            <Participar campanha={campanha} whatsapp={cfg.whatsapp} />
          </aside>
        </div>
      </section>
    </>
  );
}

function Participar({ campanha, whatsapp }: { campanha: Campanha; whatsapp: string }) {
  const [opcao, setOpcao] = useState(0);
  const [verApoio, setVerApoio] = useState(false);
  const url = window.location.href;
  const escolhida = campanha.participacao[opcao];

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      avisar('Link copiado!');
    } catch {
      avisar('Não foi possível copiar. Copie o endereço da barra do navegador.', 'erro');
    }
  };

  return (
    <div className="cartao-participar">
      <span className="pilula pilula--pequena">Participe com a gente</span>
      <h2>Escolha como fazer parte</h2>
      {campanha.participacao.length > 0 ? (
        <fieldset className="opcoes">
          <legend className="visualmente-oculto">Formas de participação</legend>
          {campanha.participacao.map((o, i) => (
            <label key={i} className="opcao">
              <input type="radio" name="participacao" checked={opcao === i} onChange={() => setOpcao(i)} />
              <span>
                <strong>{o.titulo}</strong>
                <small>{o.detalhe}</small>
              </span>
            </label>
          ))}
        </fieldset>
      ) : (
        <p className="texto-suave">Fale com a equipe pelos canais oficiais para saber como participar.</p>
      )}
      {whatsapp ? (
        <a
          className="btn btn--primario btn--bloco"
          href={linkWhatsApp(whatsapp, `Olá! Vi no portal São Vicente em Rede e quero participar da campanha ${campanha.titulo}${escolhida ? `: ${escolhida.titulo}` : ''}.`)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Quero participar <Icone nome="arrow-right" />
          <span className="visualmente-oculto">(abre o WhatsApp oficial em nova aba)</span>
        </a>
      ) : (
        <Link to="/portal/contato" className="btn btn--primario btn--bloco">Quero participar <Icone nome="arrow-right" /></Link>
      )}
      <button type="button" className="btn btn--contorno btn--bloco" onClick={() => setVerApoio(true)}>Formas oficiais de apoio</button>
      <p className="nota-seguranca"><Icone nome="lock" tamanho={14} /> Nenhum pagamento é realizado nesta plataforma.</p>
      <div className="compartilhar">
        <span>Compartilhe esta campanha</span>
        <div>
          <button type="button" className="btn-quadrado" onClick={copiar} aria-label="Copiar link da campanha"><Icone nome="link" /></button>
          <a className="btn-quadrado" href={`https://wa.me/?text=${encodeURIComponent(`${campanha.titulo} — ${campanha.resumo} ${url}`)}`} target="_blank" rel="noopener noreferrer" aria-label="Compartilhar no WhatsApp"><Icone nome="message" /></a>
          <a className="btn-quadrado" href={`mailto:?subject=${encodeURIComponent(campanha.titulo)}&body=${encodeURIComponent(`${campanha.resumo}\n\n${url}`)}`} aria-label="Compartilhar por e-mail"><Icone nome="mail" /></a>
        </div>
      </div>
      <FormasApoioModal campanha={campanha} aberto={verApoio} aoFechar={() => setVerApoio(false)} />
    </div>
  );
}

const ICONE_APOIO: Record<string, string> = { whatsapp: 'message', instagram: 'instagram', doacao: 'heart', telefone: 'phone', email: 'mail', outro: 'link' };

function FormasApoioModal({ campanha, aberto, aoFechar }: { campanha: Campanha; aberto: boolean; aoFechar: () => void }) {
  const { dados: vinculos } = useTabela<CampanhaApoio>('campanha_apoio', { campanha_id: campanha.id });
  const { dados: formas } = useTabela<FormaApoio>('formas_apoio', { ativo: true });
  const ids = new Set(vinculos.map((v) => v.apoio_id));
  const lista = formas.filter((f) => ids.has(f.id));
  return (
    <Modal titulo="Formas oficiais de apoio" aberto={aberto} aoFechar={aoFechar}>
      <p className="texto-suave" style={{ marginBottom: 16 }}>Canais validados pelo hospital para a campanha {campanha.titulo}.</p>
      {lista.length ? <ListaApoio formas={lista} /> : <p>Fale com a equipe pelo contato institucional.</p>}
    </Modal>
  );
}

export function ListaApoio({ formas }: { formas: FormaApoio[] }) {
  return (
    <ul className="lista-apoio">
      {formas.map((f) => (
        <li key={f.id}>
          <span className="circulo-icone circulo-icone--pequeno"><Icone nome={ICONE_APOIO[f.tipo] || 'link'} /></span>
          <div>
            <strong>{f.titulo}</strong>
            <small>{f.descricao}</small>
          </div>
          {f.link && (
            <a className="btn btn--contorno btn--pequeno" href={f.link} target={f.link.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
              Acessar <Icone nome="external" tamanho={14} />
              <span className="visualmente-oculto">{f.titulo}</span>
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

function MateriaisPublicos({ campanha }: { campanha: Campanha }) {
  const { dados } = useTabela<Material>('materiais', { campanha_id: campanha.id, status: 'aprovado', publico: true });
  const [aberto, setAberto] = useState<Material | null>(null);
  if (!dados.length) return null;
  return (
    <>
      <h3 className="subtitulo-bloco">Atualizações e materiais divulgados</h3>
      <ul className="materiais-publicos">
        {dados.map((m) => (
          <li key={m.id} className="material-publico">
            <div className="material-publico__mini"><PreviaMaterial titulo={campanha.titulo} cor={campanha.cor} url={m.arquivo_url} /></div>
            <div>
              <Selo cor="azul">Material aprovado</Selo>
              <strong>{m.titulo}</strong>
              <small>Publicado em {dataHora(m.atualizado_em).split(',')[0]} • Versão {doisDigitos(m.versao)}</small>
              <button type="button" className="link-seta" onClick={() => setAberto(m)}>
                Visualizar material <Icone nome="eye" tamanho={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <Modal titulo={aberto?.titulo || ''} aberto={!!aberto} aoFechar={() => setAberto(null)} largura={640}>
        {aberto && (
          <div className="material-ampliado">
            <div className="material-ampliado__arte"><PreviaMaterial titulo={campanha.titulo} cor={campanha.cor} url={aberto.arquivo_url} /></div>
            {aberto.legenda && <p>{aberto.legenda}</p>}
            {aberto.arquivo_url && <a className="link-seta" href={aberto.arquivo_url} target="_blank" rel="noopener noreferrer" download>Baixar arquivo <Icone nome="external" tamanho={16} /></a>}
          </div>
        )}
      </Modal>
    </>
  );
}
