// Fila de aprovações.
import { Link } from '../lib/router';
import { Icone } from '../lib/icons';
import { pode, useAuth } from '../lib/auth';
import { PreviaMaterial, Selo, Vazio } from '../lib/ui';
import { ROTULO_MATERIAL, useTabela } from '../lib/dados';
import { dataHora, doisDigitos } from '../lib/format';
import type { Campanha, Material } from '../lib/types';
import { TituloPagina, usePerfis } from './OrganizadorLayout';

export default function Aprovacoes() {
  const { perfil } = useAuth();
  const { nome } = usePerfis();
  const { dados: campanhas } = useTabela<Campanha>('campanhas');
  const { dados: materiais } = useTabela<Material>('materiais');
  const camp = (id: string) => campanhas.find((c) => c.id === id);
  const ordenar = (a: Material, b: Material) => (b.atualizado_em || '').localeCompare(a.atualizado_em || '');

  const fila = materiais.filter((m) => m.status === 'aguardando_aprovacao').sort(ordenar);
  const ajustes = materiais.filter((m) => m.status === 'ajuste_solicitado').sort(ordenar);
  const aprovados = materiais.filter((m) => m.status === 'aprovado').sort(ordenar).slice(0, 6);

  const Linha = ({ m }: { m: Material }) => {
    const c = camp(m.campanha_id);
    const st = ROTULO_MATERIAL[m.status];
    return (
      <li>
        <Link to={`/organizador/aprovacoes/${m.id}`} className="linha-aprovacao">
          <span className="linha-aprovacao__mini"><PreviaMaterial titulo={c?.titulo || ''} cor={c?.cor} url={m.arquivo_url} /></span>
          <span className="linha-aprovacao__texto">
            <b>{m.titulo}</b>
            <small>{c?.titulo} • V{doisDigitos(m.versao)} • enviado por {nome(m.autor_id).split(' ')[0]} em {dataHora(m.atualizado_em || m.criado_em)}</small>
          </span>
          <Selo cor={st.classe}>{st.rotulo}</Selo>
          <Icone nome="arrow-right" />
        </Link>
      </li>
    );
  };

  return (
    <>
      <TituloPagina titulo="Aprovações" texto={pode.aprovar(perfil) ? 'Revise os materiais antes da publicação. Somente conteúdo aprovado chega ao portal.' : 'Acompanhe a situação dos materiais enviados.'} />
      <section className="painel">
        <h2 className="painel__titulo painel__titulo--pequeno">Aguardando aprovação ({fila.length})</h2>
        {fila.length ? <ul className="lista-aprovacoes">{fila.map((m) => <Linha key={m.id} m={m} />)}</ul> : <Vazio titulo="Nenhum material aguardando" texto="Tudo revisado por enquanto." icone="check" />}
      </section>
      {ajustes.length > 0 && (
        <section className="painel">
          <h2 className="painel__titulo painel__titulo--pequeno">Com ajuste solicitado ({ajustes.length})</h2>
          <ul className="lista-aprovacoes">{ajustes.map((m) => <Linha key={m.id} m={m} />)}</ul>
        </section>
      )}
      {aprovados.length > 0 && (
        <section className="painel">
          <h2 className="painel__titulo painel__titulo--pequeno">Aprovados recentemente</h2>
          <ul className="lista-aprovacoes">{aprovados.map((m) => <Linha key={m.id} m={m} />)}</ul>
        </section>
      )}
    </>
  );
}
