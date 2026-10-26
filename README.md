# JS — Análises com Base e Conteúdo

## O que funciona
- Cotações reais fornecidas pela API Brapi em `/api/v2/stocks/quote`.
- Consulta complementar de estatísticas, perfil e dados financeiros para análise, quando disponível no plano do provedor.
- Relatórios com OpenAI API via servidor.
- Atualização automática a cada 5 minutos enquanto a aba Mercado estiver aberta.
- Carteira local, alocação por classe e exportação CSV.
- Histórico exportável de relatórios na sessão do navegador.

## Publicar no Render
1. Envie `package.json`, `server.js`, `.env.example`, `README.md` e a pasta `public` para o repositório GitHub.
2. Crie/abra o Web Service no Render ligado ao repositório.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Em Environment, crie `BRAPI_TOKEN`, `OPENAI_API_KEY` e opcionalmente `OPENAI_MODEL`.
6. Faça deploy e abra `/api/health` para verificar se as chaves estão configuradas.

Brapi: https://brapi.dev/dashboard e https://brapi.dev/docs
OpenAI: https://platform.openai.com/api-keys

## Importante antes de vender
Este é um MVP funcional, não uma corretora nem um sistema de recomendação de investimentos. A disponibilidade, cobertura, atraso e direitos de redistribuição de dados dependem do contrato/plano do fornecedor. Verifique as licenças de dados e os requisitos legais/regulatórios aplicáveis antes de comercializar. As chaves devem ficar apenas nas variáveis de ambiente do servidor. Para uma plataforma multiusuário comercial, implemente login, banco persistente, isolamento de dados por usuário, limites de uso, monitoramento, política de privacidade, termos de uso e proteção contra abuso. Nesta versão a carteira fica no navegador e o histórico de relatórios fica na sessão.
