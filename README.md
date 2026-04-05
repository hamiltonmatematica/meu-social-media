<<<<<<< HEAD
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/72d52551-a373-430c-b7da-9482c8e2b835

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
=======
# ContentPlatformCore 🚀

Arquitetura Full-Stack Next.js focada em automação de redes sociais com **IA Generativa** e **Proteção Máxima**.

## 🛡️ Tutorial de Primeiro Acesso (PT-BR)

Bem-vindo ao motor autônomo de conteúdo. Siga os passos abaixo para garantir que sua operação esteja segura e funcional.

### 1. Configuração de Segurança (Supabase)
O projeto utiliza **Row Level Security (RLS)** por padrão. Certifique-se de aplicar o script de migração:
`supabase/migrations/20260405_maximum_protection.sql` via Supabase SQL Editor.

### 2. Variáveis de Ambiente (.env)
Adicione as seguintes chaves ao seu arquivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=seu_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_secreta_ADMIN (Mantenha Segura!)
```

### 3. Rodando o Motor IA
Para iniciar o ambiente de desenvolvimento:
```bash
npm install
npm run dev
```
Acesse `http://localhost:3000/tutorial` para o fluxo de onboarding guiado.

## ✨ Recursos de Elite
- **Motor IA Gráfico**: Integração com DALL-E e Canvas Builder.
- **Fila de Publicação**: Redis/Upstash para agendamento garantido.
- **Proteção Máxima**: Headers de segurança (CSP, HSTS) e RLS em nível de banco.

---
Desenvolvido por **Antigravity AI** para Hamilton Vinícius.
>>>>>>> 3983e56 (feat: implementada Proteção Máxima e Tutorial PT-BR)
