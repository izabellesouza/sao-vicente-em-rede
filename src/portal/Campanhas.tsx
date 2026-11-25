// Lista de campanhas publicadas, com filtro por situação.
import { useState } from 'react';
import { Carregando, Vazio } from '../lib/ui';
import { ordenarPorData, situacaoPublica, useConfig, useTabela } from '../lib/dados';
import type { Campanha } from '../lib/types';
import { CabecalhoPagina, CartaoCampanha, FiltroSituacao } from './componentes';

export default function Campanhas() {
  const cfg = useConfig();
  const [filtro, setFiltro] = useState('todas');
  const { dados, carregando } = useTabela<Campanha>('campanhas', { publicado: true });
  const lista = [...dados].sort(ordenarPorData).filter((c) => filtro === 'todas' || situacaoPublica(c) === filtro);

  return (
    <>
      <CabecalhoPagina etiqueta="Nossas campanhas" titulo="Mobilização que transforma" texto={`Conheça, acompanhe e participe das ações promovidas pelo ${cfg.instituicao}.`} />
      <section className="secao">
        <div className="container">
          <FiltroSituacao valor={filtro} aoMudar={setFiltro} />
          {carregando ? (
            <Carregando />
          ) : lista.length ? (
            <div className="grade-cartoes" aria-live="polite">{lista.map((c) => <CartaoCampanha key={c.id} campanha={c} />)}</div>
          ) : (
            <Vazio titulo="Nenhuma campanha nesta situação" texto="Tente outro filtro para ver mais campanhas." icone="search" />
          )}
        </div>
      </section>
    </>
  );
}
