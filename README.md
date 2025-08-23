# Sistema de Agendamento

Sistema completo de agendamento com área administrativa para gerenciamento de consultas, exames e procedimentos.

## Funcionalidades

### Para Usuários Comuns (Página Principal)
- **Agendamento de compromissos**: Os usuários podem agendar compromissos selecionando:
  - Nome completo
  - Email
  - Telefone
  - Data
  - Horário (selecionado no painel de horários disponíveis)
  - Tipo de serviço (consulta, exame, procedimento ou outro)
  - Observações adicionais

- **Visualização de horários**: Os usuários podem ver os horários disponíveis em tempo real, com indicação visual:
  - Verde: Horário disponível
  - Vermelho: Horário ocupado
  - Azul: Horário selecionado

- **Confirmação imediata**: Após agendar, o usuário recebe uma confirmação de que o agendamento foi realizado com sucesso.

### Para Administradores
- **Login/Cadastro**: Qualquer pessoa pode se cadastrar como administrador
- **Gerenciamento de agendamentos**: Os administradores podem:
  - Visualizar todos os agendamentos
  - Filtrar agendamentos por:
    - Data específica
    - Tipo de serviço
    - Termos de busca (nome, email, telefone)
    - Filtros rápidos (pendentes, hoje, esta semana, todos)
  - Editar qualquer agendamento
  - Excluir qualquer agendamento
- **Gerenciamento de administradores**: Os administradores podem:
  - Visualizar a lista de administradores
  - Adicionar novos administradores
  - Remover administradores (exceto a si mesmos e o último administrador)
- **Exportação de dados**: Os administradores podem exportar os agendamentos em formato CSV

## Regras de Negócio

### Agendamentos
1. **Horários disponíveis**: O sistema oferece horários fixos entre 08:00 e 17:30, com intervalos de 30 minutos
2. **Disponibilidade em tempo real**: Os horários ocupados são mostrados imediatamente como indisponíveis
3. **Não sobreposição**: Não é possível agendar dois compromissos no mesmo horário e data
4. **Validações**:
   - Todos os campos obrigatórios devem ser preenchidos
   - O horário deve ser selecionado no painel de horários
   - A data não pode ser no passado

### Administradores
1. **Acesso irrestrito**: Todos os administradores têm acesso completo a todas as funcionalidades
2. **Cadastro aberto**: Qualquer pessoa pode se cadastrar como administrador
3. **Proteção mínima**: Não é permitido remover o próprio usuário ou o último administrador do sistema
4. **Autenticação**: O acesso à área administrativa requer login

## Estrutura do Sistema

### Arquivos Principais
- `index.html`: Página principal para agendamento de compromissos
- `login.html`: Página de login e registro de administradores
- `admin.html`: Painel administrativo para gerenciamento de agendamentos
- `script.js`: Lógica do lado do cliente para o sistema de agendamento
- `admin.js`: Lógica do lado do cliente para o painel administrativo
- `styles.css`: Estilos para a página principal
- `admin-styles.css`: Estilos para o painel administrativo

### Tecnologias Utilizadas
- HTML5
- CSS3
- JavaScript (ES6+)
- LocalStorage para armazenamento de dados
- Font Awesome para ícones

## Como Usar

### Para Agendamento
1. Acesse `index.html`
2. Preencha seus dados pessoais
3. Selecione a data desejada
4. Escolha um horário disponível no painel lateral
5. Selecione o tipo de serviço
6. Adicione observações, se necessário
7. Clique em "Agendar"

### Para Administradores
1. Acesse `login.html`
2. Faça login com suas credenciais ou registre-se como novo administrador
3. Após o login, você será redirecionado para `admin.html`
4. No painel administrativo, você pode:
   - Visualizar e filtrar agendamentos
   - Editar ou excluir agendamentos
   - Gerenciar outros administradores
   - Exportar dados

## Armazenamento de Dados

Todos os dados (agendamentos e administradores) são armazenados no LocalStorage do navegador:
- `appointments`: Lista de todos os agendamentos
- `admins`: Lista de administradores cadastrados
- `adminAuthenticated`: Status de autenticação do administrador
- `currentUser`: Nome do administrador atualmente logado

## Personalização

### Horários Disponíveis
Para modificar os horários disponíveis, edite a variável `timeSlots` nos arquivos:
- `script.js` (linha 5)
- `admin.js` (linha 4)

### Cores e Estilos
As folhas de estilo podem ser personalizadas nos arquivos:
- `styles.css`: Estilos da página principal
- `admin-styles.css`: Estilos do painel administrativo

## Considerações de Segurança

Este é um sistema de demonstração que utiliza LocalStorage para armazenamento de dados. Em um ambiente de produção, você deve:
1. Implementar autenticação no servidor
2. Utilizar um banco de dados seguro
3. Implementar criptografia para senhas
4. Adicionar validações no servidor
5. Proteger contra ataques XSS e CSRF

## Suporte

Para relatar problemas ou solicitar novas funcionalidades, entre em contato com a equipe de desenvolvimento.