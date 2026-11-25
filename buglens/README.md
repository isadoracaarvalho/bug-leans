# BugLens

**Enxergue além do erro.** Um protótipo de assistente para investigação de falhas de software.

## O que esta versão demonstra

- Registro de uma ocorrência com contexto.
- Conversa guiada com perguntas progressivas.
- Organização de informações confirmadas, pendentes e hipóteses.
- Geração de relatório preliminar para revisão humana.
- Seleção local de arquivos como evidências (os arquivos não são enviados nem interpretados nesta versão).

## Tecnologias

- React
- Vite
- JavaScript
- CSS
- Lucide React

## Executar localmente

Requisitos: Node.js (versão LTS recomendada) e npm.

```bash
npm install
npm run dev
```

Abra o endereço exibido no terminal, normalmente `http://localhost:5173`.

Para verificar a compilação:

```bash
npm run build
```

## Fluxo para testar

1. Na tela inicial, clique em **Experimentar exemplo** para carregar uma ocorrência fictícia.
2. Responda às perguntas progressivas da investigação.
3. Clique em **Gerar relatório**.
4. Revise os campos, os itens pendentes e os sinais para investigação.
5. Use **Copiar relatório** para copiar o resultado.

Também é possível iniciar uma investigação em branco pela opção **Nova investigação**.

## Limitações importantes desta demonstração

Esta versão é um protótipo local. As perguntas e os sinais de análise usam regras simples no navegador; **não existe integração com um modelo externo de IA nesta versão**. Os anexos são apenas selecionados localmente e seus conteúdos não são lidos. O relatório é preliminar e exige revisão humana.

Essas limitações devem ser comunicadas na apresentação. A próxima evolução prevista é adicionar um backend seguro para integração com um modelo de IA, análise real de evidências e persistência das investigações.

## Publicação no GitHub

Depois de testar localmente:

```bash
git init
git add .
git commit -m "feat: create BugLens QA investigation prototype"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/buglens.git
git push -u origin main
```

Substitua `SEU-USUARIO` pelo seu usuário do GitHub.
