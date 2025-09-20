# Salão de Beleza - Sistema de Agendamento

Este é um sistema completo de agendamento para salão de beleza, desenvolvido com HTML, CSS e JavaScript, utilizando localStorage para armazenamento de dados.

## Funcionalidades

### Para Clientes:
- Agendamento de serviços (corte, coloração, manicure, pedicure, depilação, massagem)
- Seleção de data e horário através de interface visual
- Visualização de horários disponíveis em tempo real
- Confirmação de agendamento

### Para Administradores:
- Login seguro
- Dashboard com estatísticas de agendamentos
- Visualização de todos os agendamentos
- Filtros por data, serviço e busca por nome/email/telefone
- Edição e exclusão de agendamentos
- Exportação de dados para CSV
- Gerenciamento de administradores

## Tecnologias Utilizadas

- HTML5
- CSS3 (com Flexbox e Grid)
- JavaScript (ES6+)
- Font Awesome para ícones
- localStorage para armazenamento de dados

## Como Usar

1. Abra `index.html` no navegador para acessar a página de agendamento
2. Para acessar o painel administrativo, clique no link "Área Administrativa" ou acesse `admin.html`
3. Faça login com as credenciais padrão:
   - Usuário: admin
   - Senha: admin123
4. É possível criar novos administradores através da página de login

## Deploy

Este projeto pode ser hospedado em qualquer serviço de hospedagem web estática como:
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting

Basta fazer upload de todos os arquivos para o serviço escolhido.

## Observações

- Os dados são armazenados localmente no navegador usando localStorage
- Não há backend ou banco de dados externo
- Para uso em produção, recomenda-se implementar um backend com banco de dados para persistência real dos dados