// Calendário anual: escolha um mês e/ou uma situação.
import { useState } from 'react';
import { Carregando, Vazio } from '../lib/ui';
import { ordenarPorData, situacaoPublica, useConfig, useTabela } from '../lib/dados';
import { MESES, MESES_CURTOS, partes } from '../lib/format';
import type { Campanha } from '../lib/types';
import { CabecalhoPagina, CartaoCampanha, FiltroSituacao } from './componentes';

/** A campanha acontece (total ou parcialmente) no mês informado? */
const noMes = (c: Campanha, mes: number) => {
  const a = partes(c.inicio);
  const b = partes(c.fim);
  const ini = a.ano * 12 + a.mes;
  const fim = b.ano * 12 + b.mes;
  const alvo = a.ano * 12 + mes;
  return alvo >= ini && alvo <= fim;
};

export default function Calendario() {
  const cfg = useConfig();
  const [filtro, setFiltro] = useState('todas');
  const [mes, setMes] = useState<number | null>(null);
  const { dados, carregando } = useTabela<Campanha>('campanhas', { publicado: true });

  const porSituacao = [...dados].sort(ordenarPorData).filter((c) => filtro === 'todas' || situacaoPublica(c) === filtro);
  const lista = mes === null ? porSituacao : porSituacao.filter((c) => noMes(c, mes));
  const mesesComCampanha = new Set(dados.flatMap((c) => MESES.map((_, i) => (noMes(c, i) ? i : -1)).filter((i) => i >= 0)));

  return (
    <>
      <CabecalhoPagina etiqueta="Calendário anual" titulo="Um ano inteiro de cuidado" texto={`Conheça, acompanhe e participe das ações promovidas pelo ${cfg.instituicao}.`} />
      <section className="secao">
        <div className="container">
          <FiltroSituacao valor={filtro} aoMudar={setFiltro} />
          <div className="meses" role="group" aria-label="Escolher mês">
            {MESES_CURTOS.map((m, i) => (
              <button
                key={m}
                type="button"
                className={`meses__item ${mes === i ? 'ativo' : ''} ${mesesComCampanha.has(i) ? 'tem' : ''}`}
                aria-pressed={mes === i}
                aria-label={`${MESES[i]}${mesesComCampanha.has(i) ? ' (tem campanha)' : ''}`}
                onClick={() => setMes(mes === i ? null : i)}
              >
                {m}
              </button>
            ))}
          </div>
          {mes !== null && (
            <p className="meses__legenda">
              Mostrando campanhas de <strong>{MESES[mes]}</strong>.{' '}
              <button type="button" className="link-seta" onClick={() => setMes(null)}>Ver o ano todo</button>
            </p>
          )}
          {carregando ? (
            <Carregando />
          ) : lista.length ? (
            <div className="grade-cartoes" aria-live="polite">{lista.map((c) => <CartaoCampanha key={c.id} campanha={c} />)}</div>
          ) : (
            <Vazio titulo="Nenhuma campanha neste período" texto="Escolha outro mês ou veja o calendário completo." icone="calendar" />
          )}
        </div>
      </section>
    </>
  );
}
