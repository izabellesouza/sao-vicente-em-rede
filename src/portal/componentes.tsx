// Peças compartilhadas pelas páginas do portal público.
import { useState } from 'react';
import { Link } from '../lib/router';
import { Icone } from '../lib/icons';
import { SeloMes, Selo } from '../lib/ui';
import { mesCurto, periodo } from '../lib/format';
import { ROTULO_SITUACAO, situacaoPublica } from '../lib/dados';
import type { Campanha } from '../lib/types';

const COR_SITUACAO = { planejada: 'amarelo', em_andamento: 'verde', encerrada: 'cinza' } as const;

export function SeloSituacao({ campanha }: { campanha: Campanha }) {
  const s = situacaoPublica(campanha);
  return <Selo cor={COR_SITUACAO[s]}>{ROTULO_SITUACAO[s]}</Selo>;
}

export function CartaoCampanha({ campanha }: { campanha: Campanha }) {
  return (
    <article className="cartao-campanha">
      <div className="cartao-campanha__topo">
        <SeloMes rotulo={mesCurto(campanha.inicio)} cor={campanha.cor} />
        <SeloSituacao campanha={campanha} />
      </div>
      <h3>{campanha.titulo}</h3>
      <p>{campanha.resumo}</p>
      <div className="cartao-campanha__data">
        <Icone nome="calendar" tamanho={16} />
        {periodo(campanha.inicio, campanha.fim)}
      </div>
      <Link className="link-seta cartao-campanha__link" to={`/portal/campanhas/${campanha.slug}`}>
        Ver campanha <Icone nome="arrow-right" tamanho={16} />
        <span className="visualmente-oculto">: {campanha.titulo}</span>
      </Link>
    </article>
  );
}

export function CabecalhoPagina({ etiqueta, titulo, texto }: { etiqueta: string; titulo: string; texto: string }) {
  return (
    <section className="cabecalho-pagina">
      <div className="container">
        <p className="etiqueta">{etiqueta}</p>
        <h1>{titulo}</h1>
        <p>{texto}</p>
      </div>
    </section>
  );
}

/** Foto da equipe (public/imagens/equipe.jpg). Se não existir, mostra uma ilustração. */
export function FotoEquipe({ className = '', alt = 'Equipe do hospital trabalhando junto em uma campanha' }: { className?: string; alt?: string }) {
  const [falhou, setFalhou] = useState(false);
  if (falhou)
    return (
      <div className={`${className} ilustracao`} role="img" aria-label="Ilustração: rede de cuidado conectando pessoas">
        <span className="ilustracao__c1" />
        <span className="ilustracao__c2" />
        <span className="ilustracao__coracao"><Icone nome="heart" tamanho={64} /></span>
        <span className="ilustracao__no ilustracao__no--1"><Icone nome="users" tamanho={22} /></span>
        <span className="ilustracao__no ilustracao__no--2"><Icone nome="megaphone" tamanho={22} /></span>
        <span className="ilustracao__no ilustracao__no--3"><Icone nome="calendar" tamanho={22} /></span>
      </div>
    );
  return <img className={className} src="/imagens/equipe.jpg" alt={alt} onError={() => setFalhou(true)} />;
}

export const FILTROS = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'planejada', rotulo: 'Planejada' },
  { id: 'em_andamento', rotulo: 'Em andamento' },
  { id: 'encerrada', rotulo: 'Encerrada' },
] as const;

export function FiltroSituacao({ valor, aoMudar }: { valor: string; aoMudar: (v: string) => void }) {
  return (
    <div className="filtro" role="group" aria-label="Filtrar por situação">
      <span>Filtrar por situação:</span>
      {FILTROS.map((f) => (
        <button key={f.id} type="button" className={`chip ${valor === f.id ? 'chip--ativo' : ''}`} aria-pressed={valor === f.id} onClick={() => aoMudar(f.id)}>
          {f.rotulo}
        </button>
      ))}
    </div>
  );
}
