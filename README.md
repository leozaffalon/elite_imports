# Elite Aromas - Perfumes Importados Originais

Site completo em **Next.js + TypeScript** com:

- Home com design responsivo e animacoes
- Catalogo de perfumes com imagens
- Carrinho que direciona o pedido para o WhatsApp (+55 19 99257-2980)
- Backend via rotas API do Next
- Painel admin com login para CRUD do catalogo
- Credenciais admin isoladas em `.env.local` (ignorado pelo Git)

## 1) Rodar localmente

```bash
npm install
npm run dev
```

Acesse:

- Loja: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

## 2) Credenciais admin

Arquivo `.env.local` (na raiz):

```env
ADMIN_USERNAME=admin_dodo
ADMIN_PASSWORD=TroqueAgora@123
SESSION_SECRET=seu-segredo-forte
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx
BLOB_PUBLIC_MENU_URL=https://seu-store-id.public.blob.vercel-storage.com/catalog/menu.json
```

Essas variaveis ja estao fora do Git via `.gitignore`.

## 3) API Backend

- `POST /api/login` -> autentica admin e cria cookie `httpOnly`
- `POST /api/logout` -> encerra sessao admin
- `GET /api/menu` -> catalogo publico
- `GET /api/admin/menu` -> lista catalogo (admin)
- `POST /api/admin/menu` -> cria item (admin)
- `PUT /api/admin/menu/:id` -> atualiza item (admin)
- `DELETE /api/admin/menu/:id` -> remove item (admin)
- `POST /api/orders` -> cria pedido

## 4) Persistencia

Os dados sao salvos em:

- `data/menu.json`
- `data/orders.json`

Para deploy no Vercel, configure `BLOB_READ_WRITE_TOKEN` para persistir catalogo e pedidos entre funcoes serverless.
Configure tambem `BLOB_PUBLIC_MENU_URL` com a URL publica de `catalog/menu.json` do seu Blob.
Sem esse token em producao, o admin nao consegue salvar alteracoes de forma duravel.

## 5) Deploy no Vercel

1. Suba o projeto no GitHub.
2. Importe o repo no [Vercel](https://vercel.com/).
3. Em **Project Settings > Environment Variables**, configure:
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
   - `BLOB_READ_WRITE_TOKEN`
   - `BLOB_PUBLIC_MENU_URL`
4. Deploy.
