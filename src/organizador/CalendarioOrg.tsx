// Calendário anual interno: campanhas e prazos de tarefas por mês.
import { useState } from 'react';
import { Link } from '../lib/router';
import { Icone } from '../lib/icons';
import { situacaoInterna, useTabela } from '../lib/dados';
import { MESES, partes } from '../lib/format';
import type { Campanha, Tarefa } from '../lib/types';
import { TituloPagina } from './OrganizadorLayout';

export default function CalendarioOrg() {
  const [ano, setAno] = useState(new Date().getFullYear());
  const { dados: campanhas } = useTabela<Campanha>('campanhas');
  const { dados: tarefas } = useTabela<Tarefa>('tarefas');
  const mesAtual = new Date().getFullYear() === ano ? new Date().getMonth() : -1;

  const noMes = (c: Campanha, m: number) => {
    const a = partes(c.inicio), b = partes(c.fim);
    const alvo = ano * 12 + m;
    return alvo >= a.ano * 12 + a.mes && alvo <= b.ano * 12 + b.mes;
  };

  return (
    <>
      <TituloPagina titulo="Calendário anual" texto="Visão do ano para planejar as campanhas com antecedência.">
        <div className="seletor-ano">
          <button type="button" className="btn-icone btn-icone--borda" onClick={() => setAno(ano - 1)} aria-label="Ano anterior"><Icone nome="arrow-left" /></button>
          <strong aria-live="polite">{ano}</strong>
          <button type="button" className="btn-icone btn-icone--borda" onClick={() => setAno(ano + 1)} aria-label="Próximo ano"><Icone nome="arrow-right" /></button>
        </div>
      </TituloPagina>
      <div className="calendario-ano">
        {MESES.map((nomeMes, m) => {
          const doMes = campanhas.filter((c) => noMes(c, m));
          const prazos = tarefas.filter((t) => t.prazo && t.status !== 'concluido' && partes(t.prazo).ano === ano && partes(t.prazo).mes === m);
          return (
            <section key={nomeMes} className={`mes-caixa ${m === mesAtual ? 'mes-caixa--atual' : ''}`} aria-label={nomeMes}>
              <h2>{nomeMes}</h2>
              {doMes.length === 0 && <p className="texto-suave mes-caixa__vazio">Sem campanhas</p>}
              {doMes.map((c) => (
                <Link key={c.id} to={`/organizador/campanhas/${c.id}`} className="mes-campanha" style={{ ['--cor' as any]: c.cor }}>
                  <b>{c.titulo}</b>
                  <small>{situacaoInterna(c).rotulo}</small>
                </Link>
              ))}
              {prazos.length > 0 && (
                <Link to="/organizador/tarefas" className="mes-prazos"><Icone nome="clock" tamanho={14} /> {prazos.length} {prazos.length === 1 ? 'prazo pendente' : 'prazos pendentes'}</Link>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
