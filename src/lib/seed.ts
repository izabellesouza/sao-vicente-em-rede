// Dados de exemplo usados no MODO DEMONSTRAÇÃO (sem Supabase).
// São fictícios e servem apenas para apresentar e testar o fluxo.
import type {
  Atividade, Aprovacao, Campanha, CampanhaApoio, Configuracao, FormaApoio,
  Material, Perfil, Resultado, Tarefa, VersaoMaterial,
} from './types';

const ANO = new Date().getFullYear();
const d = (mes: number, dia: number, ano = ANO) => `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

/** Data relativa a hoje (em dias). */
function rel(dias: number): string {
  const x = new Date();
  x.setDate(x.getDate() + dias);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}
const atras = (min: number) => new Date(Date.now() - min * 60000).toISOString();

export function gerarDadosIniciais() {
  const perfis: Perfil[] = [
    { id: 'u-larissa', nome: 'Larissa Almeida', email: 'larissa@demo.saovicente', funcao: 'marketing', ativo: true, ultimo_acesso: atras(30) },
    { id: 'u-marcelo', nome: 'Marcelo Santos', email: 'marcelo@demo.saovicente', funcao: 'producao', ativo: true, ultimo_acesso: atras(90) },
    { id: 'u-admin', nome: 'Administrador', email: 'admin@demo.saovicente', funcao: 'admin', ativo: true, ultimo_acesso: atras(60 * 20) },
    { id: 'u-conselho', nome: 'Conselho Diretor', email: 'consulta@demo.saovicente', funcao: 'visualizador', ativo: true, ultimo_acesso: atras(60 * 24 * 6) },
  ];

  const configuracoes: Configuracao[] = [
    {
      id: 1,
      instituicao: 'Hospital São Vicente de Paulo',
      cidade: 'João Pessoa • Paraíba',
      telefone: '(83) 3333-2025',
      whatsapp: '5583999992025',
      email: 'contato@exemplo.org.br',
      endereco: 'Av. Exemplo, 240 — Centro, João Pessoa, PB',
      instagram: 'https://www.instagram.com/',
      facebook: 'https://www.facebook.com/',
      mapa_url: 'https://www.google.com/maps/search/Hospital+S%C3%A3o+Vicente+de+Paulo+Jo%C3%A3o+Pessoa',
    },
  ];

  const formas_apoio: FormaApoio[] = [
    { id: 'a-whats', tipo: 'whatsapp', titulo: 'WhatsApp institucional', descricao: 'Fale com a equipe para participar, adquirir camisas ou tirar dúvidas.', link: 'https://wa.me/5583999992025', ativo: true },
    { id: 'a-insta', tipo: 'instagram', titulo: 'Instagram oficial', descricao: 'Acompanhe e compartilhe os conteúdos oficiais das campanhas.', link: 'https://www.instagram.com/', ativo: true },
    { id: 'a-doacao', tipo: 'doacao', titulo: 'Contribua pelo canal oficial', descricao: 'Conheça as formas institucionais de contribuição com a equipe do hospital.', link: 'https://wa.me/5583999992025?text=Ol%C3%A1!%20Quero%20saber%20como%20contribuir.', ativo: true },
    { id: 'a-tel', tipo: 'telefone', titulo: 'Telefone', descricao: 'Atendimento institucional em horário comercial.', link: 'tel:+558333332025', ativo: true },
  ];

  const base = {
    responsavel_id: 'u-larissa', criado_por: 'u-larissa', publicado: true,
    publicado_por: 'u-larissa', local: 'João Pessoa • PB', tipo: 'Campanha de conscientização',
  };

  const campanhas: Campanha[] = [
    {
      ...base, id: 'c-rins', slug: 'saude-dos-rins', titulo: 'Saúde dos rins', cor: '#2f7d5e',
      resumo: 'Informação e prevenção para cuidar da saúde renal.',
      descricao: 'Ações educativas sobre hábitos que protegem os rins, com orientação sobre hidratação, pressão arterial e acompanhamento.',
      objetivo: 'Ampliar o acesso à informação sobre prevenção das doenças renais.',
      publico: 'Comunidade, pacientes e familiares', inicio: d(3, 12), fim: d(3, 28),
      participacao: [{ titulo: 'Participar da roda de conversa', detalhe: 'Fale com a equipe pelo canal oficial' }],
      programacao: [{ data: d(3, 14), titulo: 'Roda de conversa: rins saudáveis', local: 'Auditório do Hospital São Vicente de Paulo', horario: '15h' }],
      publicado_em: atras(60 * 24 * 250),
    },
    {
      ...base, id: 'c-cuidar', slug: 'cuidar-de-quem-cuida', titulo: 'Cuidar de quem cuida', cor: '#946c0c',
      resumo: 'Acolhimento e bem-estar para profissionais e cuidadores.',
      descricao: 'Encontros de acolhimento e valorização dos profissionais e cuidadores que fazem o hospital acontecer todos os dias.',
      objetivo: 'Promover bem-estar e reconhecimento a quem cuida.',
      publico: 'Profissionais, cuidadores e voluntários', inicio: d(5, 5), fim: d(5, 20), tipo: 'Campanha de acolhimento',
      participacao: [{ titulo: 'Participar dos encontros', detalhe: 'Inscrições pelo canal oficial' }],
      programacao: [{ data: d(5, 12), titulo: 'Encontro de acolhimento', local: 'Capela do hospital', horario: '9h' }],
      publicado_em: atras(60 * 24 * 200),
    },
    {
      ...base, id: 'c-outubro', slug: 'outubro-rosa', titulo: 'Outubro Rosa', cor: '#b0436b',
      resumo: 'Conscientização e cuidado com a saúde da mulher.',
      descricao: 'Informação sobre prevenção e diagnóstico precoce do câncer de mama, com ações presenciais e conteúdos educativos.',
      objetivo: 'Incentivar o autocuidado e o diagnóstico precoce.',
      publico: 'Mulheres, familiares e comunidade', inicio: d(10, 1), fim: d(10, 31),
      participacao: [
        { titulo: 'Participar da caminhada', detalhe: 'Concentração às 7h' },
        { titulo: 'Adquirir a camisa', detalhe: 'Fale com a equipe pelo canal oficial' },
      ],
      programacao: [
        { data: d(10, 10), titulo: 'Palestra: prevenção e autocuidado', local: 'Auditório do Hospital São Vicente de Paulo', horario: '15h' },
        { data: d(10, 19), titulo: 'Caminhada Rosa', local: 'Concentração na Praça da Independência', horario: '7h' },
      ],
      publicado_em: atras(60 * 24 * 60),
    },
    {
      ...base, id: 'c-novembro', slug: 'novembro-azul', titulo: 'Novembro Azul', cor: '#1a6b86',
      resumo: 'Cuidar da saúde também é um ato de coragem.',
      descricao: 'O Novembro Azul do Hospital São Vicente de Paulo promove a conscientização sobre a importância do cuidado integral com a saúde do homem. Ao longo do mês, vamos abrir espaços de conversa, compartilhar conteúdos educativos e reunir a comunidade em ações presenciais.',
      objetivo: 'Ampliar o acesso à informação de qualidade, incentivar o autocuidado e fortalecer uma cultura de prevenção sem preconceitos.',
      publico: 'Comunidade, pacientes e familiares', inicio: d(11, 1), fim: d(11, 30),
      participacao: [
        { titulo: 'Participar da caminhada', detalhe: '17 de novembro, às 7h' },
        { titulo: 'Participar da palestra', detalhe: '08 de novembro, às 15h' },
        { titulo: 'Adquirir a camisa', detalhe: 'Fale com a equipe pelo canal oficial' },
      ],
      programacao: [
        { data: d(11, 8), titulo: 'Palestra: saúde do homem sem tabus', local: 'Auditório do Hospital São Vicente de Paulo', horario: '15h' },
        { data: d(11, 17), titulo: 'Caminhada Azul', local: 'Concentração na Praça da Independência', horario: '7h' },
        { data: '', titulo: 'Camisas da campanha', local: 'Disponíveis pelos canais institucionais do hospital', horario: '' },
      ],
      publicado_em: atras(60 * 24 * 20),
    },
    {
      ...base, id: 'c-natal', slug: 'natal-solidario', titulo: 'Natal Solidário', cor: '#c4543d',
      tipo: 'Campanha de solidariedade',
      resumo: 'Uma rede de afeto e solidariedade para nossa comunidade.',
      descricao: 'Arrecadação de brinquedos, alimentos e kits de higiene para famílias acompanhadas pelo hospital, com uma celebração de encerramento aberta à comunidade.',
      objetivo: 'Mobilizar a comunidade para levar cuidado e alegria às famílias atendidas no fim do ano.',
      publico: 'Comunidade, apoiadores e doadores', inicio: d(12, 8), fim: d(12, 20),
      participacao: [
        { titulo: 'Doar brinquedos ou alimentos', detalhe: 'Pontos de coleta na recepção do hospital' },
        { titulo: 'Ser voluntário na celebração', detalhe: '20 de dezembro, às 16h' },
      ],
      programacao: [
        { data: d(12, 8), titulo: 'Abertura da arrecadação', local: 'Recepção do Hospital São Vicente de Paulo', horario: '8h' },
        { data: d(12, 20), titulo: 'Celebração de Natal', local: 'Pátio do hospital', horario: '16h' },
      ],
      responsavel_id: 'u-larissa', publicado: false, publicado_em: null, publicado_por: null,
    },
  ];

  const campanha_apoio: CampanhaApoio[] = [];
  campanhas.forEach((c) => formas_apoio.forEach((a) => campanha_apoio.push({ id: `${c.id}-${a.id}`, campanha_id: c.id, apoio_id: a.id })));

  let n = 0;
  const t = (campanha_id: string, titulo: string, responsavel_id: string, prazo: string, prioridade: Tarefa['prioridade'], status: Tarefa['status'], etapa: Tarefa['etapa'], descricao = ''): Tarefa =>
    ({ id: `t-${++n}`, campanha_id, titulo, descricao, responsavel_id, prazo, prioridade, status, etapa, criado_por: 'u-larissa', criado_em: atras(60 * 24 * 30) });

  const tarefas: Tarefa[] = [
    // Novembro Azul (quase encerrado)
    t('c-novembro', 'Criar briefing da campanha', 'u-larissa', d(11, 1), 'media', 'concluido', 'planejamento'),
    t('c-novembro', 'Mapear canais de divulgação', 'u-larissa', d(11, 2), 'baixa', 'concluido', 'planejamento'),
    t('c-novembro', 'Definir mensagem principal', 'u-larissa', d(11, 4), 'alta', 'concluido', 'planejamento'),
    t('c-novembro', 'Preparar legenda', 'u-marcelo', d(11, 4), 'media', 'concluido', 'producao'),
    t('c-novembro', 'Criar arte para Instagram', 'u-marcelo', d(11, 5), 'alta', 'em_revisao', 'producao', 'Criar card principal e variações para stories conforme briefing.'),
    t('c-novembro', 'Enviar material para gráfica', 'u-marcelo', d(11, 7), 'media', 'concluido', 'producao'),
    t('c-novembro', 'Publicar campanha no portal', 'u-larissa', d(11, 6), 'alta', 'concluido', 'publicacao'),
    t('c-novembro', 'Registrar resultados da caminhada', 'u-larissa', rel(3), 'media', 'em_andamento', 'publicacao'),
    // Natal Solidário (em preparação — ótima para o teste no hospital)
    t('c-natal', 'Confirmar data da celebração', 'u-larissa', rel(1), 'alta', 'a_fazer', 'planejamento'),
    t('c-natal', 'Validar formas oficiais de apoio', 'u-larissa', rel(2), 'alta', 'a_fazer', 'planejamento'),
    t('c-natal', 'Definir pontos de coleta', 'u-larissa', rel(-1), 'media', 'em_andamento', 'planejamento'),
    t('c-natal', 'Criar card de lançamento', 'u-marcelo', rel(2), 'alta', 'em_andamento', 'producao', 'Card 1080 × 1350 px para o feed, com linguagem acolhedora.'),
    t('c-natal', 'Criar cartaz para a recepção', 'u-marcelo', rel(5), 'media', 'a_fazer', 'producao'),
    t('c-natal', 'Revisar texto da página da campanha', 'u-larissa', rel(3), 'media', 'em_revisao', 'aprovacao'),
    t('c-natal', 'Publicar campanha no portal', 'u-larissa', rel(6), 'alta', 'a_fazer', 'publicacao'),
    t('c-natal', 'Criar briefing da campanha', 'u-larissa', rel(-4), 'media', 'concluido', 'planejamento'),
  ];

  const materiais: Material[] = [
    { id: 'm-1', campanha_id: 'c-novembro', titulo: 'Card principal — Instagram', tipo: 'Card para Instagram', briefing: 'Card principal para lançamento da campanha. Destacar a mensagem de prevenção e manter linguagem acolhedora.', formato: '1080 × 1350 px', arquivo_url: null, arquivo_nome: 'novembro-azul-feed-v03.png', legenda: 'Cuidar também é coisa de homem.', versao: 3, status: 'aguardando_aprovacao', publico: true, autor_id: 'u-marcelo', atualizado_em: atras(25), criado_em: atras(60 * 24 * 3) },
    { id: 'm-2', campanha_id: 'c-novembro', titulo: 'Cartaz A3 — Caminhada', tipo: 'Cartaz', briefing: 'Cartaz para a recepção com data, horário e local da Caminhada Azul.', formato: 'A3', arquivo_url: null, arquivo_nome: 'novembro-azul-cartaz-v02.png', legenda: 'Caminhada Azul — 17 de novembro, às 7h.', versao: 2, status: 'aprovado', publico: true, autor_id: 'u-marcelo', atualizado_em: atras(60), criado_em: atras(60 * 24 * 10) },
    { id: 'm-3', campanha_id: 'c-novembro', titulo: 'Stories — Sequência 01', tipo: 'Stories', briefing: 'Sequência de 3 stories convidando para a palestra.', formato: '1080 × 1920 px', arquivo_url: null, arquivo_nome: 'novembro-azul-stories-v01.png', legenda: '', versao: 1, status: 'ajuste_solicitado', publico: false, autor_id: 'u-marcelo', atualizado_em: atras(60 * 5), criado_em: atras(60 * 24 * 4) },
    { id: 'm-4', campanha_id: 'c-novembro', titulo: 'Legenda oficial', tipo: 'Legenda', briefing: 'Texto oficial para as publicações da campanha.', formato: 'Texto', arquivo_url: null, arquivo_nome: null, legenda: 'Neste Novembro Azul, o Hospital São Vicente de Paulo convida você a cuidar da saúde sem tabus. Participe da palestra e da caminhada!', versao: 2, status: 'em_producao', publico: false, autor_id: 'u-marcelo', atualizado_em: atras(60 * 8), criado_em: atras(60 * 24 * 4) },
    { id: 'm-5', campanha_id: 'c-natal', titulo: 'Card de lançamento — Natal Solidário', tipo: 'Card para Instagram', briefing: 'Card para anunciar a campanha e os pontos de coleta.', formato: '1080 × 1350 px', arquivo_url: null, arquivo_nome: 'natal-solidario-card-v01.png', legenda: 'Uma rede de afeto para nossa comunidade.', versao: 1, status: 'aguardando_aprovacao', publico: true, autor_id: 'u-marcelo', atualizado_em: atras(60 * 3), criado_em: atras(60 * 24) },
  ];

  const versoes_material: VersaoMaterial[] = [
    { id: 'v-1', material_id: 'm-1', versao: 1, arquivo_url: null, arquivo_nome: 'novembro-azul-feed-v01.png', nota: 'Primeira versão', autor_id: 'u-marcelo', criado_em: atras(60 * 24 * 3) },
    { id: 'v-2', material_id: 'm-1', versao: 2, arquivo_url: null, arquivo_nome: 'novembro-azul-feed-v02.png', nota: 'Revisão após comentários', autor_id: 'u-marcelo', criado_em: atras(60 * 24) },
    { id: 'v-3', material_id: 'm-1', versao: 3, arquivo_url: null, arquivo_nome: 'novembro-azul-feed-v03.png', nota: 'Ajuste de contraste e título', autor_id: 'u-marcelo', criado_em: atras(25) },
    { id: 'v-4', material_id: 'm-2', versao: 2, arquivo_url: null, arquivo_nome: 'novembro-azul-cartaz-v02.png', nota: 'Data da caminhada atualizada', autor_id: 'u-marcelo', criado_em: atras(60 * 30) },
    { id: 'v-5', material_id: 'm-3', versao: 1, arquivo_url: null, arquivo_nome: 'novembro-azul-stories-v01.png', nota: 'Primeira versão', autor_id: 'u-marcelo', criado_em: atras(60 * 24 * 2) },
    { id: 'v-6', material_id: 'm-5', versao: 1, arquivo_url: null, arquivo_nome: 'natal-solidario-card-v01.png', nota: 'Primeira versão', autor_id: 'u-marcelo', criado_em: atras(60 * 3) },
  ];

  const aprovacoes: Aprovacao[] = [
    { id: 'ap-1', material_id: 'm-1', revisor_id: 'u-larissa', decisao: 'ajustes', comentario: 'Aumentar o contraste do título.', criado_em: atras(60 * 20) },
    { id: 'ap-2', material_id: 'm-2', revisor_id: 'u-larissa', decisao: 'aprovado', comentario: 'Aprovado para impressão.', criado_em: atras(60) },
    { id: 'ap-3', material_id: 'm-3', revisor_id: 'u-larissa', decisao: 'ajustes', comentario: 'Incluir o horário da palestra no segundo story.', criado_em: atras(60 * 5) },
  ];

  const resultados: Resultado[] = [
    { id: 'r-nov', campanha_id: 'c-novembro', participantes: 186, meta_participantes: 230, camisas: 94, meta_camisas: 120, valor_arrecadado: 8460, meta_valor: 12000, observacoes: 'Valores informados pela equipe (dados fictícios).', aprendizados: 'A divulgação antecipada da caminhada aumentou a participação. Para a próxima edição, envolver parceiros locais desde o início e antecipar a produção das camisas.', atualizado_em: atras(60 * 24) },
    { id: 'r-out', campanha_id: 'c-outubro', participantes: 240, meta_participantes: 200, camisas: 130, meta_camisas: 150, valor_arrecadado: 10200, meta_valor: 10000, observacoes: 'Dados fictícios.', aprendizados: 'A parceria com a rádio local ampliou o alcance.', atualizado_em: atras(60 * 24 * 20) },
  ];

  const atividades: Atividade[] = [
    { id: 'at-1', usuario_id: 'u-marcelo', campanha_id: 'c-novembro', acao: 'enviou uma nova versão', detalhe: 'Card principal — Instagram • Novembro Azul', criado_em: atras(25) },
    { id: 'at-2', usuario_id: 'u-larissa', campanha_id: 'c-novembro', acao: 'aprovou um material', detalhe: 'Cartaz A3 — Caminhada • Novembro Azul', criado_em: atras(60) },
    { id: 'at-3', usuario_id: 'u-marcelo', campanha_id: 'c-novembro', acao: 'concluiu uma tarefa', detalhe: 'Preparar legenda • Novembro Azul', criado_em: atras(180) },
    { id: 'at-4', usuario_id: 'u-marcelo', campanha_id: 'c-natal', acao: 'enviou um material para aprovação', detalhe: 'Card de lançamento • Natal Solidário', criado_em: atras(185) },
  ];

  return { perfis, configuracoes, formas_apoio, campanhas, campanha_apoio, tarefas, materiais, versoes_material, aprovacoes, resultados, atividades };
}
