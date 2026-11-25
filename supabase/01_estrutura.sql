-- =============================================================================
-- São Vicente em Rede — estrutura do banco (Supabase / PostgreSQL)
-- Como usar: Supabase > SQL Editor > New query > cole TODO este arquivo > Run.
-- Depois rode 02_dados_iniciais.sql.
--
-- Princípios: nenhum dado clínico, de paciente ou bancário é armazenado.
-- O acesso é controlado por perfil (Row Level Security), não só pela tela.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PERFIS (ligados às contas do Supabase Auth)
-- ---------------------------------------------------------------------------
create table if not exists public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  email text not null default '',
  funcao text not null default 'visualizador'
    check (funcao in ('admin', 'marketing', 'producao', 'visualizador')),
  ativo boolean not null default false,
  ultimo_acesso timestamptz,
  criado_em timestamptz not null default now()
);

-- Função do usuário logado (nula se não estiver ativo).
create or replace function public.minha_funcao()
returns text language sql stable security definer set search_path = public as $$
  select funcao from public.perfis where id = auth.uid() and ativo
$$;

create or replace function public.eh_equipe()
returns boolean language sql stable security definer set search_path = public as $$
  select public.minha_funcao() is not null
$$;

create or replace function public.tem_funcao(variadic funcoes text[])
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.minha_funcao() = any (funcoes), false)
$$;

-- Ao criar uma conta: cria o perfil. A PRIMEIRA conta vira administradora ativa;
-- as demais nascem inativas até o administrador liberar (evita cadastros indevidos).
create or replace function public.criar_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  primeiro boolean := not exists (select 1 from public.perfis);
begin
  insert into public.perfis (id, nome, email, funcao, ativo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email,
    case when primeiro then 'admin' else 'visualizador' end,
    primeiro
  );
  return new;
end $$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function public.criar_perfil();

-- Só o administrador muda função, situação e e-mail de um perfil.
create or replace function public.proteger_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(public.minha_funcao(), '') <> 'admin' then
    new.funcao := old.funcao;
    new.ativo := old.ativo;
    new.email := old.email;
  end if;
  return new;
end $$;

drop trigger if exists proteger_perfil on public.perfis;
create trigger proteger_perfil before update on public.perfis
  for each row execute function public.proteger_perfil();

-- ---------------------------------------------------------------------------
-- CONFIGURAÇÕES INSTITUCIONAIS (uma única linha)
-- ---------------------------------------------------------------------------
create table if not exists public.configuracoes (
  id int primary key default 1 check (id = 1),
  instituicao text not null default 'Hospital São Vicente de Paulo',
  cidade text not null default 'João Pessoa • Paraíba',
  telefone text not null default '',
  whatsapp text not null default '',
  email text not null default '',
  endereco text not null default '',
  instagram text not null default '',
  facebook text not null default '',
  mapa_url text not null default ''
);

-- ---------------------------------------------------------------------------
-- CAMPANHAS
-- ---------------------------------------------------------------------------
create table if not exists public.campanhas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  cor text not null default '#1a6b86',
  tipo text not null default 'Campanha de conscientização',
  resumo text not null default '',
  descricao text not null default '',
  objetivo text not null default '',
  publico text not null default '',
  local text not null default 'João Pessoa • PB',
  inicio date not null,
  fim date not null,
  participacao jsonb not null default '[]',
  programacao jsonb not null default '[]',
  responsavel_id uuid references public.perfis (id) on delete set null,
  publicado boolean not null default false,
  publicado_em timestamptz,
  publicado_por uuid references public.perfis (id) on delete set null,
  criado_por uuid references public.perfis (id) on delete set null,
  criado_em timestamptz not null default now(),
  check (fim >= inicio)
);

-- ---------------------------------------------------------------------------
-- TAREFAS
-- ---------------------------------------------------------------------------
create table if not exists public.tarefas (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas (id) on delete cascade,
  titulo text not null,
  descricao text not null default '',
  responsavel_id uuid references public.perfis (id) on delete set null,
  prazo date,
  prioridade text not null default 'media' check (prioridade in ('alta', 'media', 'baixa')),
  status text not null default 'a_fazer' check (status in ('a_fazer', 'em_andamento', 'em_revisao', 'concluido')),
  etapa text not null default 'producao' check (etapa in ('planejamento', 'producao', 'aprovacao', 'publicacao')),
  criado_por uuid references public.perfis (id) on delete set null,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- MATERIAIS, VERSÕES E APROVAÇÕES
-- ---------------------------------------------------------------------------
create table if not exists public.materiais (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.campanhas (id) on delete cascade,
  titulo text not null,
  tipo text not null default 'Outro',
  briefing text not null default '',
  formato text not null default '',
  arquivo_url text,
  arquivo_nome text,
  legenda text not null default '',
  versao int not null default 1,
  status text not null default 'em_producao'
    check (status in ('em_producao', 'aguardando_aprovacao', 'ajuste_solicitado', 'aprovado')),
  publico boolean not null default true,
  autor_id uuid references public.perfis (id) on delete set null,
  atualizado_em timestamptz not null default now(),
  criado_em timestamptz not null default now()
);

create table if not exists public.versoes_material (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materiais (id) on delete cascade,
  versao int not null,
  arquivo_url text,
  arquivo_nome text,
  nota text not null default '',
  autor_id uuid references public.perfis (id) on delete set null,
  criado_em timestamptz not null default now()
);

create table if not exists public.aprovacoes (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materiais (id) on delete cascade,
  revisor_id uuid references public.perfis (id) on delete set null,
  decisao text not null check (decisao in ('aprovado', 'ajustes')),
  comentario text not null default '',
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RESULTADOS (somente valores agregados)
-- ---------------------------------------------------------------------------
create table if not exists public.resultados (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null unique references public.campanhas (id) on delete cascade,
  participantes int not null default 0 check (participantes >= 0),
  meta_participantes int not null default 0 check (meta_participantes >= 0),
  camisas int not null default 0 check (camisas >= 0),
  meta_camisas int not null default 0 check (meta_camisas >= 0),
  valor_arrecadado numeric(12, 2) not null default 0 check (valor_arrecadado >= 0),
  meta_valor numeric(12, 2) not null default 0 check (meta_valor >= 0),
  observacoes text not null default '',
  aprendizados text not null default '',
  atualizado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- FORMAS DE APOIO (canais oficiais) e vínculo com campanhas
-- ---------------------------------------------------------------------------
create table if not exists public.formas_apoio (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'outro' check (tipo in ('whatsapp', 'instagram', 'doacao', 'telefone', 'email', 'outro')),
  titulo text not null,
  descricao text not null default '',
  link text not null,
  ativo boolean not null default true
);

create table if not exists public.campanha_apoio (
  campanha_id uuid not null references public.campanhas (id) on delete cascade,
  apoio_id uuid not null references public.formas_apoio (id) on delete cascade,
  primary key (campanha_id, apoio_id)
);

-- ---------------------------------------------------------------------------
-- HISTÓRICO (movimentações)
-- ---------------------------------------------------------------------------
create table if not exists public.atividades (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.perfis (id) on delete set null,
  campanha_id uuid references public.campanhas (id) on delete set null,
  acao text not null,
  detalhe text not null default '',
  criado_em timestamptz not null default now()
);

-- =============================================================================
-- REGRAS DE ACESSO (Row Level Security)
-- =============================================================================
alter table public.perfis enable row level security;
alter table public.configuracoes enable row level security;
alter table public.campanhas enable row level security;
alter table public.tarefas enable row level security;
alter table public.materiais enable row level security;
alter table public.versoes_material enable row level security;
alter table public.aprovacoes enable row level security;
alter table public.resultados enable row level security;
alter table public.formas_apoio enable row level security;
alter table public.campanha_apoio enable row level security;
alter table public.atividades enable row level security;

-- Perfis: a equipe vê a equipe; cada um vê o próprio; admin edita.
drop policy if exists perfis_ler on public.perfis;
create policy perfis_ler on public.perfis for select using (public.eh_equipe() or id = auth.uid());
drop policy if exists perfis_editar on public.perfis;
create policy perfis_editar on public.perfis for update using (public.tem_funcao('admin') or id = auth.uid());

-- Configurações: públicas para leitura; admin altera.
drop policy if exists config_ler on public.configuracoes;
create policy config_ler on public.configuracoes for select using (true);
drop policy if exists config_editar on public.configuracoes;
create policy config_editar on public.configuracoes for update using (public.tem_funcao('admin'));

-- Campanhas: comunidade vê só as publicadas; equipe vê todas; coordenação edita.
drop policy if exists campanhas_ler on public.campanhas;
create policy campanhas_ler on public.campanhas for select using (publicado or public.eh_equipe());
drop policy if exists campanhas_criar on public.campanhas;
create policy campanhas_criar on public.campanhas for insert with check (public.tem_funcao('admin', 'marketing'));
drop policy if exists campanhas_editar on public.campanhas;
create policy campanhas_editar on public.campanhas for update using (public.tem_funcao('admin', 'marketing'));
drop policy if exists campanhas_excluir on public.campanhas;
create policy campanhas_excluir on public.campanhas for delete using (public.tem_funcao('admin', 'marketing'));

-- Tarefas: equipe vê; coordenação cria/edita/exclui; produção atualiza as próprias.
drop policy if exists tarefas_ler on public.tarefas;
create policy tarefas_ler on public.tarefas for select using (public.eh_equipe());
drop policy if exists tarefas_criar on public.tarefas;
create policy tarefas_criar on public.tarefas for insert with check (public.tem_funcao('admin', 'marketing'));
drop policy if exists tarefas_editar on public.tarefas;
create policy tarefas_editar on public.tarefas for update
  using (public.tem_funcao('admin', 'marketing') or (public.tem_funcao('producao') and responsavel_id = auth.uid()));
drop policy if exists tarefas_excluir on public.tarefas;
create policy tarefas_excluir on public.tarefas for delete using (public.tem_funcao('admin', 'marketing'));

-- Materiais: comunidade vê só os aprovados, marcados como públicos, de campanhas publicadas.
drop policy if exists materiais_ler on public.materiais;
create policy materiais_ler on public.materiais for select using (
  public.eh_equipe()
  or (status = 'aprovado' and publico and exists (select 1 from public.campanhas c where c.id = campanha_id and c.publicado))
);
drop policy if exists materiais_criar on public.materiais;
create policy materiais_criar on public.materiais for insert with check (public.tem_funcao('admin', 'marketing', 'producao'));
drop policy if exists materiais_editar on public.materiais;
create policy materiais_editar on public.materiais for update using (public.tem_funcao('admin', 'marketing', 'producao'));
drop policy if exists materiais_excluir on public.materiais;
create policy materiais_excluir on public.materiais for delete using (public.tem_funcao('admin', 'marketing'));

-- Impede que a produção aprove o próprio material pela API (só a coordenação aprova).
create or replace function public.proteger_aprovacao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'aprovado' and old.status <> 'aprovado' and not public.tem_funcao('admin', 'marketing') then
    raise exception 'Somente a coordenação pode aprovar materiais.';
  end if;
  return new;
end $$;
drop trigger if exists proteger_aprovacao on public.materiais;
create trigger proteger_aprovacao before update on public.materiais
  for each row execute function public.proteger_aprovacao();

drop policy if exists versoes_ler on public.versoes_material;
create policy versoes_ler on public.versoes_material for select using (public.eh_equipe());
drop policy if exists versoes_criar on public.versoes_material;
create policy versoes_criar on public.versoes_material for insert with check (public.tem_funcao('admin', 'marketing', 'producao'));
drop policy if exists versoes_excluir on public.versoes_material;
create policy versoes_excluir on public.versoes_material for delete using (public.tem_funcao('admin', 'marketing'));

drop policy if exists aprovacoes_ler on public.aprovacoes;
create policy aprovacoes_ler on public.aprovacoes for select using (public.eh_equipe());
drop policy if exists aprovacoes_criar on public.aprovacoes;
create policy aprovacoes_criar on public.aprovacoes for insert with check (public.tem_funcao('admin', 'marketing') and revisor_id = auth.uid());
drop policy if exists aprovacoes_excluir on public.aprovacoes;
create policy aprovacoes_excluir on public.aprovacoes for delete using (public.tem_funcao('admin', 'marketing'));

-- Resultados: equipe vê; coordenação registra.
drop policy if exists resultados_ler on public.resultados;
create policy resultados_ler on public.resultados for select using (public.eh_equipe());
drop policy if exists resultados_criar on public.resultados;
create policy resultados_criar on public.resultados for insert with check (public.tem_funcao('admin', 'marketing'));
drop policy if exists resultados_editar on public.resultados;
create policy resultados_editar on public.resultados for update using (public.tem_funcao('admin', 'marketing'));
drop policy if exists resultados_excluir on public.resultados;
create policy resultados_excluir on public.resultados for delete using (public.tem_funcao('admin', 'marketing'));

-- Formas de apoio: comunidade vê as ativas; coordenação gerencia.
drop policy if exists apoio_ler on public.formas_apoio;
create policy apoio_ler on public.formas_apoio for select using (ativo or public.eh_equipe());
drop policy if exists apoio_criar on public.formas_apoio;
create policy apoio_criar on public.formas_apoio for insert with check (public.tem_funcao('admin', 'marketing'));
drop policy if exists apoio_editar on public.formas_apoio;
create policy apoio_editar on public.formas_apoio for update using (public.tem_funcao('admin', 'marketing'));
drop policy if exists apoio_excluir on public.formas_apoio;
create policy apoio_excluir on public.formas_apoio for delete using (public.tem_funcao('admin', 'marketing'));

drop policy if exists campanha_apoio_ler on public.campanha_apoio;
create policy campanha_apoio_ler on public.campanha_apoio for select using (true);
drop policy if exists campanha_apoio_criar on public.campanha_apoio;
create policy campanha_apoio_criar on public.campanha_apoio for insert with check (public.tem_funcao('admin', 'marketing'));
drop policy if exists campanha_apoio_excluir on public.campanha_apoio;
create policy campanha_apoio_excluir on public.campanha_apoio for delete using (public.tem_funcao('admin', 'marketing'));

-- Histórico: equipe vê; cada pessoa registra as próprias ações.
drop policy if exists atividades_ler on public.atividades;
create policy atividades_ler on public.atividades for select using (public.eh_equipe());
drop policy if exists atividades_criar on public.atividades;
create policy atividades_criar on public.atividades for insert with check (public.eh_equipe() and usuario_id = auth.uid());

-- =============================================================================
-- ARMAZENAMENTO DE ARQUIVOS (bucket público "materiais")
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('materiais', 'materiais', true)
on conflict (id) do nothing;

drop policy if exists materiais_arquivos_ler on storage.objects;
create policy materiais_arquivos_ler on storage.objects for select using (bucket_id = 'materiais');
drop policy if exists materiais_arquivos_enviar on storage.objects;
create policy materiais_arquivos_enviar on storage.objects for insert
  with check (bucket_id = 'materiais' and public.tem_funcao('admin', 'marketing', 'producao'));
