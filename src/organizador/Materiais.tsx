// Materiais: arquivos, versões e situação de aprovação.
import { useState, type FormEvent } from 'react';
import { Link } from '../lib/router';
import { Icone } from '../lib/icons';
import { pode, useAuth } from '../lib/auth';
import { enviarArquivo, inserir } from '../lib/backend';
import { Avatar, Modal, PreviaMaterial, Selo, Vazio, avisar } from '../lib/ui';
import { ROTULO_MATERIAL, TIPOS_MATERIAL, registrar, situacaoPublica, useTabela } from '../lib/dados';
import { dataHora, doisDigitos } from '../lib/format';
import type { Campanha, Material, VersaoMaterial } from '../lib/types';
import { TituloPagina, usePerfis } from './OrganizadorLayout';

export default function Materiais() {
  const { perfil } = useAuth();
  const { nome } = usePerfis();
  const { dados: campanhas } = useTabela<Campanha>('campanhas');
  const { dados: materiais } = useTabela<Material>('materiais');
  const [campanhaId, setCampanhaId] = useState(new URLSearchParams(window.location.search).get('c') || 'todas');
  const [status, setStatus] = useState('todos');
  const [novo, setNovo] = useState(false);

  const daCampanha = materiais.filter((m) => campanhaId === 'todas' || m.campanha_id === campanhaId);
  const lista = daCampanha.filter((m) => status === 'todos' || m.status === status).sort((a, b) => (b.atualizado_em || '').localeCompare(a.atualizado_em || ''));
  const camp = (id: string) => campanhas.find((c) => c.id === id);
  const conta = (s: string) => daCampanha.filter((m) => m.status === s).length;

  return (
    <>
      <TituloPagina titulo="Materiais" texto={`Arquivos, versões e aprovações${campanhaId !== 'todas' ? ` da campanha ${camp(campanhaId)?.titulo || ''}` : ' das campanhas'}.`}>
        {pode.enviarMaterial(perfil) && <button type="button" className="btn btn--primario" onClick={() => setNovo(true)}>Enviar material <Icone nome="upload" /></button>}
      </TituloPagina>

      <div className="barra-filtros">
        <select className="entrada" value={campanhaId} onChange={(e) => setCampanhaId(e.target.value)} aria-label="Campanha">
          <option value="todas">Todas as campanhas</option>
          {campanhas.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
        </select>
        <div className="contagens" role="group" aria-label="Filtrar por situação">
          <button type="button" className={status === 'todos' ? 'ativo' : ''} aria-pressed={status === 'todos'} onClick={() => setStatus('todos')}><b>{daCampanha.length}</b> Todos</button>
          {(['em_producao', 'aguardando_aprovacao', 'ajuste_solicitado', 'aprovado'] as const).map((s) => (
            <button key={s} type="button" className={status === s ? 'ativo' : ''} aria-pressed={status === s} onClick={() => setStatus(s)}><b>{conta(s)}</b> {ROTULO_MATERIAL[s].rotulo}</button>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="painel"><Vazio titulo="Nenhum material por aqui" texto="Envie o primeiro material da campanha para iniciar o fluxo de aprovação." icone="file" /></div>
      ) : (
        <ul className="grade-materiais">
          {lista.map((m) => {
            const c = camp(m.campanha_id);
            const st = ROTULO_MATERIAL[m.status];
            return (
              <li key={m.id} className="material">
                <div className="material__previa">
                  <PreviaMaterial titulo={c?.titulo || m.titulo} cor={c?.cor} url={m.arquivo_url} claro={m.tipo === 'Legenda'} />
                </div>
                <div className="material__corpo">
                  <Selo cor={st.classe}>{st.rotulo}</Selo>
                  <h2><Link to={`/organizador/aprovacoes/${m.id}`}>{m.titulo}</Link></h2>
                  <p><span>{m.arquivo_nome || m.tipo}</span><span>V{doisDigitos(m.versao)}</span></p>
                  <div className="material__autor">
                    <Avatar nome={nome(m.autor_id)} tamanho={30} />
                    <span><b>{nome(m.autor_id).split(' ')[0]}</b><small>Atualizado em {dataHora(m.atualizado_em || m.criado_em)}</small></span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal titulo="Enviar material" aberto={novo} aoFechar={() => setNovo(false)} largura={620}>
        <FormMaterial campanhas={campanhas.filter((c) => situacaoPublica(c) !== 'encerrada')} campanhaInicial={campanhaId !== 'todas' ? campanhaId : ''} aoFechar={() => setNovo(false)} />
      </Modal>
    </>
  );
}

function FormMaterial({ campanhas, campanhaInicial, aoFechar }: { campanhas: Campanha[]; campanhaInicial: string; aoFechar: () => void }) {
  const { perfil } = useAuth();
  const [campanha_id, setCampanha] = useState(campanhaInicial || campanhas[0]?.id || '');
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState(TIPOS_MATERIAL[0]);
  const [formato, setFormato] = useState('1080 × 1350 px');
  const [briefing, setBriefing] = useState('');
  const [legenda, setLegenda] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [paraAprovacao, setParaAprovacao] = useState(true);
  const [publico, setPublico] = useState(true);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!campanha_id || !titulo.trim()) return setErro('Informe a campanha e o título.');
    if (arquivo && arquivo.size > 8 * 1024 * 1024) return setErro('O arquivo deve ter no máximo 8 MB.');
    setEnviando(true);
    setErro('');
    try {
      const up = arquivo ? await enviarArquivo(arquivo) : { url: null, nome: null };
      const m = await inserir<Material>('materiais', {
        campanha_id, titulo: titulo.trim(), tipo, formato, briefing, legenda, arquivo_url: up.url || null, arquivo_nome: up.nome,
        versao: 1, status: paraAprovacao ? 'aguardando_aprovacao' : 'em_producao', publico, autor_id: perfil!.id, atualizado_em: new Date().toISOString(),
      });
      await inserir<VersaoMaterial>('versoes_material', { material_id: m.id, versao: 1, arquivo_url: up.url || null, arquivo_nome: up.nome, nota: 'Primeira versão', autor_id: perfil!.id });
      const camp = campanhas.find((c) => c.id === campanha_id)?.titulo;
      await registrar(perfil!.id, paraAprovacao ? 'enviou um material para aprovação' : 'cadastrou um material', `${m.titulo} • ${camp}`, campanha_id);
      avisar(paraAprovacao ? 'Material enviado para aprovação.' : 'Material salvo.');
      aoFechar();
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="form-modal">
      <div className="grade-form">
        <label className="campo inteiro"><span>Campanha *</span>
          <select className="entrada" value={campanha_id} onChange={(e) => setCampanha(e.target.value)} required>
            <option value="">Selecione…</option>
            {campanhas.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
          </select>
        </label>
        <label className="campo inteiro"><span>Título *</span><input className="entrada" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Card principal — Instagram" required /></label>
        <label className="campo"><span>Tipo</span>
          <select className="entrada" value={tipo} onChange={(e) => setTipo(e.target.value)}>{TIPOS_MATERIAL.map((t) => <option key={t}>{t}</option>)}</select>
        </label>
        <label className="campo"><span>Formato</span><input className="entrada" value={formato} onChange={(e) => setFormato(e.target.value)} /></label>
        <label className="campo inteiro"><span>Briefing</span><textarea className="entrada entrada--baixa" value={briefing} onChange={(e) => setBriefing(e.target.value)} placeholder="O que a peça precisa comunicar." /></label>
        <label className="campo inteiro"><span>Arquivo (imagem ou PDF)</span>
          <input className="entrada" type="file" accept="image/*,application/pdf" onChange={(e) => setArquivo(e.target.files?.[0] || null)} />
          <small>Opcional para textos (ex.: legendas). Máximo de 8 MB.</small>
        </label>
        <label className="campo inteiro"><span>Legenda / texto</span><textarea className="entrada entrada--baixa" value={legenda} onChange={(e) => setLegenda(e.target.value)} /></label>
        <label className="checkbox inteiro"><input type="checkbox" checked={paraAprovacao} onChange={(e) => setParaAprovacao(e.target.checked)} /> Enviar agora para aprovação</label>
        <label className="checkbox inteiro"><input type="checkbox" checked={publico} onChange={(e) => setPublico(e.target.checked)} /> Exibir no portal público depois de aprovado</label>
      </div>
      {erro && <p className="erro-form" role="alert">{erro}</p>}
      <div className="acoes-form">
        <button type="button" className="btn btn--contorno" onClick={aoFechar}>Cancelar</button>
        <button className="btn btn--primario" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar material'}</button>
      </div>
    </form>
  );
}
