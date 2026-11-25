// Configurações: dados institucionais e formas oficiais de apoio.
import { useEffect, useState, type FormEvent } from 'react';
import { Icone } from '../lib/icons';
import { pode, useAuth } from '../lib/auth';
import { MODO, atualizar, inserir, remover, restaurarDemonstracao } from '../lib/backend';
import { Modal, Selo, avisar } from '../lib/ui';
import { registrar, useConfig, useTabela } from '../lib/dados';
import type { Configuracao, FormaApoio } from '../lib/types';
import { TituloPagina } from './OrganizadorLayout';

export default function Configuracoes() {
  const { perfil } = useAuth();
  const cfg = useConfig();
  const [d, setD] = useState<Configuracao>(cfg);
  useEffect(() => setD(cfg), [JSON.stringify(cfg)]);
  const editaInstituicao = perfil?.funcao === 'admin';
  const { dados: formas } = useTabela<FormaApoio>('formas_apoio');
  const [forma, setForma] = useState<Partial<FormaApoio> | null>(null);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    try {
      await atualizar<Configuracao>('configuracoes', 1, { ...d, whatsapp: d.whatsapp.replace(/\D/g, '') });
      await registrar(perfil!.id, 'atualizou os dados institucionais', '', null);
      avisar('Dados institucionais salvos.');
    } catch (err: any) {
      avisar(err.message, 'erro');
    }
  }

  const campo = (k: keyof Configuracao, r: string, ajuda?: string, inteiro = false) => (
    <label className={`campo ${inteiro ? 'inteiro' : ''}`}>
      <span>{r}</span>
      <input className="entrada" value={(d as any)[k] || ''} onChange={(e) => setD({ ...d, [k]: e.target.value })} />
      {ajuda && <small>{ajuda}</small>}
    </label>
  );

  return (
    <>
      <TituloPagina titulo="Configurações" texto="Dados exibidos no portal e canais oficiais de apoio." />

      <form className="painel" onSubmit={salvar}>
        <h2 className="painel__titulo painel__titulo--pequeno">Dados institucionais</h2>
        <fieldset disabled={!editaInstituicao} className="sem-borda">
          <div className="grade-form">
            {campo('instituicao', 'Nome da instituição', undefined, true)}
            {campo('cidade', 'Cidade • Estado')}
            {campo('telefone', 'Telefone')}
            {campo('whatsapp', 'WhatsApp oficial', 'Com DDI e DDD, só números. Ex.: 5583999999999')}
            {campo('email', 'E-mail institucional')}
            {campo('endereco', 'Endereço', undefined, true)}
            {campo('instagram', 'Link do Instagram')}
            {campo('facebook', 'Link do Facebook')}
            {campo('mapa_url', 'Link do mapa (Google Maps)', undefined, true)}
          </div>
          {editaInstituicao ? (
            <div className="acoes-form"><button className="btn btn--primario">Salvar dados</button></div>
          ) : (
            <p className="faixa-info"><Icone nome="lock" tamanho={16} /> Somente o administrador altera os dados institucionais.</p>
          )}
        </fieldset>
      </form>

      <section className="painel">
        <div className="painel__topo">
          <h2 className="painel__titulo painel__titulo--pequeno">Formas oficiais de apoio</h2>
          {pode.configurar(perfil) && <button type="button" className="btn btn--primario btn--pequeno" onClick={() => setForma({ tipo: 'whatsapp', titulo: '', descricao: '', link: '', ativo: true })}><Icone nome="plus" /> Nova forma</button>}
        </div>
        <p className="texto-suave">Somente links institucionais validados pelo hospital. A plataforma não recebe pagamentos.</p>
        <ul className="lista-formas">
          {formas.map((f) => (
            <li key={f.id}>
              <span><b>{f.titulo}</b><small>{f.descricao}</small><a href={f.link} target="_blank" rel="noopener noreferrer">{f.link}</a></span>
              <Selo cor={f.ativo ? 'verde' : 'cinza'}>{f.ativo ? 'Ativa' : 'Inativa'}</Selo>
              {pode.configurar(perfil) && <button type="button" className="btn btn--contorno btn--pequeno" onClick={() => setForma(f)}>Editar</button>}
            </li>
          ))}
        </ul>
      </section>

      {MODO === 'demo' && (
        <section className="painel">
          <h2 className="painel__titulo painel__titulo--pequeno">Modo demonstração</h2>
          <p className="texto-suave">Os dados estão salvos só neste navegador. Para recomeçar uma apresentação ou um teste, restaure os dados de exemplo.</p>
          <button type="button" className="btn btn--perigo" onClick={() => confirm('Apagar as alterações deste navegador e restaurar os dados de exemplo?') && (restaurarDemonstracao(), avisar('Dados de demonstração restaurados.'))}>
            <Icone nome="refresh" /> Restaurar dados de demonstração
          </button>
        </section>
      )}

      <Modal titulo={forma?.id ? 'Editar forma de apoio' : 'Nova forma de apoio'} aberto={!!forma} aoFechar={() => setForma(null)}>
        {forma && <FormForma forma={forma} aoFechar={() => setForma(null)} />}
      </Modal>
    </>
  );
}

function FormForma({ forma, aoFechar }: { forma: Partial<FormaApoio>; aoFechar: () => void }) {
  const [f, setF] = useState(forma);
  const [erro, setErro] = useState('');
  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!f.titulo?.trim() || !f.link?.trim()) return setErro('Informe título e link.');
    if (!/^(https:\/\/|tel:|mailto:)/.test(f.link.trim())) return setErro('Use um link seguro (https://), tel: ou mailto:.');
    try {
      const dados = { tipo: f.tipo, titulo: f.titulo.trim(), descricao: f.descricao || '', link: f.link.trim(), ativo: !!f.ativo };
      if (f.id) await atualizar('formas_apoio', f.id, dados);
      else await inserir('formas_apoio', dados);
      avisar('Forma de apoio salva.');
      aoFechar();
    } catch (err: any) {
      setErro(err.message);
    }
  }
  async function excluir() {
    if (!f.id || !confirm('Excluir esta forma de apoio?')) return;
    try {
      await remover('campanha_apoio', { apoio_id: f.id });
      await remover('formas_apoio', { id: f.id });
      aoFechar();
    } catch (err: any) {
      setErro(err.message);
    }
  }
  return (
    <form className="form-modal" onSubmit={salvar}>
      <div className="grade-form">
        <label className="campo"><span>Tipo</span>
          <select className="entrada" value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value as FormaApoio['tipo'] })}>
            <option value="whatsapp">WhatsApp</option><option value="instagram">Instagram</option><option value="doacao">Doação (canal oficial)</option>
            <option value="telefone">Telefone</option><option value="email">E-mail</option><option value="outro">Outro</option>
          </select>
        </label>
        <label className="campo"><span>Título</span><input className="entrada" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} /></label>
        <label className="campo inteiro"><span>Descrição</span><input className="entrada" value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></label>
        <label className="campo inteiro"><span>Link oficial</span><input className="entrada" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="https://wa.me/5583…" /></label>
        <label className="checkbox inteiro"><input type="checkbox" checked={!!f.ativo} onChange={(e) => setF({ ...f, ativo: e.target.checked })} /> Ativa (aparece no portal)</label>
      </div>
      {erro && <p className="erro-form" role="alert">{erro}</p>}
      <div className="acoes-form">
        {f.id && <button type="button" className="btn btn--perigo" onClick={excluir}><Icone nome="trash" /> Excluir</button>}
        <button type="button" className="btn btn--contorno" onClick={aoFechar}>Cancelar</button>
        <button className="btn btn--primario">Salvar</button>
      </div>
    </form>
  );
}
