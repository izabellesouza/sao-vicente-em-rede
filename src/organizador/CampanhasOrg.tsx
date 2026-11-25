// Lista de campanhas do organizador.
import { useState } from 'react';
import { Link } from '../lib/router';
import { Icone } from '../lib/icons';
import { pode, useAuth } from '../lib/auth';
import { Avatar, Carregando, Selo, Vazio } from '../lib/ui';
import { progresso, situacaoInterna, useTabela } from '../lib/dados';
import { MESES, partes, slugify } from '../lib/format';
import type { Campanha, Tarefa } from '../lib/types';
import { TituloPagina, usePerfis } from './OrganizadorLayout';

export default function CampanhasOrg() {
  const { perfil } = useAuth();
  const { nome } = usePerfis();
  const { dados: campanhas, carregando } = useTabela<Campanha>('campanhas');
  const { dados: tarefas } = useTabela<Tarefa>('tarefas');
  const [busca, setBusca] = useState('');
  const [ano, setAno] = useState('todos');
  const [situacao, setSituacao] = useState('todas');

  const anos = [...new Set(campanhas.map((c) => c.inicio.slice(0, 4)))].sort().reverse();
  const lista = campanhas
    .filter((c) => !busca || slugify(c.titulo).includes(slugify(busca)))
    .filter((c) => ano === 'todos' || c.inicio.startsWith(ano))
    .filter((c) => situacao === 'todas' || situacaoInterna(c).rotulo.startsWith(situacao))
    .sort((a, b) => b.inicio.localeCompare(a.inicio));

  return (
    <>
      <TituloPagina titulo="Campanhas" texto="Planeje, acompanhe e mantenha todas as ações organizadas.">
        {pode.editarCampanhas(perfil) && <Link to="/organizador/campanhas/nova" className="btn btn--primario">Nova campanha <Icone nome="plus" /></Link>}
      </TituloPagina>

      <div className="barra-filtros">
        <label className="busca">
          <Icone nome="search" />
          <span className="visualmente-oculto">Buscar campanha</span>
          <input className="entrada" placeholder="Buscar campanha…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
        <select className="entrada" value={ano} onChange={(e) => setAno(e.target.value)} aria-label="Filtrar por ano">
          <option value="todos">Todos os anos</option>
          {anos.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select className="entrada" value={situacao} onChange={(e) => setSituacao(e.target.value)} aria-label="Filtrar por situação">
          <option value="todas">Todas as situações</option>
          <option value="Em preparação">Em preparação</option>
          <option value="Publicada">Publicada</option>
          <option value="Encerrada">Encerrada</option>
        </select>
      </div>

      {carregando ? (
        <Carregando />
      ) : lista.length === 0 ? (
        <div className="painel"><Vazio titulo="Nenhuma campanha encontrada" texto="Ajuste os filtros ou crie uma nova campanha." icone="search" /></div>
      ) : (
        <div className="tabela-caixa">
          <table className="tabela">
            <thead>
              <tr>
                <th>Campanha</th><th>Período</th><th>Responsável</th><th>Progresso</th><th>Situação</th><th><span className="visualmente-oculto">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => {
                const s = situacaoInterna(c);
                const tf = tarefas.filter((t) => t.campanha_id === c.id);
                const v = progresso(tf);
                const evento = c.programacao.find((p) => p.data);
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="celula-campanha">
                        <span className="celula-campanha__icone" style={{ background: c.cor }}><Icone nome="megaphone" tamanho={18} /></span>
                        <span><b>{c.titulo}</b><small>{evento ? `Evento: ${evento.data.split('-').reverse().join('/')}` : c.tipo}</small></span>
                      </div>
                    </td>
                    <td>{MESES[partes(c.inicio).mes].replace(/^./, (x) => x.toUpperCase())} • {partes(c.inicio).ano}</td>
                    <td><span className="celula-pessoa"><Avatar nome={nome(c.responsavel_id)} tamanho={28} /> {nome(c.responsavel_id).split(' ')[0]}</span></td>
                    <td>
                      <span className="celula-progresso">
                        <span className="barra barra--fina" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={`Progresso de ${c.titulo}`}><i style={{ width: `${v}%` }} /></span>
                        <small>{tf.length ? `${v}%` : 'Sem tarefas'}</small>
                      </span>
                    </td>
                    <td><Selo cor={s.classe}>{s.rotulo}</Selo></td>
                    <td><Link to={`/organizador/campanhas/${c.id}`} className="link-seta">Ver campanha <Icone nome="arrow-right" tamanho={16} /><span className="visualmente-oculto"> {c.titulo}</span></Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
