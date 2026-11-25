// Usuários e perfis de acesso.
import { useState, type FormEvent } from 'react';
import { Icone } from '../lib/icons';
import { FUNCOES, SENHA_DEMO, pode, useAuth } from '../lib/auth';
import { MODO, atualizar, inserir, listar, supabaseSemSessao } from '../lib/backend';
import { Avatar, Modal, Selo, avisar } from '../lib/ui';
import { registrar } from '../lib/dados';
import { dataHora } from '../lib/format';
import type { Funcao, Perfil } from '../lib/types';
import { TituloPagina, usePerfis } from './OrganizadorLayout';

const ORDEM: Funcao[] = ['marketing', 'producao', 'admin', 'visualizador'];

export default function Usuarios() {
  const { perfil } = useAuth();
  const { lista } = usePerfis();
  const [novo, setNovo] = useState(false);
  const admin = pode.gerenciarUsuarios(perfil);

  async function mudar(p: Perfil, mudancas: Partial<Perfil>) {
    if (p.id === perfil!.id && (mudancas.funcao || mudancas.ativo === false)) return avisar('Você não pode alterar o seu próprio perfil de acesso.', 'erro');
    try {
      await atualizar<Perfil>('perfis', p.id, mudancas);
      await registrar(perfil!.id, 'alterou o acesso de um usuário', p.nome, null);
      avisar('Acesso atualizado.');
    } catch (e: any) {
      avisar(e.message, 'erro');
    }
  }

  return (
    <>
      <TituloPagina titulo="Usuários e perfis" texto="Gerencie acessos e permissões do organizador.">
        {admin && <button type="button" className="btn btn--primario" onClick={() => setNovo(true)}>Adicionar usuário <Icone nome="plus" /></button>}
      </TituloPagina>

      <div className="indicadores">
        {ORDEM.map((f) => {
          const pessoas = lista.filter((p) => p.funcao === f && p.ativo);
          return (
            <div key={f} className="cartao-perfil">
              <Avatar nome={pessoas[0]?.nome || FUNCOES[f].rotulo} cor={FUNCOES[f].cor} tamanho={40} />
              <div>
                <Selo cor={FUNCOES[f].cor === 'coral' ? 'coral' : 'azul'}>{FUNCOES[f].rotulo}</Selo>
                <b>{pessoas.length ? pessoas.map((p) => p.nome.split(' ')[0]).join(', ') : 'Ninguém'}</b>
                <small>{FUNCOES[f].descricao}</small>
              </div>
            </div>
          );
        })}
      </div>

      <div className="tabela-caixa">
        <table className="tabela">
          <thead>
            <tr><th>Nome</th><th>Perfil</th><th>Situação</th><th>Último acesso</th>{admin && <th>Ações</th>}</tr>
          </thead>
          <tbody>
            {lista.sort((a, b) => a.nome.localeCompare(b.nome)).map((p) => (
              <tr key={p.id}>
                <td><span className="celula-pessoa"><Avatar nome={p.nome} tamanho={32} /> <span><b>{p.nome}</b><small className="bloco">{p.email}</small></span></span></td>
                <td>
                  {admin && p.id !== perfil!.id ? (
                    <select className="entrada entrada--auto entrada--pequena" value={p.funcao} onChange={(e) => mudar(p, { funcao: e.target.value as Funcao })} aria-label={`Perfil de ${p.nome}`}>
                      {ORDEM.map((f) => <option key={f} value={f}>{FUNCOES[f].rotulo}</option>)}
                    </select>
                  ) : FUNCOES[p.funcao].rotulo}
                </td>
                <td><Selo cor={p.ativo ? 'verde' : 'cinza'}>{p.ativo ? 'Ativo' : 'Inativo'}</Selo></td>
                <td>{p.ultimo_acesso ? dataHora(p.ultimo_acesso) : 'Nunca acessou'}</td>
                {admin && (
                  <td>{p.id !== perfil!.id && <button type="button" className="btn btn--contorno btn--pequeno" onClick={() => mudar(p, { ativo: !p.ativo })}>{p.ativo ? 'Desativar' : 'Reativar'}</button>}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!admin && <p className="faixa-info"><Icone nome="lock" tamanho={16} /> Somente o administrador pode criar contas e alterar perfis.</p>}

      <Modal titulo="Adicionar usuário" aberto={novo} aoFechar={() => setNovo(false)}>
        <FormUsuario aoFechar={() => setNovo(false)} />
      </Modal>
    </>
  );
}

function FormUsuario({ aoFechar }: { aoFechar: () => void }) {
  const { perfil } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [funcao, setFuncao] = useState<Funcao>('producao');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function criar(e: FormEvent) {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!nome.trim() || !em) return setErro('Informe nome e e-mail.');
    setEnviando(true);
    setErro('');
    try {
      if (MODO === 'demo') {
        const [existe] = await listar<Perfil>('perfis', { email: em });
        if (existe) throw new Error('Já existe um usuário com este e-mail.');
        await inserir<Perfil>('perfis', { nome: nome.trim(), email: em, funcao, ativo: true, ultimo_acesso: null });
      } else {
        if (senha.length < 6) throw new Error('A senha temporária precisa ter pelo menos 6 caracteres.');
        const sb = await supabaseSemSessao();
        const { data, error } = await sb.auth.signUp({ email: em, password: senha, options: { data: { nome: nome.trim() } } });
        if (error) throw new Error(/registered/i.test(error.message) ? 'Já existe um usuário com este e-mail.' : error.message);
        // O perfil é criado automaticamente (gatilho no banco); aqui definimos nome e função.
        await new Promise((r) => setTimeout(r, 600));
        await atualizar<Perfil>('perfis', data.user.id, { nome: nome.trim(), funcao, ativo: true });
      }
      await registrar(perfil!.id, 'criou o acesso de', `${nome.trim()} (${FUNCOES[funcao].rotulo})`, null);
      avisar('Usuário criado.');
      aoFechar();
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="form-modal" onSubmit={criar}>
      <div className="grade-form">
        <label className="campo inteiro"><span>Nome</span><input className="entrada" value={nome} onChange={(e) => setNome(e.target.value)} required /></label>
        <label className="campo inteiro"><span>E-mail</span><input className="entrada" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        {MODO === 'supabase' ? (
          <label className="campo inteiro"><span>Senha temporária</span><input className="entrada" type="text" value={senha} onChange={(e) => setSenha(e.target.value)} minLength={6} required /><small>Entregue à pessoa com segurança e oriente a trocá-la.</small></label>
        ) : (
          <p className="faixa-info inteiro"><Icone nome="lock" tamanho={16} /> No modo demonstração, a senha de todas as contas é “{SENHA_DEMO}”.</p>
        )}
        <label className="campo inteiro"><span>Perfil de acesso</span>
          <select className="entrada" value={funcao} onChange={(e) => setFuncao(e.target.value as Funcao)}>
            {ORDEM.map((f) => <option key={f} value={f}>{FUNCOES[f].rotulo} — {FUNCOES[f].descricao}</option>)}
          </select>
        </label>
      </div>
      {erro && <p className="erro-form" role="alert">{erro}</p>}
      <div className="acoes-form">
        <button type="button" className="btn btn--contorno" onClick={aoFechar}>Cancelar</button>
        <button className="btn btn--primario" disabled={enviando}>{enviando ? 'Criando…' : 'Criar usuário'}</button>
      </div>
    </form>
  );
}
