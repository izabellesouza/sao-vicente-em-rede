// Visão geral: resumo das campanhas, prazos e movimentações.
import { Link } from '../lib/router';
import { Icone } from '../lib/icons';
import { pode, useAuth } from '../lib/auth';
import { Avatar, Selo, Vazio } from '../lib/ui';
import { ETAPAS, atrasada, ordenarPorData, progresso, situacaoPublica, useTabela } from '../lib/dados';
import { dia2, diasAte, doisDigitos, hojePorExtenso, mesCurto, tempoRelativo } from '../lib/format';
import type { Atividade, Campanha, Material, Tarefa } from '../lib/types';
import { TituloPagina, usePerfis } from './OrganizadorLayout';

export default function VisaoGeral() {
  const { perfil } = useAuth();
  const { nome } = usePerfis();
  const { dados: campanhas } = useTabela<Campanha>('campanhas');
  const { dados: tarefas } = useTabela<Tarefa>('tarefas');
  const { dados: materiais } = useTabela<Material>('materiais');
  const { dados: atividades } = useTabela<Atividade>('atividades');

  const ativas = campanhas.filter((c) => situacaoPublica(c) !== 'encerrada').sort(ordenarPorData);
  const emAndamento = ativas.filter((c) => situacaoPublica(c) === 'em_andamento');
  const pendentes = tarefas.filter((t) => t.status !== 'concluido');
  const comPrazo = pendentes.filter((t) => t.prazo).sort((a, b) => a.prazo!.localeCompare(b.prazo!));
  const proximos7 = comPrazo.filter((t) => diasAte(t.prazo!) <= 7);
  const urgentes = comPrazo.filter((t) => diasAte(t.prazo!) <= 2);
  const aguardando = materiais.filter((m) => m.status === 'aguardando_aprovacao');

  // Campanha em foco: a que tem mais tarefas pendentes entre as ativas.
  const foco = [...ativas].sort((a, b) => pendentes.filter((t) => t.campanha_id === b.id).length - pendentes.filter((t) => t.campanha_id === a.id).length)[0];
  const tarefasFoco = tarefas.filter((t) => t.campanha_id === foco?.id);
  const pctFoco = progresso(tarefasFoco);
  const marco = tarefasFoco.filter((t) => t.status !== 'concluido' && t.prazo).sort((a, b) => a.prazo!.localeCompare(b.prazo!))[0];

  const recentes = [...atividades].sort((a, b) => (b.criado_em || '').localeCompare(a.criado_em || '')).slice(0, 5);

  return (
    <>
      <p className="etiqueta etiqueta--cinza">{hojePorExtenso()}</p>
      <TituloPagina titulo={`Olá, ${perfil!.nome.split(' ')[0]}.`} texto="Aqui está um resumo das campanhas e prioridades de hoje.">
        {pode.editarCampanhas(perfil) && (
          <Link to="/organizador/campanhas/nova" className="btn btn--primario">Criar nova campanha <Icone nome="plus" /></Link>
        )}
      </TituloPagina>

      <div className="indicadores">
        <Indicador icone="megaphone" rotulo="Campanhas ativas" valor={ativas.length} sub={`${emAndamento.length} em andamento`} cor="marinho" />
        <Indicador icone="tasks" rotulo="Tarefas pendentes" valor={pendentes.length} sub={`${urgentes.length} com prazo próximo`} cor="amarelo" />
        <Indicador icone="approve" rotulo="Aguardando aprovação" valor={aguardando.length} sub={aguardando.length ? 'Sua atenção é necessária' : 'Nada pendente'} cor="coral" />
        <Indicador icone="clock" rotulo="Próximos prazos" valor={proximos7.length} sub="Nos próximos 7 dias" cor="verde" />
      </div>

      <div className="grade-painel">
        <section className="painel">
          {foco ? (
            <>
              <div className="painel__topo">
                <Selo cor="azul">Campanha em foco</Selo>
                <Link to={`/organizador/campanhas/${foco.id}`} className="link-seta">Ver detalhes <Icone nome="arrow-right" tamanho={16} /></Link>
              </div>
              <h2 className="painel__titulo">{foco.titulo}</h2>
              <div className="foco">
                <Rosca valor={pctFoco} />
                <div className="foco__barras">
                  {ETAPAS.map((e) => {
                    const daEtapa = tarefasFoco.filter((t) => t.etapa === e.id);
                    const v = daEtapa.length ? progresso(daEtapa) : 0;
                    return (
                      <div key={e.id} className="barra-rotulada">
                        <div><span>{e.rotulo}</span><b>{daEtapa.length ? `${v}%` : '—'}</b></div>
                        <div className="barra" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={e.rotulo}><i style={{ width: `${v}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {marco && (
                <div className="marco">
                  <Icone nome="calendar" />
                  <div><small>Próximo marco</small><strong>{marco.titulo}</strong></div>
                  <b>{dia2(marco.prazo!)} {mesCurto(marco.prazo!)}</b>
                </div>
              )}
            </>
          ) : (
            <Vazio titulo="Nenhuma campanha ativa" texto="Crie uma campanha para começar o planejamento." icone="megaphone" />
          )}
        </section>

        <section className="painel">
          <div className="painel__topo">
            <p className="etiqueta">Próximos prazos</p>
            <Link to="/organizador/tarefas" className="link-seta">Ver todos</Link>
          </div>
          <h2 className="painel__titulo">Esta semana</h2>
          {comPrazo.length ? (
            <ul className="lista-prazos">
              {comPrazo.slice(0, 5).map((t) => (
                <li key={t.id}>
                  <Link to="/organizador/tarefas">
                    <span className={`data-bloco ${atrasada(t) ? 'data-bloco--atraso' : diasAte(t.prazo!) <= 2 ? 'data-bloco--alerta' : ''}`}>
                      {dia2(t.prazo!)}<small>{mesCurto(t.prazo!)}</small>
                    </span>
                    <span>
                      <b>{t.titulo}</b>
                      <small>{atrasada(t) ? 'Atrasada • ' : ''}{nome(t.responsavel_id).split(' ')[0]}</small>
                    </span>
                    <Icone nome="arrow-right" tamanho={16} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Vazio titulo="Sem prazos pendentes" icone="check" />
          )}
        </section>

        <section className="painel">
          <p className="etiqueta">Movimentações</p>
          <h2 className="painel__titulo">Atividades recentes</h2>
          {recentes.length ? (
            <ul className="lista-atividades">
              {recentes.map((a) => (
                <li key={a.id}>
                  <Avatar nome={nome(a.usuario_id)} tamanho={36} />
                  <span>
                    <b>{nome(a.usuario_id).split(' ')[0]} {a.acao}</b>
                    <small>{a.detalhe}</small>
                  </span>
                  <small>{tempoRelativo(a.criado_em)}</small>
                </li>
              ))}
            </ul>
          ) : (
            <Vazio titulo="Nenhuma movimentação ainda" icone="clock" />
          )}
        </section>

        <section className={`painel ${urgentes.length ? 'painel--atencao' : 'painel--ok'}`}>
          <span className="painel__icone"><Icone nome={urgentes.length ? 'clock' : 'check'} /></span>
          <Selo cor={urgentes.length ? 'vermelho' : 'verde'}>{urgentes.length ? 'Atenção' : 'Tudo em dia'}</Selo>
          <h2 className="painel__titulo">
            {urgentes.length ? `${doisDigitos(urgentes.length)} ${urgentes.length === 1 ? 'tarefa vence' : 'tarefas vencem'} nas próximas 48 horas ou estão atrasadas.` : 'Nenhuma tarefa vence nas próximas 48 horas.'}
          </h2>
          <p className="texto-suave">Revise as prioridades da campanha para evitar atrasos.</p>
          <Link to="/organizador/tarefas" className="btn btn--coral btn--pequeno">Revisar tarefas</Link>
        </section>
      </div>
    </>
  );
}

function Indicador({ icone, rotulo, valor, sub, cor }: { icone: string; rotulo: string; valor: number; sub: string; cor: string }) {
  return (
    <div className="indicador">
      <span className={`indicador__icone indicador__icone--${cor}`}><Icone nome={icone} /></span>
      <span className="indicador__rotulo">{rotulo}</span>
      <strong>{doisDigitos(valor)}</strong>
      <small>{sub}</small>
    </div>
  );
}

export function Rosca({ valor, tamanho = 140 }: { valor: number; tamanho?: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="rosca" style={{ width: tamanho, height: tamanho }} role="img" aria-label={`${valor}% concluído`}>
      <svg viewBox="0 0 120 120" width={tamanho} height={tamanho}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e3eef1" strokeWidth="12" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1a6b86" strokeWidth="12" strokeDasharray={`${(valor / 100) * c} ${c}`} transform="rotate(-90 60 60)" strokeLinecap="round" />
      </svg>
      <span><b>{valor}%</b><small>concluído</small></span>
    </div>
  );
}
