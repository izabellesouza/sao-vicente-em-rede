// Aprovação de material: prévia, briefing, histórico de versões e decisão.
import { SEM_ID } from '../lib/backend';
import { useState, type FormEvent } from 'react';
import { Link } from '../lib/router';
import { Icone } from '../lib/icons';
import { pode, useAuth } from '../lib/auth';
import { atualizar, enviarArquivo, inserir, remover } from '../lib/backend';
import { Carregando, PreviaMaterial, Selo, Vazio, avisar } from '../lib/ui';
import { ROTULO_MATERIAL, registrar, useTabela } from '../lib/dados';
import { dataHora, doisDigitos, tempoRelativo } from '../lib/format';
import type { Aprovacao, Campanha, Material, VersaoMaterial } from '../lib/types';
import { TituloPagina, usePerfis } from './OrganizadorLayout';

export default function AprovacaoDetalhe({ id }: { id: string }) {
  const { perfil } = useAuth();
  const { nome } = usePerfis();
  const { dados: ms, carregando } = useTabela<Material>('materiais', { id });
  const m = ms[0];
  const { dados: cs } = useTabela<Campanha>('campanhas', m ? { id: m.campanha_id } : { id: SEM_ID });
  const { dados: versoes } = useTabela<VersaoMaterial>('versoes_material', { material_id: id });
  const { dados: decisoes } = useTabela<Aprovacao>('aprovacoes', { material_id: id });
  const [comentario, setComentario] = useState('');
  const [zoom, setZoom] = useState(75);
  const [ocupado, setOcupado] = useState(false);

  if (carregando) return <Carregando />;
  if (!m) return <Vazio titulo="Material não encontrado" icone="search"><Link to="/organizador/materiais" className="btn btn--primario">Ver materiais</Link></Vazio>;

  const c = cs[0];
  const st = ROTULO_MATERIAL[m.status];
  const podeDecidir = pode.aprovar(perfil) && m.status === 'aguardando_aprovacao';
  const podeNovaVersao = pode.enviarMaterial(perfil) && m.status !== 'aprovado' && (perfil!.funcao !== 'producao' || m.autor_id === perfil!.id);
  const historico = [...versoes].sort((a, b) => b.versao - a.versao);
  const linhaTempo = [...decisoes].sort((a, b) => (b.criado_em || '').localeCompare(a.criado_em || ''));

  async function decidir(decisao: 'aprovado' | 'ajustes') {
    if (decisao === 'ajustes' && !comentario.trim()) return avisar('Escreva um comentário explicando o ajuste.', 'erro');
    setOcupado(true);
    try {
      await inserir<Aprovacao>('aprovacoes', { material_id: m.id, revisor_id: perfil!.id, decisao, comentario: comentario.trim() });
      await atualizar<Material>('materiais', m.id, { status: decisao === 'aprovado' ? 'aprovado' : 'ajuste_solicitado', atualizado_em: new Date().toISOString() });
      await registrar(perfil!.id, decisao === 'aprovado' ? 'aprovou um material' : 'solicitou ajustes em um material', `${m.titulo} • ${c?.titulo || ''}`, m.campanha_id);
      setComentario('');
      avisar(decisao === 'aprovado' ? 'Material aprovado.' : 'Ajustes solicitados à equipe.');
    } catch (e: any) {
      avisar(e.message, 'erro');
    } finally {
      setOcupado(false);
    }
  }

  async function alternarPublico() {
    try {
      await atualizar<Material>('materiais', m.id, { publico: !m.publico });
      avisar(!m.publico ? 'O material aparecerá no portal após aprovado.' : 'O material não aparecerá no portal.');
    } catch (e: any) {
      avisar(e.message, 'erro');
    }
  }

  async function enviarParaAprovacao() {
    try {
      await atualizar<Material>('materiais', m.id, { status: 'aguardando_aprovacao', atualizado_em: new Date().toISOString() });
      await registrar(perfil!.id, 'enviou um material para aprovação', `${m.titulo} • ${c?.titulo || ''}`, m.campanha_id);
      avisar('Enviado para aprovação.');
    } catch (e: any) {
      avisar(e.message, 'erro');
    }
  }

  async function excluir() {
    if (!confirm('Excluir este material e seu histórico?')) return;
    try {
      await remover('versoes_material', { material_id: m.id });
      await remover('aprovacoes', { material_id: m.id });
      await remover('materiais', { id: m.id });
      avisar('Material excluído.');
      history.back();
    } catch (e: any) {
      avisar(e.message, 'erro');
    }
  }

  return (
    <>
      <Link to="/organizador/aprovacoes" className="link-seta voltar"><Icone nome="arrow-left" tamanho={16} /> Aprovações</Link>
      <TituloPagina titulo="Aprovação de material" texto="Revise o arquivo, o briefing e o histórico antes de decidir." />
      <div className="aprovacao">
        <div className="aprovacao__palco">
          <div className="aprovacao__arte" style={{ width: `${zoom}%` }}>
            <PreviaMaterial titulo={c?.titulo || m.titulo} cor={c?.cor} url={m.arquivo_url} texto={!m.arquivo_url && m.tipo === 'Legenda' ? m.legenda : undefined} />
          </div>
          <div className="zoom" role="group" aria-label="Zoom da prévia">
            <button type="button" onClick={() => setZoom(Math.min(100, zoom + 10))} aria-label="Aumentar">+</button>
            <span>{zoom}%</span>
            <button type="button" onClick={() => setZoom(Math.max(40, zoom - 10))} aria-label="Diminuir">−</button>
          </div>
          {m.arquivo_url && <a className="link-seta aprovacao__abrir" href={m.arquivo_url} target="_blank" rel="noopener noreferrer">Abrir arquivo original <Icone nome="external" tamanho={14} /></a>}
        </div>

        <div className="aprovacao__lado">
          <Selo cor={st.classe}>{st.rotulo}</Selo>
          <h2>{m.titulo}</h2>
          <p className="meta">{m.arquivo_nome || m.tipo} • Versão {doisDigitos(m.versao)} • Enviado por {nome(m.autor_id).split(' ')[0]} • {dataHora(m.atualizado_em || m.criado_em)}</p>
          {c && <p className="meta">Campanha: <Link to={`/organizador/campanhas/${c.id}`}>{c.titulo}</Link></p>}

          <div className="caixa-briefing">
            <b>Briefing relacionado</b>
            <p>{m.briefing || 'Sem briefing informado.'}</p>
            <small>Formato: {m.formato || '—'}</small>
          </div>
          {m.legenda && m.tipo !== 'Legenda' && <div className="caixa-briefing caixa-briefing--branca"><b>Legenda</b><p>{m.legenda}</p></div>}

          {podeDecidir && (
            <label className="campo">
              <span>Comentário para a equipe</span>
              <textarea className="entrada entrada--baixa" value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Escreva uma orientação ou comentário…" />
            </label>
          )}

          <div>
            <b className="rotulo-bloco">Histórico de versões</b>
            <ul className="versoes">
              {historico.map((v) => (
                <li key={v.id}>
                  <span className="versoes__num">V{doisDigitos(v.versao)}</span>
                  <span><b>{v.nota || 'Nova versão'}</b><small>{nome(v.autor_id).split(' ')[0]} • {tempoRelativo(v.criado_em)}</small></span>
                  {v.versao === m.versao && <Selo cor="azul">Atual</Selo>}
                  {v.arquivo_url && v.versao !== m.versao && <a href={v.arquivo_url} target="_blank" rel="noopener noreferrer" className="link-seta link-seta--pequeno">Ver</a>}
                </li>
              ))}
            </ul>
          </div>

          {linhaTempo.length > 0 && (
            <div>
              <b className="rotulo-bloco">Decisões e comentários</b>
              <ul className="decisoes">
                {linhaTempo.map((d) => (
                  <li key={d.id}>
                    <Selo cor={d.decisao === 'aprovado' ? 'verde' : 'vermelho'}>{d.decisao === 'aprovado' ? 'Aprovado' : 'Ajustes'}</Selo>
                    <span><b>{nome(d.revisor_id).split(' ')[0]}</b> {d.comentario && `— “${d.comentario}”`}<small>{tempoRelativo(d.criado_em)}</small></span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {podeDecidir && (
            <div className="aprovacao__botoes">
              <button type="button" className="btn btn--coral" onClick={() => decidir('ajustes')} disabled={ocupado}>Solicitar ajustes</button>
              <button type="button" className="btn btn--verde" onClick={() => decidir('aprovado')} disabled={ocupado}><Icone nome="check" /> Aprovar material</button>
            </div>
          )}
          {!pode.aprovar(perfil) && m.status === 'aguardando_aprovacao' && <p className="faixa-info"><Icone nome="clock" tamanho={16} /> Aguardando a decisão da coordenação da campanha.</p>}

          {m.status === 'em_producao' && podeNovaVersao && (
            <button type="button" className="btn btn--primario" onClick={enviarParaAprovacao}><Icone nome="send" /> Enviar para aprovação</button>
          )}
          {podeNovaVersao && (m.status === 'ajuste_solicitado' || m.status === 'em_producao') && <NovaVersao material={m} campanhaTitulo={c?.titulo || ''} />}

          <div className="aprovacao__extras">
            {pode.publicar(perfil) && (
              <label className="checkbox"><input type="checkbox" checked={m.publico} onChange={alternarPublico} /> Exibir no portal quando aprovado</label>
            )}
            {pode.aprovar(perfil) && <button type="button" className="btn btn--perigo btn--pequeno" onClick={excluir}><Icone nome="trash" /> Excluir</button>}
          </div>
        </div>
      </div>
    </>
  );
}

function NovaVersao({ material, campanhaTitulo }: { material: Material; campanhaTitulo: string }) {
  const { perfil } = useAuth();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [nota, setNota] = useState('');
  const [legenda, setLegenda] = useState(material.legenda);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!arquivo && legenda === material.legenda) return avisar('Anexe o novo arquivo ou altere o texto.', 'erro');
    setEnviando(true);
    try {
      const up = arquivo ? await enviarArquivo(arquivo) : { url: material.arquivo_url, nome: material.arquivo_nome };
      const versao = material.versao + 1;
      await inserir<VersaoMaterial>('versoes_material', { material_id: material.id, versao, arquivo_url: up.url || null, arquivo_nome: up.nome, nota: nota || 'Ajustes realizados', autor_id: perfil!.id });
      await atualizar<Material>('materiais', material.id, { versao, arquivo_url: up.url || null, arquivo_nome: up.nome, legenda, status: 'aguardando_aprovacao', atualizado_em: new Date().toISOString() });
      await registrar(perfil!.id, 'enviou uma nova versão', `${material.titulo} • ${campanhaTitulo}`, material.campanha_id);
      setArquivo(null);
      setNota('');
      avisar(`Versão ${doisDigitos(versao)} enviada para aprovação.`);
    } catch (err: any) {
      avisar(err.message, 'erro');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="nova-versao" onSubmit={enviar}>
      <b className="rotulo-bloco">Enviar nova versão</b>
      <label className="campo"><span>Arquivo</span><input className="entrada" type="file" accept="image/*,application/pdf" onChange={(e) => setArquivo(e.target.files?.[0] || null)} /></label>
      <label className="campo"><span>Legenda / texto</span><textarea className="entrada entrada--baixa" value={legenda} onChange={(e) => setLegenda(e.target.value)} /></label>
      <label className="campo"><span>O que mudou?</span><input className="entrada" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ex.: Ajuste de contraste e título" /></label>
      <button className="btn btn--primario" disabled={enviando}><Icone nome="upload" /> {enviando ? 'Enviando…' : 'Enviar nova versão'}</button>
    </form>
  );
}
