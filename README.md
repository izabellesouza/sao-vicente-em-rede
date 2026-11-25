# São Vicente em Rede

Portal público e organizador interno para as campanhas de saúde e solidariedade do **Hospital São Vicente de Paulo** (João Pessoa – PB).

Projeto extensionista — **Anne Izabelle Pereira de Souza** (portal público) e **Thiago Fernandes Alves Pinto** (organizador interno) — PUCPR.

| Área | Endereço | Responsável |
|---|---|---|
| Apresentação do projeto | `/` | — |
| Portal público (comunidade) | `/portal` | Iza |
| Organizador interno (equipe) | `/organizador` | Thiago |

**Tecnologias:** React + TypeScript + Vite, Supabase (login, banco PostgreSQL e arquivos), hospedagem na Vercel e código no GitHub. Tudo nas versões gratuitas.

---

## 1. Rodar no computador (15 minutos)

Pré-requisitos: [Node.js LTS](https://nodejs.org) e [VS Code](https://code.visualstudio.com).

```bash
# dentro da pasta do projeto
npm install
npm run dev
```

Abra o endereço que aparecer (normalmente http://localhost:5173).

Sem configurar nada, o sistema abre em **modo demonstração**: dados de exemplo salvos só no navegador. Na tela de login existem botões de acesso rápido (senha das contas de demonstração: `demo123`).

> Para recomeçar uma demonstração do zero: Organizador › Configurações › **Restaurar dados de demonstração**.

---

## 2. Ligar o Supabase (dados compartilhados entre todos)

Necessário para o teste no hospital, quando várias pessoas usam ao mesmo tempo.

1. Crie uma conta em [supabase.com](https://supabase.com) › **New project** (região: São Paulo). Guarde a senha do banco.
2. Menu **SQL Editor** › **New query** › cole todo o arquivo `supabase/01_estrutura.sql` › **Run**.
3. Nova query › cole `supabase/02_dados_iniciais.sql` › **Run**.
4. Menu **Authentication › Sign In / Providers › Email**: **desative "Confirm email"** (assim as contas criadas pelo administrador já entram direto).
5. Menu **Authentication › Users › Add user › Create new user**: crie a conta do administrador (ex.: o e-mail de vocês).
   **A primeira conta criada vira administradora automaticamente.**
6. Menu **Project Settings › API**: copie **Project URL** e **anon public key**.
7. Na pasta do projeto, copie `.env.example` para `.env` e cole os dois valores:

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

8. Pare e rode de novo `npm run dev`. A faixa amarela de "modo demonstração" some.
9. Entre como administrador › **Usuários › Adicionar usuário** e crie as contas da equipe do hospital, escolhendo o perfil de cada um:

| Perfil | Quem é | O que pode fazer |
|---|---|---|
| Conceito e planejamento | Administrador responsável pelo conceito da campanha | Cria campanhas, distribui tarefas, aprova materiais, publica no portal, registra resultados |
| Publicações e materiais | Pessoa responsável pelas publicações | Vê briefings, atualiza as próprias tarefas, envia materiais e novas versões |
| Administrador | Iza e Thiago no piloto (depois, o hospital) | Tudo + contas, perfis e dados institucionais |
| Consulta | Gestão / equipe assistencial | Apenas visualiza |

10. Em **Configurações**, troque telefone, WhatsApp, e-mail, endereço e redes sociais pelos **oficiais do hospital**.

### Segurança (regras no próprio banco)

- A comunidade só enxerga campanhas **publicadas** e materiais **aprovados**.
- Contas criadas fora do painel nascem **bloqueadas** até o administrador liberar.
- Só a coordenação aprova materiais e publica campanhas, mesmo se alguém tentar pela API.
- Ninguém altera o próprio perfil de acesso.
- Não há dados de pacientes, dados clínicos nem dados bancários. O portal não recebe pagamentos, e o formulário de contato abre o WhatsApp ou o e-mail oficial sem guardar dados.

---

## 3. Publicar na internet (Vercel)

1. Suba o projeto para um repositório no **GitHub** (sem o arquivo `.env`, que já está no `.gitignore`).
2. Em [vercel.com](https://vercel.com) › **Add New › Project** › importe o repositório.
3. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (os mesmos do `.env`).
4. **Deploy**. Você recebe um endereço como `sao-vicente-em-rede.vercel.app`.
5. QR Code: gere em qualquer gerador gratuito apontando para `https://SEU-ENDERECO/portal`.

O arquivo `vercel.json` já faz as rotas (`/portal/campanhas/...`) funcionarem ao recarregar a página.

---

## 4. Foto da página inicial

Coloque uma foto **autorizada** da equipe em `public/imagens/equipe.jpg` (de preferência horizontal, com cerca de 1200 px). Sem a foto, o site mostra uma ilustração no lugar.

---

## 5. Estrutura do código

```
src/
  lib/            base compartilhada
    backend.ts    acesso a dados (Supabase ou modo demonstração)
    auth.tsx      login e permissões por perfil
    dados.ts      regras de negócio (situação, progresso, histórico)
    router.tsx    navegação entre páginas
    types.ts      modelo de dados (slide 16)
    seed.ts       dados de exemplo do modo demonstração
  projeto/        página de apresentação do projeto
  portal/         PORTAL PÚBLICO (Iza): Início, Campanhas, Calendário,
                  página da campanha, Como apoiar, Contato
  organizador/    ORGANIZADOR INTERNO (Thiago): Visão geral, Campanhas,
                  Calendário, Tarefas, Materiais, Aprovações,
                  Conteúdo público, Resultados, Usuários, Configurações
  styles/         identidade visual (base, portal, organizador)
supabase/
  01_estrutura.sql      tabelas, regras de acesso e gatilhos
  02_dados_iniciais.sql campanhas do calendário e canais de apoio
docs/
  ROTEIRO_DE_TESTE.md   roteiro para a validação com a equipe do hospital
```

## 6. Fluxo de uma campanha

1. **Planejamento:** a coordenação cria a campanha (conceito, período, participação, programação, canais de apoio).
2. **Tarefas:** distribui as tarefas com responsável, prazo e prioridade no quadro.
3. **Produção:** a pessoa responsável pelas publicações envia os materiais (arte e legenda).
4. **Aprovação:** a coordenação aprova ou pede ajustes com comentário, e cada versão fica no histórico.
5. **Publicação:** em *Conteúdo público*, a coordenação confere o checklist e libera a campanha para o portal.
6. **Resultados:** a equipe registra participantes, camisas, arrecadação (só totais) e aprendizados, e pode gerar o relatório em PDF pelo navegador.
