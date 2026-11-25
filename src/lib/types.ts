// Tipos do domínio — seguem o modelo de dados do MVP (slide 16 do planejamento).
// Nenhum dado clínico ou informação de paciente faz parte do sistema.

export type Funcao = 'admin' | 'marketing' | 'producao' | 'visualizador';

export interface Perfil {
  id: string;
  nome: string;
  email: string;
  funcao: Funcao;
  ativo: boolean;
  ultimo_acesso?: string | null;
  criado_em?: string;
}

export interface ItemProgramacao {
  data: string; // AAAA-MM-DD ou vazio = "todo o mês"
  titulo: string;
  local: string;
  horario: string;
}

export interface OpcaoParticipacao {
  titulo: string;
  detalhe: string;
}

export interface Campanha {
  id: string;
  slug: string;
  titulo: string;
  cor: string; // cor do selo do mês (hex)
  tipo: string; // ex.: "Campanha de conscientização"
  resumo: string; // frase curta (chamada)
  descricao: string;
  objetivo: string;
  publico: string;
  local: string;
  inicio: string; // AAAA-MM-DD
  fim: string; // AAAA-MM-DD
  participacao: OpcaoParticipacao[];
  programacao: ItemProgramacao[];
  responsavel_id: string | null;
  publicado: boolean;
  publicado_em: string | null;
  publicado_por: string | null;
  criado_por: string | null;
  criado_em?: string;
}

export type StatusTarefa = 'a_fazer' | 'em_andamento' | 'em_revisao' | 'concluido';
export type Prioridade = 'alta' | 'media' | 'baixa';
export type Etapa = 'planejamento' | 'producao' | 'aprovacao' | 'publicacao';

export interface Tarefa {
  id: string;
  campanha_id: string;
  titulo: string;
  descricao: string;
  responsavel_id: string | null;
  prazo: string | null; // AAAA-MM-DD
  prioridade: Prioridade;
  status: StatusTarefa;
  etapa: Etapa;
  criado_por?: string | null;
  criado_em?: string;
}

export type StatusMaterial = 'em_producao' | 'aguardando_aprovacao' | 'ajuste_solicitado' | 'aprovado';

export interface Material {
  id: string;
  campanha_id: string;
  titulo: string;
  tipo: string;
  briefing: string;
  formato: string;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  legenda: string;
  versao: number;
  status: StatusMaterial;
  publico: boolean; // exibir no portal depois de aprovado
  autor_id: string | null;
  atualizado_em?: string;
  criado_em?: string;
}

export interface VersaoMaterial {
  id: string;
  material_id: string;
  versao: number;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  nota: string;
  autor_id: string | null;
  criado_em?: string;
}

export interface Aprovacao {
  id: string;
  material_id: string;
  revisor_id: string | null;
  decisao: 'aprovado' | 'ajustes';
  comentario: string;
  criado_em?: string;
}

export interface Resultado {
  id: string;
  campanha_id: string;
  participantes: number;
  meta_participantes: number;
  camisas: number;
  meta_camisas: number;
  valor_arrecadado: number;
  meta_valor: number;
  observacoes: string;
  aprendizados: string;
  atualizado_em?: string;
}

export interface FormaApoio {
  id: string;
  tipo: 'whatsapp' | 'instagram' | 'doacao' | 'telefone' | 'email' | 'outro';
  titulo: string;
  descricao: string;
  link: string;
  ativo: boolean;
}

export interface CampanhaApoio {
  id?: string;
  campanha_id: string;
  apoio_id: string;
}

export interface Atividade {
  id: string;
  usuario_id: string | null;
  campanha_id: string | null;
  acao: string;
  detalhe: string;
  criado_em?: string;
}

export interface Configuracao {
  id: number;
  instituicao: string;
  cidade: string;
  telefone: string;
  whatsapp: string; // só números, com DDI e DDD. Ex.: 5583999999999
  email: string;
  endereco: string;
  instagram: string;
  facebook: string;
  mapa_url: string;
}

export type Tabela =
  | 'perfis'
  | 'campanhas'
  | 'tarefas'
  | 'materiais'
  | 'versoes_material'
  | 'aprovacoes'
  | 'resultados'
  | 'formas_apoio'
  | 'campanha_apoio'
  | 'atividades'
  | 'configuracoes';
