# Memorial Digital API

API do backend do projeto Memorial Digital, responsável por gerenciar o cadastro de memoriais, autenticação administrativa e upload de imagens/galeria.

## Tecnologias

- Python 3
- Flask
- Flask-SQLAlchemy
- PostgreSQL/SQLite
- JWT para autenticação
- pytest para testes

## Estrutura do projeto

```bash
backend/
├── app.py                 # criação da aplicação Flask
├── config.py              # configuração da app e variáveis de ambiente
├── extensions.py          # extensões do Flask (db, cors)
├── models.py              # modelos do banco de dados
├── requirements.txt       # dependências do backend
├── run.py                 # ponto de entrada para executar a API
├── .env.example           # exemplo de variáveis de ambiente
├── uploads/               # arquivos enviados pela API
├── helpers/               # utilitários auxiliares
├── routes/                # endpoints da API
├── services/              # lógica de negócio
├── tests/                 # testes automatizados
└── memorial.db            # banco SQLite local (quando usado sem DATABASE_URL)
```

## Requisitos

- Python 3.10+
- pip
- ambiente virtual opcional (`venv`)

## Configuração do ambiente

1. Acesse a pasta do backend:

```bash
cd backend
```

2. Crie e ative um ambiente virtual:

```bash
python -m venv .venv
source .venv/bin/activate
```

3. Instale as dependências:

```bash
pip install -r requirements.txt
```

4. Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

5. Ajuste as variáveis no `.env` conforme o ambiente:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
JWT_SECRET="gere-um-segredo-longo-e-aleatorio"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
CORS_ORIGINS="http://localhost:5173"
```

Observações:
- Se `DATABASE_URL` não for informada, a aplicação usa SQLite local em `backend/memorial.db`.
- `ADMIN_PASSWORD_HASH` pode ser configurado para um hash BCrypt, caso queira substituir a senha padrão.
- `CORS_ORIGINS` aceita múltiplas origens separadas por vírgula.

## Executando a API

Na pasta `backend`, rode:

```bash
python run.py
```

A API fica disponível em:

```text
http://localhost:3001
```

Também é possível executar com Flask diretamente:

```bash
export FLASK_APP=app.py
flask run --host 0.0.0.0 --port 3001
```

## Autenticação

A autenticação administrativa é feita com JWT.

### Login

```http
POST /api/login
Content-Type: application/json
```

Body:

```json
{
  "email": "admin@memorial.com",
  "password": "admin123"
}
```

Resposta esperada:

```json
{
  "success": true,
  "token": "<jwt_token>"
}
```

Para rotas protegidas, envie o token no header:

```http
Authorization: Bearer <jwt_token>
```

## Endpoints

### Saúde da API

```http
GET /
```

Retorna uma mensagem indicando que a API está funcionando.

### Verificação do banco

```http
GET /api/teste-banco
```

Retorna se o banco está acessível e quantos memoriais existem.

### Login do administrador

```http
POST /api/login
```

### Listar memoriais

```http
GET /api/memoriais
```

### Buscar memorial por ID

```http
GET /api/memoriais/<id>
```

### Criar memorial

```http
POST /api/memoriais
Authorization: Bearer <jwt_token>
```

Aceita `form-data` com campos como:
- `nome`
- `biografia`
- `descricao`
- `dataNascimento`
- `dataMorte`
- `localizacao`
- `tipo`
- `imagem`
- `galeria`

### Atualizar memorial

```http
PUT /api/memoriais/<id>
Authorization: Bearer <jwt_token>
```

### Excluir memorial

```http
DELETE /api/memoriais/<id>
Authorization: Bearer <jwt_token>
```

### Arquivos enviados

As imagens enviadas ficam acessíveis em:

```text
http://localhost:3001/uploads/<nome-do-arquivo>
```

## Testes

Execute a suíte de testes com:

```bash
pytest
```

Os testes cobrem:
- status da API
- login com sucesso
- listagem inicial de memoriais

## Observações importantes

- O modelo principal é `Memorial` em `models.py`.
- Os endpoints de criação/alteração/exclusão exigem autenticação de administrador.
- O projeto usa uploads em pasta local do backend, portanto a pasta `uploads/` precisa estar acessível e com permissões corretas.
- Em desenvolvimento, a aplicação usa `debug=True` e a porta `3001`.

## Dicas de produção

- Configure um banco PostgreSQL real em `DATABASE_URL`.
- Use um `JWT_SECRET` forte e diferente para cada ambiente.
- Defina `CORS_ORIGINS` com os domínios corretos do frontend.
- Evite expor senhas padrão em ambientes compartilhados ou de produção.
