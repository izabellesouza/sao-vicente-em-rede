// Quadro de tarefas (A fazer → Em andamento → Em revisão → Concluído).
import { useState, type FormEvent } from 'react';
import { Icone } from '../lib/icons';
import { pode, useAuth } from '../lib/auth';
import { atualizar, inserir, remover } from '../lib/backend';
import { Avatar, Modal, Selo, avisar } from '../lib/ui';
import { COLUNAS, ETAPAS, ROTULO_PRIORIDADE, atrasada, registrar, situacaoPublica, useTabela } from '../lib/dados';
import { dataCurta } from '../lib/format';
import type { Campanha, Tarefa } from '../lib/types';
import { TituloPagina, usePerfis } from './OrganizadorLayout';

const COR_PRIORIDADE = { alta: 'vermelho', media: 'amarelo', baixa: 'cinza' };

export default function Tarefas() {
  const { perfil } = useAuth();
  const { lista: perfis, nome } = usePerfis();
  const { dados: campanhas } = useTabela<Campanha>('campanhas');
  const { dados: tarefas } = useTabela<Tarefa>('tarefas');
  const inicial = new URLSearchParams(window.location.search).get('c') || 'todas';
  const [campanhaId, setCampanhaId] = useState(inicial);
  const [responsavel, setResponsavel] = useState(perfil?.funcao === 'producao' ? perfil.id : 'todos');
  const [prioridade, setPrioridade] = useState('todas');
  const [editando, setEditando] = useState<Partial<Tarefa> | null>(null);

  const idsCampanhas = new Set(campanhas.map((c) => c.id));
  const visiveis = tarefas
    .filter((t) => idsCampanhas.has(t.campanha_id))
    .filter((t) => campanhaId === 'todas' || t.campanha_id === campanhaId)
    .filter((t) => responsavel === 'todos' || t.responsavel_id === responsavel)
    .filter((t) => prioridade === 'todas' || t.prioridade === prioridade)
    .sort((a, b) => (a.prazo || '9').localeCompare(b.prazo || '9'));

  const tituloCampanha = (id: string) => campanhas.find((c) => c.id === id)?.titulo || '';
  const ativas = campanhas.filter((c) => situacaoPublica(c) !== 'encerrada');
  const podeCriar = pode.gerenciarTarefas(perfil);

  async function mover(t: Tarefa, status: Tarefa['status']) {
    try {
      await atualizar<Tarefa>('tarefas', t.id, { status });
      const col = COLUNAS.find((c) => c.id === status)!;
      await registrar(perfil!.id, status === 'concluido' ? 'concluiu uma tarefa' : `moveu uma tarefa para “${col.rotulo}”`, `${t.titulo} • ${tituloCampanha(t.campanha_id)}`, t.campanha_id);
      avisar(`Tarefa movida para “${col.rotulo}”.`);
    } catch (e: any) {
      avisar(e.message, 'erro');
    }
  }

  return (
    <>
      <TituloPagina titulo="Quadro de tarefas" texto={campanhaId === 'todas' ? 'Acompanhe o fluxo de trabalho da equipe.' : `${tituloCampanha(campanhaId)} • Acompanhe o fluxo de trabalho da equipe.`}>
        {podeCriar && (
          <button type="button" className="btn btn--primario" onClick={() => setEditando({ campanha_id: campanhaId !== 'todas' ? campanhaId : ativas[0]?.id, prioridade: 'media', status: 'a_fazer', etapa: 'producao', titulo: '', descricao: '', prazo: '', responsavel_id: '' })}>
            Nova tarefa <Icone nome="plus" />
          </button>
        )}
      </TituloPagina>

      <div className="barra-filtros">
        <select className="entrada" value={campanhaId} onChange={(e) => setCampanhaId(e.target.value)} aria-label="Campanha">
          <option value="todas">Todas as campanhas</option>
          {campanhas.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
        </select>
        <select className="entrada" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} aria-label="Responsável">
          <option value="todos">Todos os responsáveis</option>
          {perfil && <option value={perfil.id}>Só as minhas</option>}
          {perfis.filter((p) => p.id !== perfil?.id).map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <select className="entrada" value={prioridade} onChange={(e) => setPrioridade(e.target.value)} aria-label="Prioridade">
          <option value="todas">Todas as prioridades</option>
          <option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>
        </select>
      </div>

      <div className="quadro">
        {COLUNAS.map((col, ci) => {
          const daColuna = visiveis.filter((t) => t.status === col.id);
          return (
            <section key={col.id} className="coluna" aria-label={col.rotulo}>
              <h2 className="coluna__titulo"><span className="bolinha" style={{ background: col.cor }} /> {col.rotulo} <small>{daColuna.length}</small></h2>
              <ul className="coluna__lista">
                {daColuna.map((t) => {
                  const pode_mover = pode.moverTarefa(perfil, t.responsavel_id);
                  return (
                    <li key={t.id} className={`tarefa ${atrasada(t) ? 'tarefa--atrasada' : ''}`}>
                      <div className="tarefa__topo">
                        <Selo cor={COR_PRIORIDADE[t.prioridade]}>{ROTULO_PRIORIDADE[t.prioridade]}</Selo>
                        {atrasada(t) && <Selo cor="vermelho">Atrasada</Selo>}
                      </div>
                      <h3>{t.titulo}</h3>
                      <small className="tarefa__campanha">{tituloCampanha(t.campanha_id)}</small>
                      {t.descricao && <p>{t.descricao}</p>}
                      <span className="tarefa__prazo"><Icone nome="clock" tamanho={14} /> {dataCurta(t.prazo)}</span>
                      <div className="tarefa__rodape">
                        <span className="celula-pessoa" title={nome(t.responsavel_id)}><Avatar nome={nome(t.responsavel_id)} tamanho={28} /> <small>{nome(t.responsavel_id).split(' ')[0]}</small></span>
                        <span className="tarefa__acoes">
                          {pode_mover && ci > 0 && (
                            <button type="button" className="btn-icone btn-icone--pequeno" onClick={() => mover(t, COLUNAS[ci - 1].id)} aria-label={`Voltar “${t.titulo}” para ${COLUNAS[ci - 1].rotulo}`}><Icone nome="arrow-left" tamanho={16} /></button>
                          )}
                          {pode_mover && ci < COLUNAS.length - 1 && (
                            <button type="button" className="btn-icone btn-icone--pequeno btn-icone--destaque" onClick={() => mover(t, COLUNAS[ci + 1].id)} aria-label={`Avançar “${t.titulo}” para ${COLUNAS[ci + 1].rotulo}`}><Icone nome="arrow-right" tamanho={16} /></button>
                          )}
                          <button type="button" className="link-seta link-seta--pequeno" onClick={() => setEditando(t)}>Abrir<span className="visualmente-oculto"> {t.titulo}</span></button>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {podeCriar && (
                <button type="button" className="coluna__nova" onClick={() => setEditando({ campanha_id: campanhaId !== 'todas' ? campanhaId : ativas[0]?.id, prioridade: 'media', status: col.id, etapa: 'producao', titulo: '', descricao: '', prazo: '', responsavel_id: '' })}>
                  <Icone nome="plus" tamanho={16} /> Adicionar tarefa
                </button>
              )}
            </section>
          );
        })}
      </div>

      <Modal titulo={editando?.id ? 'Tarefa' : 'Nova tarefa'} aberto={!!editando} aoFechar={() => setEditando(null)}>
        {editando && <FormTarefa tarefa={editando} campanhas={campanhas} perfis={perfis} aoFechar={() => setEditando(null)} tituloCampanha={tituloCampanha} />}
      </Modal>
    </>
  );
}

function FormTarefa({ tarefa, campanhas, perfis, aoFechar, tituloCampanha }: { tarefa: Partial<Tarefa>; campanhas: Campanha[]; perfis: any[]; aoFechar: () => void; tituloCampanha: (id: string) => string }) {
  const { perfil } = useAuth();
  const [t, setT] = useState<Partial<Tarefa>>(tarefa);
  const [erro, setErro] = useState('');
  const gerente = pode.gerenciarTarefas(perfil);
  const podeStatus = pode.moverTarefa(perfil, tarefa.responsavel_id || null);
  const muda = (k: keyof Tarefa, v: any) => setT({ ...t, [k]: v });

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!t.titulo?.trim() || !t.campanha_id) return setErro('Informe o título e a campanha.');
    try {
      const dados = { campanha_id: t.campanha_id, titulo: t.titulo.trim(), descricao: t.descricao || '', responsavel_id: t.responsavel_id || null, prazo: t.prazo || null, prioridade: t.prioridade, status: t.status, etapa: t.etapa };
      if (t.id) {
        await atualizar('tarefas', t.id, gerente ? dados : { status: t.status });
        await registrar(perfil!.id, 'atualizou uma tarefa', `${dados.titulo} • ${tituloCampanha(dados.campanha_id)}`, dados.campanha_id);
      } else {
        await inserir('tarefas', { ...dados, criado_por: perfil!.id });
        await registrar(perfil!.id, 'criou uma tarefa', `${dados.titulo} • ${tituloCampanha(dados.campanha_id)}`, dados.campanha_id);
      }
      avisar('Tarefa salva.');
      aoFechar();
    } catch (err: any) {
      setErro(err.message);
    }
  }

  async function excluir() {
    if (!t.id || !confirm('Excluir esta tarefa?')) return;
    try {
      await remover('tarefas', { id: t.id });
      avisar('Tarefa excluída.');
      aoFechar();
    } catch (err: any) {
      setErro(err.message);
    }
  }

  return (
    <form onSubmit={salvar} className="form-modal">
      <fieldset disabled={!gerente} className="sem-borda grade-form">
        <label className="campo inteiro"><span>Título *</span><input className="entrada" value={t.titulo} onChange={(e) => muda('titulo', e.target.value)} required /></label>
        <label className="campo inteiro"><span>Campanha *</span>
          <select className="entrada" value={t.campanha_id || ''} onChange={(e) => muda('campanha_id', e.target.value)} required>
            <option value="">Selecione…</option>
            {campanhas.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
          </select>
        </label>
        <label className="campo inteiro"><span>Descrição / briefing</span><textarea className="entrada entrada--baixa" value={t.descricao} onChange={(e) => muda('descricao', e.target.value)} /></label>
        <label className="campo"><span>Responsável</span>
          <select className="entrada" value={t.responsavel_id || ''} onChange={(e) => muda('responsavel_id', e.target.value)}>
            <option value="">—</option>
            {perfis.filter((p) => p.ativo).map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </label>
        <label className="campo"><span>Prazo</span><input className="entrada" type="date" value={t.prazo || ''} onChange={(e) => muda('prazo', e.target.value)} /></label>
        <label className="campo"><span>Prioridade</span>
          <select className="entrada" value={t.prioridade} onChange={(e) => muda('prioridade', e.target.value)}>
            <option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>
          </select>
        </label>
        <label className="campo"><span>Etapa</span>
          <select className="entrada" value={t.etapa} onChange={(e) => muda('etapa', e.target.value)}>
            {ETAPAS.map((x) => <option key={x.id} value={x.id}>{x.rotulo}</option>)}
          </select>
        </label>
      </fieldset>
      <label className="campo" style={{ marginTop: 16 }}><span>Andamento</span>
        <select className="entrada" value={t.status} onChange={(e) => muda('status', e.target.value)} disabled={!gerente && !podeStatus}>
          {COLUNAS.map((c) => <option key={c.id} value={c.id}>{c.rotulo}</option>)}
        </select>
      </label>
      {!gerente && <p className="faixa-info"><Icone nome="lock" tamanho={16} /> {podeStatus ? 'Você pode atualizar o andamento desta tarefa.' : 'Somente o responsável ou a coordenação pode alterar esta tarefa.'}</p>}
      {erro && <p className="erro-form" role="alert">{erro}</p>}
      <div className="acoes-form">
        {gerente && t.id && <button type="button" className="btn btn--perigo" onClick={excluir}><Icone nome="trash" /> Excluir</button>}
        <button type="button" className="btn btn--contorno" onClick={aoFechar}>Cancelar</button>
        {(gerente || podeStatus) && <button className="btn btn--primario">Salvar</button>}
      </div>
    </form>
  );
}
