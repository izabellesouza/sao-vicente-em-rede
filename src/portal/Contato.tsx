// Contato: a mensagem é enviada pelo WhatsApp ou e-mail oficial.
// O portal não armazena dados pessoais (princípio de minimização).
import { useState, type FormEvent } from 'react';
import { Icone } from '../lib/icons';
import { linkWhatsApp, useConfig } from '../lib/dados';
import { CabecalhoPagina } from './componentes';

const ASSUNTOS = ['Participar de uma campanha', 'Apoiar ou contribuir', 'Adquirir camisa da campanha', 'Dúvidas gerais', 'Sugestões'];

export default function Contato() {
  const cfg = useConfig();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [assunto, setAssunto] = useState(ASSUNTOS[0]);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState(false);

  const texto = () => `Olá! Meu nome é ${nome}.\nAssunto: ${assunto}\n\n${mensagem}${email ? `\n\nMeu e-mail: ${email}` : ''}`;

  function enviar(e: FormEvent, canal: 'whatsapp' | 'email') {
    e.preventDefault();
    if (!nome.trim() || !mensagem.trim()) return setErro('Preencha seu nome e a mensagem.');
    setErro('');
    const url =
      canal === 'whatsapp' && cfg.whatsapp
        ? linkWhatsApp(cfg.whatsapp, texto())
        : `mailto:${cfg.email}?subject=${encodeURIComponent(`[São Vicente em Rede] ${assunto}`)}&body=${encodeURIComponent(texto())}`;
    window.open(url, '_blank', 'noopener');
    setEnviado(true);
  }

  return (
    <>
      <CabecalhoPagina etiqueta="Fale conosco" titulo="Estamos aqui para ouvir você." texto="Envie sua mensagem ou utilize um dos nossos canais institucionais." />
      <section className="secao">
        <div className="container contato-grade">
          <form className="cartao-form" onSubmit={(e) => enviar(e, cfg.whatsapp ? 'whatsapp' : 'email')} noValidate>
            <div className="grade-form">
              <label className="campo">
                <span>Nome</span>
                <input className="entrada" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como podemos chamar você?" autoComplete="name" required />
              </label>
              <label className="campo">
                <span>E-mail <small>(opcional)</small></span>
                <input className="entrada" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" autoComplete="email" />
              </label>
              <label className="campo inteiro">
                <span>Assunto</span>
                <select className="entrada" value={assunto} onChange={(e) => setAssunto(e.target.value)}>
                  {ASSUNTOS.map((a) => <option key={a}>{a}</option>)}
                </select>
              </label>
              <label className="campo inteiro">
                <span>Mensagem</span>
                <textarea className="entrada" value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Escreva sua mensagem…" required />
              </label>
            </div>
            {erro && <p className="erro-form" role="alert">{erro}</p>}
            {enviado && <p className="sucesso-form" role="status">Abrimos o canal oficial com sua mensagem pronta. É só confirmar o envio.</p>}
            <div className="contato-acoes">
              <button className="btn btn--primario" type="submit">
                {cfg.whatsapp ? 'Enviar pelo WhatsApp' : 'Enviar mensagem'} <Icone nome="arrow-right" />
              </button>
              {cfg.whatsapp && cfg.email && (
                <button className="btn btn--texto" type="button" onClick={(e) => enviar(e, 'email')}>Prefiro enviar por e-mail</button>
              )}
            </div>
            <p className="nota-seguranca"><Icone nome="lock" tamanho={14} /> Sua mensagem vai direto para o canal oficial. O portal não guarda seus dados.</p>
          </form>

          <div className="contato-info">
            {cfg.telefone && (
              <div className="contato-item"><Icone nome="phone" /><div><h2>Telefone</h2><a href={`tel:${cfg.telefone.replace(/\D/g, '')}`}>{cfg.telefone}</a></div></div>
            )}
            {cfg.email && (
              <div className="contato-item"><Icone nome="mail" /><div><h2>E-mail</h2><a href={`mailto:${cfg.email}`}>{cfg.email}</a></div></div>
            )}
            {cfg.endereco && (
              <div className="contato-item"><Icone nome="map" /><div><h2>Endereço institucional</h2><p>{cfg.endereco}</p></div></div>
            )}
            <a className="cartao-mapa" href={cfg.mapa_url || '#'} target="_blank" rel="noopener noreferrer">
              <Icone nome="map" tamanho={34} />
              <strong>{cfg.instituicao}</strong>
              <span>{cfg.cidade}</span>
              <small>Abrir no mapa <Icone nome="external" tamanho={12} /></small>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
