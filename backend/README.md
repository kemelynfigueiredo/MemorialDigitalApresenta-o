# Backend do Memorial Digital

Este backend foi reorganizado seguindo um padrão comum de arquitetura em Node.js com Express, separando responsabilidades por camadas:

- config: configuração de infraestrutura
- controllers: lógica de requisição/resposta
- routes: definição das rotas da API
- middleware: autenticação e filtros
- lib: integrações externas e clientes

## Estrutura

```text
backend/
├── src/
│   ├── app.js                 # configuração do Express e middlewares globais
│   ├── server.js              # ponto de entrada da aplicação
│   ├── config/
│   │   └── upload.js          # configuração do Multer para uploads de imagens
│   ├── controllers/
│   │   ├── authController.js  # login e verificação do banco
│   │   └── memorialController.js # CRUD de memoriais
│   ├── lib/
│   │   └── prisma.js          # cliente Prisma
│   ├── middleware/
│   │   └── auth.js            # autenticação do administrador
│   └── routes/
│       ├── auth.routes.js     # rotas de autenticação
│       └── memorial.routes.js # rotas de memoriais
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── uploads/
│   └── arquivos enviados pelo sistema
├── .env.example
├── package.json
├── prisma.config.ts
├── server.js
└── README.md
```

## Responsabilidades por pasta

### src/app.js
Centraliza a criação do app Express, CORS, JSON parsing, serve de arquivos estáticos e registra as rotas principais.

### src/server.js
Arquivo mínimo de bootstrap. Responsável por iniciar a aplicação na porta configurada.

### src/config/
Contém configurações de infraestrutura como upload de arquivos e outros parâmetros do ambiente.

### src/controllers/
Recebem as requisições HTTP e executam a lógica de negócio, chamando o Prisma ou outros serviços.

### src/routes/
Definem os endpoints da API e conectam cada rota ao controller correspondente.

### src/middleware/
Contém funções que interceptam requisições, como autenticação de admin.

### src/lib/
Armazena clientes e integrações externas, como Prisma.

## Rotas principais

### Autenticação
- `POST /api/login`
- `GET /api/teste-banco`

### Memorial
- `GET /api/memoriais`
- `GET /api/memoriais/:id`
- `POST /api/memoriais`
- `PUT /api/memoriais/:id`
- `DELETE /api/memoriais/:id`

## Como rodar

```bash
npm install
npm run dev
```

Ou em produção:

```bash
npm start
```

## Observações

- O upload de imagens fica em `uploads/`.
- A autenticação usa JWT.
- A API usa Prisma para acesso ao banco de dados.
- O arquivo `src/server.js` foi mantido simples para facilitar manutenção e leitura.
