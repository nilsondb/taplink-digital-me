# Authera Link Card — produção no JARVIS

Domínio oficial: `https://link.authera.ia.br`

## Arquitetura

- Aplicação: container `authera-link-card`
- Porta local/Tailscale: `8085`
- Banco: `/srv/nilson/data/authera-link-card/authera-link-card.db`
- Uploads: `/srv/nilson/data/authera-link-card/uploads`
- Publicação: Cloudflare Tunnel remoto
- Tunnel container: `authera-link-card-tunnel`

## Cloudflare Tunnel

No Cloudflare Dashboard:

1. Networking > Tunnels > Create Tunnel.
2. Nome sugerido: `authera-link-card`.
3. Copiar somente o token do Tunnel para `CLOUDFLARE_TUNNEL_TOKEN` no `.env` do JARVIS.
4. Criar Published application/Public hostname:
   - Hostname: `link.authera.ia.br`
   - Service type: HTTP
   - Service URL: `http://authera-link-card:3000`
5. Não abrir a porta 8085 no roteador/firewall para a Internet.

Subir:

```bash
docker compose --profile public up -d
```

Validar:

```bash
docker compose ps
curl -fsS http://127.0.0.1:8085/api/health
curl -I https://link.authera.ia.br
```

## Backup

Backup manual consistente do banco SQLite + uploads:

```bash
chmod +x ops/backup-authera-link-card.sh
./ops/backup-authera-link-card.sh
```

Para gravar dentro de um backup diário já aberto pelo SRV-IA:

```bash
./ops/backup-authera-link-card.sh /CAMINHO/DO/BACKUP/atual/authera-link-card
```

O script usa `.backup` do SQLite, executa `PRAGMA integrity_check`, compacta uploads e gera SHA256SUMS.

## Segurança

- `.env` não deve ser commitado.
- O token do Cloudflare Tunnel é segredo e deve permanecer somente no JARVIS.
- O SQLite não deve ser exposto diretamente.
- A porta 8085 pode permanecer acessível apenas na LAN/Tailscale; o acesso público deve passar pelo Cloudflare Tunnel.
