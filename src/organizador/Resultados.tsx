// Resultados da campanha: indicadores agregados, metas e aprendizados.
import { SEM_ID } from '../lib/backend';
import { useEffect, useState, type FormEvent } from 'react';
import { Icone } from '../lib/icons';
import { pode, useAuth } from '../lib/auth';
import { atualizar, inserir } from '../lib/backend';
import { Modal, Vazio, avisar } from '../lib/ui';
import { atrasada, registrar, situacaoPublica, useConfig, useTabela } from '../lib/dados';
import { doisDigitos, moeda, pct, periodo } from '../lib/format';
import type { Campanha, Material, Resultado, Tarefa } from '../lib/types';
import { TituloPagina } from './OrganizadorLayout';

export default function Resultados() {
  const { perfil } = useAuth();
  const cfg = useConfig();
  const { dados: campanhas } = useTabela<Campanha>('campanhas');
  const ordenadas = [...campanhas].sort((a, b) => b.inicio.localeCompare(a.inicio));
  const padrao = ordenadas.find((c) => situacaoPublica(c) === 'em_andamento') || ordenadas.find((c) => situacaoPublica(c) === 'encerrada') || ordenadas[0];
  const [escolhida, setEscolhida] = useState('');
  const c = campanhas.find((x) => x.id === escolhida) || padrao;

  const { dados: tarefas } = useTabela<Tarefa>('tarefas', c ? { campanha_id: c.id } : { id: SEM_ID });
  const { dados: materiais } = useTabela<Material>('materiais', c ? { campanha_id: c.id } : { id: SEM_ID });
  const { dados: rs } = useTabela<Resultado>('resultados', c ? { campanha_id: c.id } : { id: SEM_ID });
  const r = rs[0];
  const [editar, setEditar] = useState(false);
  const [aprendizados, setAprendizados] = useState('');
  useEffect(() => setAprendizados(r?.aprendizados || ''), [r?.id, r?.aprendizados]);

  if (!c) return <><TituloPagina titulo="Resultados da campanha" /><div className="painel"><Vazio titulo="Nenhuma campanha cadastrada" icone="chart" /></div></>;

  const editavel = pode.editarResultados(perfil);
  const concluidas = tarefas.filter((t) => t.status === 'concluido').length;
  const atrasadas = tarefas.filter(atrasada).length;
  const aprovados = materiais.filter((m) => m.status === 'aprovado').length;

  async function salvarResultado(dados: Partial<Resultado>) {
    try {
      const comData = { ...dados, atualizado_em: new Date().toISOString() };
      if (r) await atualizar<Resultado>('resultados', r.id, comData);
      else await inserir<Resultado>('resultados', { campanha_id: c!.id, participantes: 0, meta_participantes: 0, camisas: 0, meta_camisas: 0, valor_arrecadado: 0, meta_valor: 0, observacoes: '', aprendizados: '', ...comData });
      await registrar(perfil!.id, 'atualizou os resultados', c!.titulo, c!.id);
      avisar('Resultados salvos.');
      return true;
    } catch (e: any) {
      avisar(e.message, 'erro');
      return false;
    }
  }

  const metas = [
    { r: 'Participantes', v: pct(r?.participantes || 0, r?.meta_participantes || 0), tem: !!r?.meta_participantes },
    { r: 'Camisas', v: pct(r?.camisas || 0, r?.meta_camisas || 0), tem: !!r?.meta_camisas },
    { r: 'Arrecadação', v: pct(r?.valor_arrecadado || 0, r?.meta_valor || 0), tem: !!r?.meta_valor },
    { r: 'Tarefas', v: pct(concluidas, tarefas.length), tem: tarefas.length > 0 },
    { r: 'Materiais', v: pct(aprovados, materiais.length), tem: materiais.length > 0 },
  ].filter((m) => m.tem);

  return (
    <>
      <TituloPagina titulo="Resultados da campanha" texto={`${c.titulo} • Indicadores agregados e aprendizados.`}>
        <select className="entrada entrada--auto" value={c.id} onChange={(e) => setEscolhida(e.target.value)} aria-label="Campanha">
          {ordenadas.map((x) => <option key={x.id} value={x.id}>{x.titulo}</option>)}
        </select>
        {editavel && <button type="button" className="btn btn--contorno" onClick={() => setEditar(true)}><Icone nome="pencil" /> Atualizar números</button>}
        <button type="button" className="btn btn--contorno" onClick={() => window.print()}>Gerar relatório <Icone nome="printer" /></button>
      </TituloPagina>

      <div className="relatorio-cabecalho">
        <h1>Relatório da campanha {c.titulo}</h1>
        <p>{cfg.instituicao} • {periodo(c.inicio, c.fim)} • Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div className="indicadores indicadores--3">
        <Kpi icone="check" rotulo="Tarefas concluídas" valor={doisDigitos(concluidas)} sub={`de ${tarefas.length} tarefas`} pctTexto={`${pct(concluidas, tarefas.length)}%`} />
        <Kpi icone="clock" rotulo="Tarefas atrasadas" valor={doisDigitos(atrasadas)} sub={`${pct(atrasadas, tarefas.length)}% do total`} pctTexto={`${pct(atrasadas, tarefas.length)}%`} />
        <Kpi icone="approve" rotulo="Materiais aprovados" valor={doisDigitos(aprovados)} sub={`de ${materiais.length} materiais`} pctTexto={`${pct(aprovados, materiais.length)}%`} />
        <Kpi icone="users" rotulo="Participantes" valor={String(r?.participantes ?? 0)} sub={r?.meta_participantes ? `meta: ${r.meta_participantes}` : 'informados pela equipe'} pctTexto={r?.meta_participantes ? `${pct(r.participantes, r.meta_participantes)}%` : ''} />
        <Kpi icone="megaphone" rotulo="Camisas vendidas" valor={String(r?.camisas ?? 0)} sub={r?.meta_camisas ? `meta: ${r.meta_camisas}` : 'informadas pela equipe'} pctTexto={r?.meta_camisas ? `${pct(r.camisas, r.meta_camisas)}%` : ''} />
        <Kpi icone="chart" rotulo="Valor arrecadado" valor={moeda(r?.valor_arrecadado || 0)} sub={r?.meta_valor ? `meta: ${moeda(r.meta_valor)}` : 'valor agregado informado'} pctTexto={r?.meta_valor ? `${pct(r.valor_arrecadado, r.meta_valor)}%` : ''} />
      </div>

      <div className="grade-dupla-org">
        <section className="painel">
          <h2 className="painel__titulo">Meta x resultado</h2>
          {metas.length ? (
            <div className="metas">
              {metas.map((m) => (
                <div key={m.r} className="meta-linha">
                  <span>{m.r}</span>
                  <span className="barra" role="progressbar" aria-valuenow={m.v} aria-valuemin={0} aria-valuemax={100} aria-label={m.r}><i style={{ width: `${Math.min(100, m.v)}%` }} /></span>
                  <b>{m.v}%</b>
                </div>
              ))}
            </div>
          ) : (
            <Vazio titulo="Sem metas definidas" texto="Use “Atualizar números” para registrar metas e resultados." icone="chart" />
          )}
          {r?.observacoes && <p className="texto-suave observacao">{r.observacoes}</p>}
        </section>

        <section className="painel">
          <div className="painel__topo">
            <h2 className="painel__titulo">Aprendizados da campanha</h2>
            <span className="painel__icone painel__icone--amarelo"><Icone nome="sparkles" /></span>
          </div>
          <label className="campo">
            <span className="visualmente-oculto">Aprendizados</span>
            <textarea className="entrada" value={aprendizados} onChange={(e) => setAprendizados(e.target.value)} readOnly={!editavel} placeholder="O que funcionou bem? O que mudar na próxima edição?" />
          </label>
          <p className="so-impressao">{aprendizados}</p>
          {editavel && <button type="button" className="btn btn--contorno" onClick={() => salvarResultado({ aprendizados })}>Salvar aprendizados</button>}
        </section>
      </div>
      <p className="nota-seguranca">Dados agregados informados pela equipe. A plataforma não armazena dados de pacientes nem acessa contas bancárias.</p>

      <Modal titulo="Atualizar números" aberto={editar} aoFechar={() => setEditar(false)}>
        <FormNumeros inicial={r} aoSalvar={async (d) => (await salvarResultado(d)) && setEditar(false)} aoCancelar={() => setEditar(false)} />
      </Modal>
    </>
  );
}

function Kpi({ icone, rotulo, valor, sub, pctTexto }: { icone: string; rotulo: string; valor: string; sub: string; pctTexto: string }) {
  return (
    <div className="indicador indicador--kpi">
      <span className="indicador__icone"><Icone nome={icone} /></span>
      <div>
        <span className="indicador__rotulo">{rotulo}</span>
        <strong>{valor}</strong>
        <small>{sub}</small>
      </div>
      {pctTexto && <span className="indicador__pct">{pctTexto}</span>}
    </div>
  );
}

function FormNumeros({ inicial, aoSalvar, aoCancelar }: { inicial?: Resultado; aoSalvar: (d: Partial<Resultado>) => void; aoCancelar: () => void }) {
  const [d, setD] = useState<Partial<Resultado>>({
    participantes: inicial?.participantes || 0, meta_participantes: inicial?.meta_participantes || 0, camisas: inicial?.camisas || 0,
    meta_camisas: inicial?.meta_camisas || 0, valor_arrecadado: inicial?.valor_arrecadado || 0, meta_valor: inicial?.meta_valor || 0, observacoes: inicial?.observacoes || '',
  });
  const num = (k: keyof Resultado, r: string) => (
    <label className="campo"><span>{r}</span><input className="entrada" type="number" min={0} step="1" value={(d as any)[k]} onChange={(e) => setD({ ...d, [k]: Number(e.target.value) || 0 })} /></label>
  );
  return (
    <form className="form-modal" onSubmit={(e: FormEvent) => { e.preventDefault(); aoSalvar(d); }}>
      <div className="grade-form">
        {num('participantes', 'Participantes')}{num('meta_participantes', 'Meta de participantes')}
        {num('camisas', 'Camisas vendidas')}{num('meta_camisas', 'Meta de camisas')}
        {num('valor_arrecadado', 'Valor arrecadado (R$)')}{num('meta_valor', 'Meta de arrecadação (R$)')}
        <label className="campo inteiro"><span>Observações</span><textarea className="entrada entrada--baixa" value={d.observacoes} onChange={(e) => setD({ ...d, observacoes: e.target.value })} /></label>
      </div>
      <p className="faixa-info"><Icone nome="lock" tamanho={16} /> Informe apenas totais agregados. Não registre nomes de doadores, dados de pacientes ou dados bancários.</p>
      <div className="acoes-form">
        <button type="button" className="btn btn--contorno" onClick={aoCancelar}>Cancelar</button>
        <button className="btn btn--primario">Salvar</button>
      </div>
    </form>
  );
}
