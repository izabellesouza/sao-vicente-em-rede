-- =============================================================================
-- São Vicente em Rede — dados iniciais (rode DEPOIS de 01_estrutura.sql)
-- Telefones e links abaixo são EXEMPLOS: troque pelos oficiais do hospital
-- em Organizador > Configurações (ou edite aqui antes de rodar).
-- =============================================================================

insert into public.configuracoes (id, instituicao, cidade, telefone, whatsapp, email, endereco, instagram, facebook, mapa_url)
values (
  1, 'Hospital São Vicente de Paulo', 'João Pessoa • Paraíba', '(83) 3333-2025', '5583999992025',
  'contato@exemplo.org.br', 'Av. Exemplo, 240 — Centro, João Pessoa, PB',
  'https://www.instagram.com/', 'https://www.facebook.com/',
  'https://www.google.com/maps/search/Hospital+S%C3%A3o+Vicente+de+Paulo+Jo%C3%A3o+Pessoa'
)
on conflict (id) do nothing;

insert into public.formas_apoio (tipo, titulo, descricao, link) values
  ('whatsapp', 'WhatsApp institucional', 'Fale com a equipe para participar, adquirir camisas ou tirar dúvidas.', 'https://wa.me/5583999992025'),
  ('instagram', 'Instagram oficial', 'Acompanhe e compartilhe os conteúdos oficiais das campanhas.', 'https://www.instagram.com/'),
  ('doacao', 'Contribua pelo canal oficial', 'Conheça as formas institucionais de contribuição com a equipe do hospital.', 'https://wa.me/5583999992025?text=Ol%C3%A1!%20Quero%20saber%20como%20contribuir.'),
  ('telefone', 'Telefone', 'Atendimento institucional em horário comercial.', 'tel:+558333332025');

-- Campanhas do calendário anual (ano atual). O Natal Solidário fica SEM publicar,
-- para a equipe testar o fluxo completo até a liberação no portal.
with a as (select extract(year from now())::int as ano)
insert into public.campanhas (slug, titulo, cor, tipo, resumo, descricao, objetivo, publico, inicio, fim, participacao, programacao, publicado, publicado_em)
select * from (
  select 'saude-dos-rins', 'Saúde dos rins', '#2f7d5e', 'Campanha de conscientização',
    'Informação e prevenção para cuidar da saúde renal.',
    'Ações educativas sobre hábitos que protegem os rins, com orientação sobre hidratação, pressão arterial e acompanhamento.',
    'Ampliar o acesso à informação sobre prevenção das doenças renais.', 'Comunidade, pacientes e familiares',
    make_date(a.ano, 3, 12), make_date(a.ano, 3, 28),
    '[{"titulo":"Participar da roda de conversa","detalhe":"Fale com a equipe pelo canal oficial"}]'::jsonb,
    jsonb_build_array(jsonb_build_object('data', make_date(a.ano, 3, 14)::text, 'titulo', 'Roda de conversa: rins saudáveis', 'local', 'Auditório do Hospital São Vicente de Paulo', 'horario', '15h')),
    true, now()
  from a
  union all
  select 'cuidar-de-quem-cuida', 'Cuidar de quem cuida', '#946c0c', 'Campanha de acolhimento',
    'Acolhimento e bem-estar para profissionais e cuidadores.',
    'Encontros de acolhimento e valorização dos profissionais e cuidadores que fazem o hospital acontecer todos os dias.',
    'Promover bem-estar e reconhecimento a quem cuida.', 'Profissionais, cuidadores e voluntários',
    make_date(a.ano, 5, 5), make_date(a.ano, 5, 20),
    '[{"titulo":"Participar dos encontros","detalhe":"Inscrições pelo canal oficial"}]'::jsonb,
    jsonb_build_array(jsonb_build_object('data', make_date(a.ano, 5, 12)::text, 'titulo', 'Encontro de acolhimento', 'local', 'Capela do hospital', 'horario', '9h')),
    true, now()
  from a
  union all
  select 'outubro-rosa', 'Outubro Rosa', '#b0436b', 'Campanha de conscientização',
    'Conscientização e cuidado com a saúde da mulher.',
    'Informação sobre prevenção e diagnóstico precoce do câncer de mama, com ações presenciais e conteúdos educativos.',
    'Incentivar o autocuidado e o diagnóstico precoce.', 'Mulheres, familiares e comunidade',
    make_date(a.ano, 10, 1), make_date(a.ano, 10, 31),
    '[{"titulo":"Participar da caminhada","detalhe":"Concentração às 7h"},{"titulo":"Adquirir a camisa","detalhe":"Fale com a equipe pelo canal oficial"}]'::jsonb,
    jsonb_build_array(
      jsonb_build_object('data', make_date(a.ano, 10, 10)::text, 'titulo', 'Palestra: prevenção e autocuidado', 'local', 'Auditório do Hospital São Vicente de Paulo', 'horario', '15h'),
      jsonb_build_object('data', make_date(a.ano, 10, 19)::text, 'titulo', 'Caminhada Rosa', 'local', 'Concentração na Praça da Independência', 'horario', '7h')),
    true, now()
  from a
  union all
  select 'novembro-azul', 'Novembro Azul', '#1a6b86', 'Campanha de conscientização',
    'Cuidar da saúde também é um ato de coragem.',
    'O Novembro Azul do Hospital São Vicente de Paulo promove a conscientização sobre a importância do cuidado integral com a saúde do homem. Ao longo do mês, vamos abrir espaços de conversa, compartilhar conteúdos educativos e reunir a comunidade em ações presenciais.',
    'Ampliar o acesso à informação de qualidade, incentivar o autocuidado e fortalecer uma cultura de prevenção sem preconceitos.',
    'Comunidade, pacientes e familiares',
    make_date(a.ano, 11, 1), make_date(a.ano, 11, 30),
    '[{"titulo":"Participar da caminhada","detalhe":"17 de novembro, às 7h"},{"titulo":"Participar da palestra","detalhe":"08 de novembro, às 15h"},{"titulo":"Adquirir a camisa","detalhe":"Fale com a equipe pelo canal oficial"}]'::jsonb,
    jsonb_build_array(
      jsonb_build_object('data', make_date(a.ano, 11, 8)::text, 'titulo', 'Palestra: saúde do homem sem tabus', 'local', 'Auditório do Hospital São Vicente de Paulo', 'horario', '15h'),
      jsonb_build_object('data', make_date(a.ano, 11, 17)::text, 'titulo', 'Caminhada Azul', 'local', 'Concentração na Praça da Independência', 'horario', '7h'),
      jsonb_build_object('data', '', 'titulo', 'Camisas da campanha', 'local', 'Disponíveis pelos canais institucionais do hospital', 'horario', '')),
    true, now()
  from a
  union all
  select 'natal-solidario', 'Natal Solidário', '#c4543d', 'Campanha de solidariedade',
    'Uma rede de afeto e solidariedade para nossa comunidade.',
    'Arrecadação de brinquedos, alimentos e kits de higiene para famílias acompanhadas pelo hospital, com uma celebração de encerramento aberta à comunidade.',
    'Mobilizar a comunidade para levar cuidado e alegria às famílias atendidas no fim do ano.',
    'Comunidade, apoiadores e doadores',
    make_date(a.ano, 12, 8), make_date(a.ano, 12, 20),
    '[{"titulo":"Doar brinquedos ou alimentos","detalhe":"Pontos de coleta na recepção do hospital"},{"titulo":"Ser voluntário na celebração","detalhe":"20 de dezembro, às 16h"}]'::jsonb,
    jsonb_build_array(
      jsonb_build_object('data', make_date(a.ano, 12, 8)::text, 'titulo', 'Abertura da arrecadação', 'local', 'Recepção do Hospital São Vicente de Paulo', 'horario', '8h'),
      jsonb_build_object('data', make_date(a.ano, 12, 20)::text, 'titulo', 'Celebração de Natal', 'local', 'Pátio do hospital', 'horario', '16h')),
    false, null
  from a
) x
on conflict (slug) do nothing;

-- Vincula todas as formas de apoio a todas as campanhas.
insert into public.campanha_apoio (campanha_id, apoio_id)
select c.id, f.id from public.campanhas c cross join public.formas_apoio f
on conflict do nothing;

-- Resultados agregados de exemplo do Novembro Azul (troque pelos reais).
insert into public.resultados (campanha_id, participantes, meta_participantes, camisas, meta_camisas, valor_arrecadado, meta_valor, observacoes, aprendizados)
select id, 186, 230, 94, 120, 8460, 12000, 'Valores de exemplo — substitua pelos informados pela equipe.',
  'A divulgação antecipada da caminhada aumentou a participação.'
from public.campanhas where slug = 'novembro-azul'
on conflict (campanha_id) do nothing;
