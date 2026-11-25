// Cadastro e edição de campanha (conceito, período, participação, programação e formas de apoio).
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useRouter } from '../lib/router';
import { Icone } from '../lib/icons';
import { pode, useAuth } from '../lib/auth';
import { atualizar, inserir, listar, remover } from '../lib/backend';
import { Carregando, Selo, Vazio, avisar } from '../lib/ui';
import { COLUNAS, ROTULO_MATERIAL, progresso, registrar, situacaoInterna, useTabela } from '../lib/dados';
import { dataCurta, slugify } from '../lib/format';
import type { Campanha, CampanhaApoio, FormaApoio, ItemProgramacao, Material, OpcaoParticipacao, Tarefa } from '../lib/types';
import { TituloPagina, usePerfis } from './OrganizadorLayout';

const CORES = [
  { v: '#1a6b86', n: 'Azul petróleo' },
  { v: '#b0436b', n: 'Rosa' },
  { v: '#2f7d5e', n: 'Verde' },
  { v: '#946c0c', n: 'Dourado' },
  { v: '#c4543d', n: 'Coral' },
  { v: '#6a4c93', n: 'Roxo' },
  { v: '#12324b', n: 'Marinho' },
];

const VAZIA: Partial<Campanha> = {
  titulo: '', tipo: 'Campanha de conscientização', cor: '#1a6b86', resumo: '', descricao: '', objetivo: '', publico: '',
  local: 'João Pessoa • PB', inicio: '', fim: '', participacao: [], programacao: [], publicado: false,
};

export default function CampanhaForm({ id }: { id?: string }) {
  const { perfil } = useAuth();
  const { navigate } = useRouter();
  const { lista: perfis, nome } = usePerfis();
  const [c, setC] = useState<Partial<Campanha> | null>(id ? null : { ...VAZIA, responsavel_id: perfil?.id });
  const [apoios, setApoios] = useState<Set<string>>(new Set());
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const { dados: formas } = useTabela<FormaApoio>('formas_apoio');
  const editavel = pode.editarCampanhas(perfil);

  useEffect(() => {
    if (!id) {
      listar<FormaApoio>('formas_apoio', { ativo: true }).then((f) => setApoios(new Set(f.map((x) => x.id))));
      return;
    }
    listar<Campanha>('campanhas', { id }).then(([x]) => setC(x || {}));
    listar<CampanhaApoio>('campanha_apoio', { campanha_id: id }).then((v) => setApoios(new Set(v.map((x) => x.apoio_id))));
  }, [id]);

  if (!c) return <Carregando />;
  if (id && !c.id) return <Vazio titulo="Campanha não encontrada" icone="search"><Link className="btn btn--primario" to="/organizador/campanhas">Voltar</Link></Vazio>;

  const muda = (campo: keyof Campanha, valor: any) => setC({ ...c, [campo]: valor });

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!c!.titulo?.trim() || !c!.inicio || !c!.fim) return setErro('Preencha título, início e fim.');
    if (c!.fim! < c!.inicio!) return setErro('A data de fim deve ser depois do início.');
    setErro('');
    setSalvando(true);
    try {
      const dados = {
        titulo: c!.titulo!.trim(), slug: c!.slug || slugify(c!.titulo!), tipo: c!.tipo, cor: c!.cor, resumo: c!.resumo, descricao: c!.descricao,
        objetivo: c!.objetivo, publico: c!.publico, local: c!.local, inicio: c!.inicio, fim: c!.fim, responsavel_id: c!.responsavel_id || null,
        participacao: (c!.participacao || []).filter((p) => p.titulo.trim()),
        programacao: (c!.programacao || []).filter((p) => p.titulo.trim()),
      };
      let salva: Campanha;
      if (id) {
        salva = await atualizar<Campanha>('campanhas', id, dados);
        await registrar(perfil!.id, 'atualizou a campanha', salva.titulo, salva.id);
      } else {
        const existentes = await listar<Campanha>('campanhas', { slug: dados.slug });
        if (existentes.length) dados.slug = `${dados.slug}-${Date.now().toString().slice(-4)}`;
        salva = await inserir<Campanha>('campanhas', { ...dados, publicado: false, criado_por: perfil!.id });
        await registrar(perfil!.id, 'criou a campanha', salva.titulo, salva.id);
      }
      // formas de apoio vinculadas
      await remover('campanha_apoio', { campanha_id: salva.id });
      for (const apoio_id of apoios) await inserir('campanha_apoio', { campanha_id: salva.id, apoio_id });
      avisar('Campanha salva.');
      if (!id) navigate(`/organizador/campanhas/${salva.id}`);
      else setC(salva);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!id || !confirm(`Excluir a campanha "${c!.titulo}" e todas as suas tarefas e materiais? Esta ação não pode ser desfeita.`)) return;
    try {
      for (const t of ['tarefas', 'materiais', 'campanha_apoio', 'resultados'] as const) await remover(t, { campanha_id: id });
      await remover('campanhas', { id });
      await registrar(perfil!.id, 'excluiu a campanha', c!.titulo!, null);
      avisar('Campanha excluída.');
      navigate('/organizador/campanhas');
    } catch (err: any) {
      avisar(err.message, 'erro');
    }
  }

  const s = id ? situacaoInterna(c as Campanha) : null;

  return (
    <>
      <Link to="/organizador/campanhas" className="link-seta voltar"><Icone nome="arrow-left" tamanho={16} /> Campanhas</Link>
      <TituloPagina titulo={id ? c.titulo! : 'Nova campanha'} texto={id ? 'Conceito, período, participação e canais oficiais.' : 'Preencha o conceito da campanha. Você poderá publicar no portal depois da revisão.'}>
        {s && <Selo cor={s.classe}>{s.rotulo}</Selo>}
        {id && pode.publicar(perfil) && <Link to={`/organizador/conteudo-publico?c=${id}`} className="btn btn--contorno btn--pequeno"><Icone nome="globe" /> Publicação</Link>}
      </TituloPagina>

      <div className={id ? 'grade-campanha' : ''}>
        <form className="painel" onSubmit={salvar}>
          <fieldset disabled={!editavel} className="sem-borda">
            {!editavel && <p className="faixa-info"><Icone nome="lock" tamanho={16} /> Seu perfil pode consultar, mas não editar campanhas.</p>}
            <div className="grade-form">
              <label className="campo inteiro"><span>Título da campanha *</span>
                <input className="entrada" value={c.titulo} onChange={(e) => muda('titulo', e.target.value)} placeholder="Ex.: Natal Solidário" required />
              </label>
              <label className="campo"><span>Tipo</span>
                <input className="entrada" value={c.tipo} onChange={(e) => muda('tipo', e.target.value)} list="tipos-campanha" />
                <datalist id="tipos-campanha">
                  <option value="Campanha de conscientização" /><option value="Campanha de solidariedade" /><option value="Campanha de arrecadação" /><option value="Campanha de acolhimento" />
                </datalist>
              </label>
              <label className="campo"><span>Responsável pelo conceito</span>
                <select className="entrada" value={c.responsavel_id || ''} onChange={(e) => muda('responsavel_id', e.target.value)}>
                  <option value="">—</option>
                  {perfis.filter((p) => p.ativo).map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </label>
              <label className="campo"><span>Início *</span><input className="entrada" type="date" value={c.inicio} onChange={(e) => muda('inicio', e.target.value)} required /></label>
              <label className="campo"><span>Fim *</span><input className="entrada" type="date" value={c.fim} onChange={(e) => muda('fim', e.target.value)} required /></label>
              <label className="campo inteiro"><span>Chamada (frase curta)</span>
                <input className="entrada" value={c.resumo} onChange={(e) => muda('resumo', e.target.value)} placeholder="Ex.: Cuidar da saúde também é um ato de coragem." maxLength={120} />
              </label>
              <label className="campo inteiro"><span>Descrição</span>
                <textarea className="entrada" value={c.descricao} onChange={(e) => muda('descricao', e.target.value)} placeholder="O que é a campanha e o que vai acontecer." />
              </label>
              <label className="campo inteiro"><span>Objetivo</span>
                <textarea className="entrada entrada--baixa" value={c.objetivo} onChange={(e) => muda('objetivo', e.target.value)} />
              </label>
              <label className="campo"><span>Público</span><input className="entrada" value={c.publico} onChange={(e) => muda('publico', e.target.value)} placeholder="Comunidade, pacientes e familiares" /></label>
              <label className="campo"><span>Local</span><input className="entrada" value={c.local} onChange={(e) => muda('local', e.target.value)} /></label>
              <fieldset className="campo inteiro sem-borda">
                <legend>Cor do selo</legend>
                <div className="cores">
                  {CORES.map((cor) => (
                    <label key={cor.v} className="cor" title={cor.n}>
                      <input type="radio" name="cor" checked={c.cor === cor.v} onChange={() => muda('cor', cor.v)} />
                      <span style={{ background: cor.v }} />
                      <span className="visualmente-oculto">{cor.n}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <EditorLista<OpcaoParticipacao>
              titulo="Formas de participação"
              ajuda="Aparecem no portal como opções em “Participe com a gente”."
              itens={c.participacao || []}
              vazio={{ titulo: '', detalhe: '' }}
              aoMudar={(v) => muda('participacao', v)}
              campos={[{ k: 'titulo', r: 'Opção', ph: 'Participar da caminhada' }, { k: 'detalhe', r: 'Detalhe', ph: '17 de novembro, às 7h' }]}
              colunas="1fr 1fr"
            />
            <EditorLista<ItemProgramacao>
              titulo="Programação"
              ajuda="Deixe a data vazia para itens do mês todo (ex.: venda de camisas)."
              itens={c.programacao || []}
              vazio={{ data: '', titulo: '', local: '', horario: '' }}
              aoMudar={(v) => muda('programacao', v)}
              campos={[{ k: 'data', r: 'Data', tipo: 'date' }, { k: 'titulo', r: 'Atividade', ph: 'Palestra de abertura' }, { k: 'local', r: 'Local', ph: 'Auditório do hospital' }, { k: 'horario', r: 'Horário', ph: '15h' }]}
              colunas="150px 1.4fr 1.4fr 80px"
            />

            <fieldset className="sem-borda bloco-form">
              <legend className="bloco-form__titulo">Formas oficiais de apoio</legend>
              <p className="texto-suave">Canais exibidos na página da campanha. Cadastre novos em Configurações.</p>
              <div className="lista-checks">
                {formas.map((f) => (
                  <label key={f.id} className="checkbox">
                    <input type="checkbox" checked={apoios.has(f.id)} onChange={(e) => {
                      const n = new Set(apoios);
                      e.target.checked ? n.add(f.id) : n.delete(f.id);
                      setApoios(n);
                    }} />
                    {f.titulo} {!f.ativo && <Selo cor="cinza">Inativa</Selo>}
                  </label>
                ))}
              </div>
            </fieldset>

            {erro && <p className="erro-form" role="alert">{erro}</p>}
            {editavel && (
              <div className="acoes-form">
                {id && <button type="button" className="btn btn--perigo" onClick={excluir}><Icone nome="trash" /> Excluir</button>}
                <button className="btn btn--primario" disabled={salvando}>{salvando ? 'Salvando…' : id ? 'Salvar alterações' : 'Criar campanha'}</button>
              </div>
            )}
          </fieldset>
        </form>

        {id && <ResumoCampanha campanhaId={id} nome={nome} />}
      </div>
    </>
  );
}

type Campo = { k: string; r: string; ph?: string; tipo?: string };

function EditorLista<T extends Record<string, any>>({ titulo, ajuda, itens, vazio, aoMudar, campos, colunas }: { titulo: string; ajuda: string; itens: T[]; vazio: T; aoMudar: (v: T[]) => void; campos: Campo[]; colunas: string }) {
  return (
    <fieldset className="sem-borda bloco-form">
      <legend className="bloco-form__titulo">{titulo}</legend>
      <p className="texto-suave">{ajuda}</p>
      {itens.map((item, i) => (
        <div key={i} className="linha-lista" style={{ gridTemplateColumns: `${colunas} auto` }}>
          {campos.map((cp) => (
            <label key={cp.k} className="campo">
              <span className="visualmente-oculto">{cp.r} {i + 1}</span>
              <input className="entrada" type={cp.tipo || 'text'} placeholder={cp.ph || cp.r} value={item[cp.k] || ''} onChange={(e) => aoMudar(itens.map((x, j) => (j === i ? { ...x, [cp.k]: e.target.value } : x)))} />
            </label>
          ))}
          <button type="button" className="btn-icone" onClick={() => aoMudar(itens.filter((_, j) => j !== i))} aria-label={`Remover item ${i + 1} de ${titulo}`}><Icone nome="trash" /></button>
        </div>
      ))}
      <button type="button" className="btn btn--contorno btn--pequeno" onClick={() => aoMudar([...itens, { ...vazio }])}><Icone nome="plus" /> Adicionar</button>
    </fieldset>
  );
}

function ResumoCampanha({ campanhaId, nome }: { campanhaId: string; nome: (id?: string | null) => string }) {
  const { dados: tarefas } = useTabela<Tarefa>('tarefas', { campanha_id: campanhaId });
  const { dados: materiais } = useTabela<Material>('materiais', { campanha_id: campanhaId });
  return (
    <aside className="coluna-lateral">
      <section className="painel">
        <div className="painel__topo"><h2 className="painel__titulo painel__titulo--pequeno">Tarefas</h2><Link to={`/organizador/tarefas?c=${campanhaId}`} className="link-seta">Quadro <Icone nome="arrow-right" tamanho={14} /></Link></div>
        <p className="texto-suave">{progresso(tarefas)}% concluído • {tarefas.length} tarefas</p>
        <ul className="lista-mini">
          {COLUNAS.map((col) => (
            <li key={col.id}><span className="bolinha" style={{ background: col.cor }} /> {col.rotulo} <b>{tarefas.filter((t) => t.status === col.id).length}</b></li>
          ))}
        </ul>
        {tarefas.filter((t) => t.status !== 'concluido').slice(0, 4).map((t) => (
          <p key={t.id} className="item-mini"><b>{t.titulo}</b><small>{nome(t.responsavel_id).split(' ')[0]} • {dataCurta(t.prazo)}</small></p>
        ))}
      </section>
      <section className="painel">
        <div className="painel__topo"><h2 className="painel__titulo painel__titulo--pequeno">Materiais</h2><Link to={`/organizador/materiais?c=${campanhaId}`} className="link-seta">Ver <Icone nome="arrow-right" tamanho={14} /></Link></div>
        {materiais.length === 0 && <p className="texto-suave">Nenhum material enviado.</p>}
        {materiais.map((m) => (
          <Link key={m.id} to={`/organizador/aprovacoes/${m.id}`} className="item-mini item-mini--link">
            <b>{m.titulo}</b><Selo cor={ROTULO_MATERIAL[m.status].classe}>{ROTULO_MATERIAL[m.status].rotulo}</Selo>
          </Link>
        ))}
      </section>
    </aside>
  );
}
