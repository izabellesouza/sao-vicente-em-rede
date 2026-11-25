// Ganchos de leitura e regras de negócio compartilhadas pelas telas.
import { useEffect, useState } from 'react';
import { aoMudar, inserir, listar } from './backend';
import { diasAte, hojeISO, pct } from './format';
import type { Campanha, Configuracao, Etapa, Material, Tabela, Tarefa } from './types';

/** Lê uma tabela e recarrega automaticamente quando os dados mudam. */
export function useTabela<T>(tabela: Tabela, filtro?: Record<string, any>) {
  const [dados, setDados] = useState<T[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [falha, setFalha] = useState<string | null>(null);
  const chave = JSON.stringify(filtro || {});

  useEffect(() => {
    let ativo = true;
    const carregar = () =>
      listar<T>(tabela, filtro)
        .then((d) => ativo && (setDados(d), setFalha(null)))
        .catch((e) => ativo && setFalha(e.message))
        .finally(() => ativo && setCarregando(false));
    carregar();
    const parar = aoMudar(carregar);
    return () => {
      ativo = false;
      parar();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabela, chave]);

  return { dados, carregando, falha };
}

export const CONFIG_PADRAO: Configuracao = {
  id: 1, instituicao: 'Hospital São Vicente de Paulo', cidade: 'João Pessoa • Paraíba', telefone: '', whatsapp: '',
  email: '', endereco: '', instagram: '', facebook: '', mapa_url: '',
};

export function useConfig(): Configuracao {
  const { dados } = useTabela<Configuracao>('configuracoes');
  return { ...CONFIG_PADRAO, ...(dados[0] || {}) };
}

// ---------------------------------------------------------------------------
// Situação das campanhas
// ---------------------------------------------------------------------------
export type SituacaoPublica = 'planejada' | 'em_andamento' | 'encerrada';

export function situacaoPublica(c: Campanha, hoje = hojeISO()): SituacaoPublica {
  if (hoje < c.inicio) return 'planejada';
  if (hoje > c.fim) return 'encerrada';
  return 'em_andamento';
}

export const ROTULO_SITUACAO: Record<SituacaoPublica, string> = {
  planejada: 'Planejada',
  em_andamento: 'Em andamento',
  encerrada: 'Encerrada',
};

/** Situação no organizador: considera também se já foi publicada. */
export function situacaoInterna(c: Campanha): { rotulo: string; classe: string } {
  const s = situacaoPublica(c);
  if (s === 'encerrada') return { rotulo: 'Encerrada', classe: 'cinza' };
  if (!c.publicado) return { rotulo: 'Em preparação', classe: 'azul' };
  if (s === 'em_andamento') return { rotulo: 'Publicada • em andamento', classe: 'verde' };
  return { rotulo: 'Publicada', classe: 'verde' };
}

export const ordenarPorData = (a: Campanha, b: Campanha) => a.inicio.localeCompare(b.inicio);

// ---------------------------------------------------------------------------
// Tarefas e progresso
// ---------------------------------------------------------------------------
export const COLUNAS: { id: Tarefa['status']; rotulo: string; cor: string }[] = [
  { id: 'a_fazer', rotulo: 'A fazer', cor: '#8a99a6' },
  { id: 'em_andamento', rotulo: 'Em andamento', cor: '#1a6b86' },
  { id: 'em_revisao', rotulo: 'Em revisão', cor: '#d39a1f' },
  { id: 'concluido', rotulo: 'Concluído', cor: '#2f7d5e' },
];

export const ETAPAS: { id: Etapa; rotulo: string }[] = [
  { id: 'planejamento', rotulo: 'Planejamento' },
  { id: 'producao', rotulo: 'Produção de materiais' },
  { id: 'aprovacao', rotulo: 'Aprovações' },
  { id: 'publicacao', rotulo: 'Publicação' },
];

export const ROTULO_PRIORIDADE = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };

export function progresso(tarefas: Tarefa[]): number {
  return pct(tarefas.filter((t) => t.status === 'concluido').length, tarefas.length);
}

export const atrasada = (t: Tarefa) => t.status !== 'concluido' && !!t.prazo && diasAte(t.prazo) < 0;

// ---------------------------------------------------------------------------
// Materiais
// ---------------------------------------------------------------------------
export const ROTULO_MATERIAL: Record<Material['status'], { rotulo: string; classe: string }> = {
  em_producao: { rotulo: 'Em produção', classe: 'amarelo' },
  aguardando_aprovacao: { rotulo: 'Aguardando aprovação', classe: 'azul' },
  ajuste_solicitado: { rotulo: 'Ajuste solicitado', classe: 'vermelho' },
  aprovado: { rotulo: 'Aprovado', classe: 'verde' },
};

export const TIPOS_MATERIAL = ['Card para Instagram', 'Stories', 'Cartaz', 'Folder', 'Legenda', 'Vídeo', 'Outro'];

// ---------------------------------------------------------------------------
// Histórico (movimentações)
// ---------------------------------------------------------------------------
export function registrar(usuario_id: string | null, acao: string, detalhe: string, campanha_id: string | null = null) {
  return inserir('atividades', { usuario_id, acao, detalhe, campanha_id }).catch(() => undefined);
}

// ---------------------------------------------------------------------------
// Links úteis
// ---------------------------------------------------------------------------
export function linkWhatsApp(numero: string, texto: string) {
  const n = (numero || '').replace(/\D/g, '');
  return `https://wa.me/${n}?text=${encodeURIComponent(texto)}`;
}
