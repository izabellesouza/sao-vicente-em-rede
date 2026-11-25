// Tela de acesso ao organizador interno.
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useRouter } from '../lib/router';
import { Icone, Logo } from '../lib/icons';
import { FUNCOES, SENHA_DEMO, useAuth } from '../lib/auth';
import { MODO } from '../lib/backend';
import { useConfig, useTabela } from '../lib/dados';
import type { Perfil } from '../lib/types';

export default function Login() {
  const { perfil, entrar } = useAuth();
  const { navigate } = useRouter();
  const cfg = useConfig();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { dados: contasDemo } = useTabela<Perfil>('perfis');

  document.title = 'Entrar • Organizador • São Vicente em Rede';

  useEffect(() => {
    if (perfil) navigate('/organizador/visao-geral');
  }, [perfil]);

  async function acessar(e?: FormEvent, emailDireto?: string) {
    e?.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await entrar(emailDireto || email, emailDireto ? SENHA_DEMO : senha);
      navigate('/organizador/visao-geral');
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login">
      <section className="login__arte">
        <Link to="/" className="login__voltar"><Icone nome="arrow-left" tamanho={16} /> Voltar ao projeto</Link>
        <div className="login__arte-logo"><Logo claro /></div>
        <div className="login__arte-texto">
          <span className="pilula pilula--pequena">Organização que acolhe</span>
          <h1>Do planejamento ao impacto, tudo em um só lugar.</h1>
          <p>Campanhas mais organizadas para que o cuidado chegue ainda mais longe.</p>
        </div>
        <small>Organizador interno • Desenvolvido por Thiago</small>
      </section>

      <main className="login__form" id="conteudo">
        <div className="login__caixa">
          <h2>Bem-vindo de volta</h2>
          <p className="texto-suave">Acesse o organizador interno do {cfg.instituicao}.</p>
          <form onSubmit={acessar} className="login__campos">
            <label className="campo">
              <span>E-mail</span>
              <input className="entrada" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="campo">
              <span>Senha</span>
              <span className="senha">
                <input className="entrada" type={verSenha ? 'text' : 'password'} autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
                <button type="button" className="btn-icone" onClick={() => setVerSenha(!verSenha)} aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}>
                  <Icone nome={verSenha ? 'eye-off' : 'eye'} />
                </button>
              </span>
            </label>
            {erro && <p className="erro-form" role="alert">{erro}</p>}
            <button className="btn btn--primario btn--bloco" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
            <p className="login__ajuda">Esqueceu a senha? Fale com o administrador do sistema.</p>
          </form>

          {MODO === 'demo' && contasDemo.length > 0 && (
            <div className="login__demo">
              <p className="login__divisor"><span>Acesso rápido para demonstração</span></p>
              <div className="login__contas">
                {contasDemo.filter((c) => c.ativo).slice(0, 6).map((c) => (
                  <button key={c.id} type="button" className="conta-demo" onClick={() => acessar(undefined, c.email)} disabled={enviando}>
                    <span className={`avatar avatar--${c.funcao === 'marketing' || c.funcao === 'admin' ? 'coral' : 'petroleo'}`} style={{ width: 34, height: 34 }}>{c.nome[0]}</span>
                    <span>
                      <b>Entrar como {c.nome.split(' ')[0]}</b>
                      <small>{FUNCOES[c.funcao].rotulo}</small>
                    </span>
                    <Icone nome="arrow-right" />
                  </button>
                ))}
              </div>
              <p className="nota-seguranca"><Icone nome="lock" tamanho={14} /> Ambiente demonstrativo. Senha das contas: {SENHA_DEMO}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
