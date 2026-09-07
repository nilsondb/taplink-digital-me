# Authera Link Card

**Sua presença digital em um toque.**

Authera Link Card é um cartão/perfil digital para compartilhar identidade, redes sociais, links, eventos e contatos por URL, QR Code e NFC.

## Arquitetura JARVIS

Esta branch elimina a dependência do Supabase. A aplicação roda como um único serviço Docker com:

- React + TanStack Start
- Node.js 22
- SQLite local (`better-sqlite3`)
- autenticação própria com senha protegida por `scrypt`
- sessão por cookie HttpOnly
- uploads de foto em armazenamento local persistente
- painel administrativo
- estatísticas de visualizações e cliques
- endpoints para integração com SaaS Center

### Persistência

No JARVIS, o `docker-compose.yml` monta:

```text
/srv/nilson/data/authera-link-card
        ├── authera-link-card.db
        └── uploads/
```

O banco usa WAL, foreign keys, busy timeout e transações para os contadores.

## Primeiro deploy no JARVIS

```bash
cd /srv/nilson/apps

git clone -b authera-link-card-local \
  https://github.com/nilsondb/taplink-digital-me.git \
  authera-link-card

cd /srv/nilson/apps/authera-link-card

cp .env.example .env
nano .env
```

Antes de subir, ajuste pelo menos:

```env
APP_URL=http://192.168.100.37:8085
BOOTSTRAP_ADMIN_EMAIL=seu-email@exemplo.com
```

Crie o diretório persistente e entregue a propriedade ao UID do usuário `node` do container (1000):

```bash
sudo mkdir -p /srv/nilson/data/authera-link-card/uploads
sudo chown -R 1000:1000 /srv/nilson/data/authera-link-card
sudo chmod -R 750 /srv/nilson/data/authera-link-card
```

Suba:

```bash
docker compose up -d --build
```

Acesse:

```text
http://192.168.100.37:8085
```

Valide:

```bash
curl -s http://127.0.0.1:8085/api/health

docker compose ps

docker logs --tail 100 authera-link-card
```

## Conta administradora

O e-mail definido em `BOOTSTRAP_ADMIN_EMAIL` recebe papel `admin` quando fizer o cadastro. Nenhuma senha padrão é criada pelo sistema.

## Recuperação de senha

O backend suporta SMTP. Enquanto `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` e `SMTP_FROM` não estiverem configurados, o login/cadastro funcionam normalmente, mas o envio de recuperação de senha permanece desativado de forma segura.

## Backup

Inclua no backup do SRV-IA:

```text
/srv/nilson/data/authera-link-card/
```

Para backup consistente do SQLite em execução, prefira a API de backup do SQLite ou o comando `.backup`, por exemplo:

```bash
sqlite3 /srv/nilson/data/authera-link-card/authera-link-card.db \
  ".backup '/caminho/do/backup/authera-link-card.db'"
```

Validação:

```bash
sqlite3 /srv/nilson/data/authera-link-card/authera-link-card.db \
  "PRAGMA integrity_check;"
```

## Segurança

- não versionar `.env`
- não expor o arquivo SQLite diretamente
- manter `/srv/nilson/data/authera-link-card` fora da raiz pública
- usar HTTPS quando o serviço for publicado na internet
- gerar token longo na tela de integração do SaaS Center
- configurar SMTP antes de disponibilizar a recuperação de senha ao público
