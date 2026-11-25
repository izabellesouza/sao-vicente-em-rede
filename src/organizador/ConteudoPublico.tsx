// Conteúdo público: revisão final e liberação da campanha para o portal.
import { SEM_ID } from '../lib/backend';
import { useState } from 'react';
import { Link } from '../lib/router';
import { Icone } from '../lib/icons';
import { pode, useAuth } from '../lib/auth';
import { atualizar } from '../lib/backend';
import { Selo, Vazio, avisar } from '../lib/ui';
import { ROTULO_SITUACAO, registrar, situacaoPublica, useTabela } from '../lib/dados';
import { dataHora, periodo } from '../lib/format';
import type { Campanha, CampanhaApoio, Material } from '../lib/types';
import { TituloPagina, usePerfis } from './OrganizadorLayout';

export default function ConteudoPublico() {
  const { perfil } = useAuth();
  const { nome } = usePerfis();
  const { dados: campanhas } = useTabela<Campanha>('campanhas');
  const ordenadas = [...campanhas].sort((a, b) => a.inicio.localeCompare(b.inicio));
  const sugerida = ordenadas.find((c) => !c.publicado && situacaoPublica(c) !== 'encerrada') || ordenadas.find((c) => situacaoPublica(c) === 'em_andamento') || ordenadas[0];
  const [escolhida, setEscolhida] = useState(new URLSearchParams(window.location.search).get('c') || '');
  const c = campanhas.find((x) => x.id === escolhida) || sugerida;

  const { dados: materiais } = useTabela<Material>('materiais', c ? { campanha_id: c.id } : { id: SEM_ID });
  const { dados: apoios } = useTabela<CampanhaApoio>('campanha_apoio', { campanha_id: c ? c.id : SEM_ID });
  const [ocupado, setOcupado] = useState(false);

  if (!c) return <><TituloPagina titulo="Conteúdo público" /><div className="painel"><Vazio titulo="Nenhuma campanha cadastrada" icone="megaphone" /></div></>;

  const aprovados = materiais.filter((m) => m.status === 'aprovado');
  const pendentes = materiais.filter((m) => m.status === 'aguardando_aprovacao' || m.status === 'ajuste_solicitado');
  const checklist = [
    { r: 'Título', v: c.titulo, ok: !!c.titulo },
    { r: 'Chamada', v: c.resumo, ok: !!c.resumo },
    { r: 'Período', v: periodo(c.inicio, c.fim), ok: !!c.inicio && !!c.fim },
    { r: 'Objetivo', v: c.objetivo, ok: !!c.objetivo },
    { r: 'Participação', v: c.participacao.map((p) => p.titulo).join(', ') || 'Não informada', ok: c.participacao.length > 0 },
    { r: 'Canais oficiais de apoio', v: apoios.length ? `${apoios.length} canal(is) vinculado(s)` : 'Nenhum canal vinculado', ok: apoios.length > 0 },
    { r: 'Materiais aprovados', v: `${aprovados.length} aprovado(s)${pendentes.length ? ` • ${pendentes.length} em revisão` : ''}`, ok: true, opcional: true },
  ];
  const completo = checklist.every((i) => i.ok);
  const etapa = c.publicado ? 3 : pendentes.length || !completo ? 1 : 2;

  async function liberar(publicar: boolean) {
    if (publicar && !confirm(`Liberar “${c!.titulo}” para o portal público? A página ficará visível para toda a comunidade.`)) return;
    if (!publicar && !confirm(`Retirar “${c!.titulo}” do portal público?`)) return;
    setOcupado(true);
    try {
      await atualizar<Campanha>('campanhas', c!.id, publicar ? { publicado: true, publicado_em: new Date().toISOString(), publicado_por: perfil!.id } : { publicado: false });
      await registrar(perfil!.id, publicar ? 'liberou a campanha para o portal' : 'retirou a campanha do portal', c!.titulo, c!.id);
      avisar(publicar ? 'Campanha publicada no portal!' : 'Campanha retirada do portal.');
    } catch (e: any) {
      avisar(e.message, 'erro');
    } finally {
      setOcupado(false);
    }
  }

  const palavras = c.titulo.split(' ');
  const ultima = palavras.length > 1 ? palavras.pop() : '';

  return (
    <>
      <TituloPagina titulo="Conteúdo público" texto="Revise apenas informações aprovadas antes de liberar para o portal.">
        <select className="entrada entrada--auto" value={c.id} onChange={(e) => setEscolhida(e.target.value)} aria-label="Campanha">
          {ordenadas.map((x) => <option key={x.id} value={x.id}>{x.titulo}{x.publicado ? ' (publicada)' : ''}</option>)}
        </select>
        <Selo cor={c.publicado ? 'verde' : 'amarelo'}>{c.publicado ? 'Publicada' : 'Aguardando liberação'}</Selo>
      </TituloPagina>

      <ol className="etapas-publicacao">
        <li className={etapa >= 1 ? 'feito' : ''}><span className="marinho"><Icone nome="tasks" /></span> Organizador interno</li>
        <li aria-hidden="true"><Icone nome="arrow-right" /></li>
        <li className={etapa >= 2 ? 'feito' : ''}><span className="amarelo"><Icone nome="clock" /></span> Em aprovação</li>
        <li aria-hidden="true"><Icone nome="arrow-right" /></li>
        <li className={etapa >= 3 ? 'feito' : ''}><span className="turquesa"><Icone nome="globe" /></span> Portal público</li>
      </ol>

      <div className="publicacao">
        <div className="painel painel--cinza">
          <div className="navegador" aria-label="Prévia da página no portal">
            <div className="navegador__barra"><i /><i /><i /><span>{window.location.host}/portal/campanhas/{c.slug}</span></div>
            <div className="navegador__topo"><span className="logo logo--mini"><span className="logo__selo"><Icone nome="heart" tamanho={12} /></span><span className="logo__texto">São Vicente <em>em Rede</em></span></span><small>Início • Campanhas • Como apoiar</small></div>
            <div className="navegador__hero" style={{ ['--cor' as any]: c.cor }}>
              <div>
                <Selo cor={{ em_andamento: 'verde', planejada: 'amarelo', encerrada: 'cinza' }[situacaoPublica(c)]}>{ROTULO_SITUACAO[situacaoPublica(c)]}</Selo>
                <small>{c.tipo}</small>
                <strong>{palavras.join(' ')} {ultima && <span>{ultima}</span>}</strong>
                <p>{c.resumo}</p>
                <i className="navegador__botao">Quero participar</i>
              </div>
              <span className="navegador__circulo">{c.titulo.split(' ').map((w, i) => <b key={i}>{w}</b>)}</span>
            </div>
          </div>
          {c.publicado ? (
            <Link to={`/portal/campanhas/${c.slug}`} className="link-seta centro-link"><Icone nome="eye" /> Ver página publicada</Link>
          ) : (
            <p className="centro-link texto-suave"><Icone nome="eye-off" tamanho={16} /> Prévia — ainda não visível para a comunidade</p>
          )}
        </div>

        <div className="painel">
          <div className="painel__topo">
            <h2 className="painel__titulo">Informações aprovadas</h2>
            <Link to={`/organizador/campanhas/${c.id}`} className="link-seta"><Icone nome="pencil" tamanho={16} /> Revisar</Link>
          </div>
          <ul className="checklist">
            {checklist.map((i) => (
              <li key={i.r}>
                <span><small>{i.r}</small><b>{i.v || '—'}</b></span>
                <Icone nome={i.ok ? 'check' : 'alert'} className={i.ok ? 'ok' : 'falta'} />
                <span className="visualmente-oculto">{i.ok ? 'ok' : 'pendente'}</span>
              </li>
            ))}
          </ul>
          <p className="faixa-info"><Icone nome="lock" tamanho={16} /> Somente conteúdo aprovado pode ser publicado. A liberação fica registrada no histórico.</p>
          {c.publicado ? (
            <>
              <p className="texto-suave">Publicada em {dataHora(c.publicado_em)} por {nome(c.publicado_por).split(' ')[0]}.</p>
              {pode.publicar(perfil) && <button type="button" className="btn btn--perigo btn--bloco" onClick={() => liberar(false)} disabled={ocupado}><Icone nome="eye-off" /> Retirar do portal</button>}
            </>
          ) : pode.publicar(perfil) ? (
            <>
              {!completo && <p className="erro-form">Complete os itens marcados antes de liberar.</p>}
              <button type="button" className="btn btn--primario btn--bloco btn--grande" onClick={() => liberar(true)} disabled={!completo || ocupado}>Liberar para publicação <Icone nome="globe" /></button>
            </>
          ) : (
            <p className="faixa-info"><Icone nome="clock" tamanho={16} /> A liberação é feita pela coordenação da campanha.</p>
          )}
        </div>
      </div>
    </>
  );
}
