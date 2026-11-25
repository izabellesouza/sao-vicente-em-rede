// Componentes de interface reutilizados nas duas áreas.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icone } from './icons';
import { iniciais } from './format';

export function Selo({ children, cor = 'azul' }: { children: ReactNode; cor?: string }) {
  return <span className={`selo selo--${cor}`}>{children}</span>;
}

export function Avatar({ nome, cor, tamanho = 32 }: { nome?: string; cor?: string; tamanho?: number }) {
  const c = cor || (/^[A-L]/i.test(nome || '') ? 'coral' : 'petroleo');
  return (
    <span className={`avatar avatar--${c}`} style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.42 }} aria-hidden="true">
      {iniciais(nome)}
    </span>
  );
}

export function SeloMes({ rotulo, cor, grande = false }: { rotulo: string; cor: string; grande?: boolean }) {
  return (
    <span className={`selo-mes ${grande ? 'selo-mes--grande' : ''}`} style={{ background: cor }} aria-hidden="true">
      {rotulo}
    </span>
  );
}

export function Vazio({ titulo, texto, icone = 'sparkles', children }: { titulo: string; texto?: string; icone?: string; children?: ReactNode }) {
  return (
    <div className="vazio">
      <span className="vazio__icone"><Icone nome={icone} tamanho={22} /></span>
      <strong>{titulo}</strong>
      {texto && <p>{texto}</p>}
      {children}
    </div>
  );
}

export function Carregando() {
  return <div className="carregando" role="status">Carregando…</div>;
}

/** Janela modal acessível (fecha com Esc e devolve o foco). */
export function Modal({ titulo, aberto, aoFechar, children, largura = 560 }: { titulo: string; aberto: boolean; aoFechar: () => void; children: ReactNode; largura?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar();
    document.addEventListener('keydown', tecla);
    setTimeout(() => ref.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus(), 30);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', tecla);
      document.body.style.overflow = '';
      anterior?.focus?.();
    };
  }, [aberto]);
  if (!aberto) return null;
  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" ref={ref} style={{ maxWidth: largura }}>
        <div className="modal__topo">
          <h2 id="modal-titulo">{titulo}</h2>
          <button type="button" className="btn-icone" onClick={aoFechar} aria-label="Fechar">
            <Icone nome="x" />
          </button>
        </div>
        <div className="modal__corpo">{children}</div>
      </div>
    </div>
  );
}

/** Aviso temporário de confirmação ("toast"), anunciado a leitores de tela. */
let mostrarAviso: (msg: string, tipo?: 'ok' | 'erro') => void = () => {};
export const avisar = (msg: string, tipo: 'ok' | 'erro' = 'ok') => mostrarAviso(msg, tipo);

export function Avisos() {
  const [aviso, setAviso] = useState<{ msg: string; tipo: string } | null>(null);
  useEffect(() => {
    let t: any;
    mostrarAviso = (msg, tipo = 'ok') => {
      setAviso({ msg, tipo });
      clearTimeout(t);
      t = setTimeout(() => setAviso(null), 3800);
    };
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="avisos" role="status" aria-live="polite">
      {aviso && (
        <div className={`aviso aviso--${aviso.tipo}`}>
          <Icone nome={aviso.tipo === 'erro' ? 'alert' : 'check'} />
          {aviso.msg}
        </div>
      )}
    </div>
  );
}

/** Prévia gerada para materiais sem imagem (como os cards do protótipo). */
export function PreviaMaterial({ titulo, cor = '#1a6b86', url, claro = false, texto }: { titulo: string; cor?: string; url?: string | null; claro?: boolean; texto?: string }) {
  if (url) return <img className="previa-img" src={url} alt={`Prévia do material ${titulo}`} />;
  const [p1, ...resto] = titulo.split(' ');
  return (
    <div className={`previa-gerada ${claro ? 'previa-gerada--clara' : ''}`} style={{ ['--cor' as any]: cor }} role="img" aria-label={`Prévia ilustrativa: ${titulo}`}>
      <span className="previa-gerada__anel" />
      {texto ? (
        <p className="previa-gerada__texto">{texto}</p>
      ) : (
        <>
          <span className="previa-gerada__l1">{p1}</span>
          <span className="previa-gerada__l2">{resto.join(' ')}</span>
        </>
      )}
    </div>
  );
}
