# LinkTap Pro

Crie um SaaS chamado TapLink NFC.

OBJETIVO

Permitir que qualquer pessoa crie uma página estilo Linktree para ser acessada através de URL, QR Code e futuramente Tags NFC.

IMPORTANTE:

Os perfis DEVEM ser salvos permanentemente no banco de dados Supabase.

NÃO utilizar Local Storage para armazenar os perfis.

Todos os perfis devem permanecer disponíveis após atualização da página ou publicação do projeto.

==================================================

TECNOLOGIAS

==================================================

- React

- TypeScript

- Tailwind CSS

- Shadcn UI

- Supabase

Configurar integração completa com Supabase.

==================================================

BANCO DE DADOS

==================================================

Criar tabela:

profiles

Campos:

id (uuid)

slug (texto único)

photo_url

name

bio

instagram

facebook

tiktok

youtube

linkedin

whatsapp

telegram

twitter

website

custom_links (json)

created_at

updated_at

Criar índice único para slug.

==================================================

FLUXO

==================================================

SEM LOGIN nesta primeira versão.

Qualquer visitante pode:

1. Criar perfil

2. Publicar perfil

3. Receber URL única

Exemplo:

/profile/abc123

Ao publicar:

- Salvar no Supabase

- Gerar slug único automaticamente

- Retornar URL pública

==================================================

HOME PAGE

==================================================

Hero principal moderno.

Título:

"Seu perfil digital em um toque"

Subtítulo:

"Crie uma página personalizada para compartilhar por QR Code e NFC."

Botão:

Criar Meu Link

Visual premium.

==================================================

FORMULÁRIO

==================================================

SEÇÃO PERFIL

- Upload de foto

- Nome

- Bio

==================================================

REDES SOCIAIS

==================================================

Campos opcionais:

Instagram

Facebook

TikTok

YouTube

LinkedIn

WhatsApp

Telegram

X/Twitter

Website

==================================================

LINKS PERSONALIZADOS

==================================================

Permitir adicionar múltiplos links.

Campos:

Título

URL

Botão:

Adicionar Link

Salvar todos no campo JSON custom_links.

==================================================

PREVIEW EM TEMPO REAL

==================================================

Mostrar:

Foto

Nome

Bio

Redes sociais

Links personalizados

Atualização instantânea.

==================================================

PUBLICAR

==================================================

Botão:

Publicar Perfil

Ao clicar:

1. Validar formulário

2. Fazer upload da foto para Supabase Storage

3. Salvar perfil no banco

4. Gerar slug único

5. Criar URL pública

Exemplo:

https://dominio.com/profile/abc123

==================================================

PÁGINA PÚBLICA

==================================================

Rota dinâmica:

/profile/:slug

Buscar dados diretamente do Supabase.

Mostrar:

- Foto circular

- Nome

- Bio

- Redes sociais

- Links personalizados

Design extremamente bonito.

Mobile first.

==================================================

QR CODE

==================================================

Após publicação:

Gerar QR Code da URL pública.

Mostrar:

Link

QR Code

Botões:

- Copiar Link

- Compartilhar

- Baixar QR Code

==================================================

NFC READY

==================================================

Adicionar seção:

"Pronto para NFC"

Texto:

"Utilize esta URL para gravar em qualquer Tag NFC compatível."

==================================================

DESIGN

==================================================

Tema escuro premium.

Inspirado em:

- Linktree

- Beacons

- Bento.me

Utilizar:

- Glassmorphism

- Bordas arredondadas

- Sombras suaves

- Animações modernas

==================================================

REGRAS IMPORTANTES

==================================================

- Todos os perfis devem ser persistidos no Supabase.

- Nenhum dado importante deve depender de Local Storage.

- O perfil deve continuar funcionando mesmo após atualizar a página.

- As páginas públicas devem ser indexáveis.

- Código limpo e escalável.

- Preparar estrutura para futura integração com login e gravação de Tags NFC.

ENTREGAR O PROJETO COMPLETO E FUNCIONAL.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://taplink-digital-me.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/68720da3-6c40-48a8-9716-e8f495180a3b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
