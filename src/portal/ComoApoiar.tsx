// Como apoiar: formas de participação e canais oficiais validados.
import { Icone } from '../lib/icons';
import { linkWhatsApp, useConfig, useTabela } from '../lib/dados';
import type { FormaApoio } from '../lib/types';
import { CabecalhoPagina } from './componentes';
import { ListaApoio } from './CampanhaPagina';

export default function ComoApoiar() {
  const cfg = useConfig();
  const { dados: formas } = useTabela<FormaApoio>('formas_apoio', { ativo: true });

  const cards = [
    { i: 'megaphone', t: 'Divulgue as campanhas', d: 'Compartilhe nossos conteúdos oficiais e ajude informação de qualidade a chegar mais longe.' },
    { i: 'users', t: 'Participe dos eventos', d: 'Caminhadas, palestras e encontros ficam ainda mais especiais com a sua presença.' },
    { i: 'heart', t: 'Adquira produtos solidários', d: 'Camisas e materiais de campanha ajudam a dar visibilidade e apoiar as ações.' },
    { i: 'link', t: 'Contribua por canais oficiais', d: 'Fale diretamente com nossa equipe para conhecer as formas institucionais de contribuição.' },
  ];

  return (
    <>
      <CabecalhoPagina etiqueta="Como apoiar" titulo="Seu gesto fortalece toda a rede." texto={`Existem muitas formas de caminhar com o ${cfg.instituicao} e ampliar o impacto das nossas ações.`} />
      <section className="secao">
        <div className="container">
          <div className="grade-dupla">
            {cards.map((c) => (
              <div key={c.t} className="cartao-linha">
                <span className="circulo-icone circulo-icone--quadrado"><Icone nome={c.i} /></span>
                <div>
                  <h2>{c.t}</h2>
                  <p>{c.d}</p>
                </div>
              </div>
            ))}
          </div>

          {formas.length > 0 && (
            <div className="bloco-canais">
              <h2 className="subtitulo-bloco">Canais oficiais</h2>
              <ListaApoio formas={formas} />
            </div>
          )}

          <div className="faixa-seguranca faixa-seguranca--alta">
            <span className="faixa-seguranca__icone"><Icone nome="check" /></span>
            <div>
              <strong>Canais validados pelo {cfg.instituicao}</strong>
              <p>Para sua segurança, confirme sempre se o canal de atendimento é institucional. Não solicitamos dados bancários e não processamos pagamentos neste portal.</p>
              <p className="faixa-seguranca__contatos">
                {cfg.telefone && <a href={`tel:${cfg.telefone.replace(/\D/g, '')}`}><Icone nome="phone" tamanho={16} /> {cfg.telefone}</a>}
                {cfg.email && <a href={`mailto:${cfg.email}`}><Icone nome="mail" tamanho={16} /> {cfg.email}</a>}
              </p>
            </div>
            {cfg.whatsapp && (
              <a className="btn btn--primario" href={linkWhatsApp(cfg.whatsapp, 'Olá! Quero saber como apoiar as campanhas do hospital.')} target="_blank" rel="noopener noreferrer">
                Falar pelo WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
