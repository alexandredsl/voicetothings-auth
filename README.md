# Alexa Skill — Adicionar Tarefa ao Things

Skill pessoal que adiciona tarefas ao inbox do Things3 por voz, usando Mail-to-Things via Gmail.

## Como funciona

```
Usuário fala → Alexa NLU → Lambda (Alexa-Hosted) → Nodemailer/Gmail → @things.email → Things3
```



### Gmail App Password — já gerado

Gerado em [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
Salvar como variável de ambiente `GMAIL_APP_PASSWORD` no Developer Console (nunca no código).

### Amazon Developer Account — já existente

---

## Variáveis de ambiente

Configurar na aba **Code** do Alexa Developer Console:

| Variável             | Valor                                              |
|----------------------|----------------------------------------------------|
| `GMAIL_USER`         | Seu endereço Gmail remetente                       |
| `GMAIL_APP_PASSWORD` | App Password gerado no Google (16 caracteres)      |

---

## Deploy via ASK CLI

```bash
# Instalar e configurar ASK CLI (uma vez)
npm install -g ask-cli
ask configure          # autenticar com conta Amazon Developer

# Criar o skill (uma vez)
ask new                # escolher: Alexa-Hosted (Node.js), pt-BR, Start from scratch

# Copiar os arquivos deste repo para o diretório criado pelo ask new, depois:
ask deploy             # push via CodeCommit + build automático
```

> O `ask deploy` faz push ao CodeCommit do skill, que dispara o CodeBuild automaticamente (roda `npm install` e atualiza a Lambda).

---

## Como usar

| Frase | Comportamento |
|-------|---------------|
| `"Alexa, adicionar tarefa ao things"` | Abre o skill, Alexa pergunta o nome |
| `"Alexa, adicionar tarefa ao things, comprar leite"` | One-shot: vai direto para confirmação |

**Fluxo completo:**
1. `"Alexa, adicionar tarefa ao things"`
2. Alexa: *"Qual tarefa você quer adicionar?"*
3. `"ligar para o dentista amanhã"`
4. Alexa: *"Vou adicionar: ligar para o dentista amanhã. Confirmo?"*
5. `"Sim"`
6. Alexa: *"Pronto! Tarefa adicionada ao seu inbox do Things."*

---

## Testar

1. Aba **Test** no Developer Console → habilitar modo **Development**
2. Digitar (ou falar): `adicionar tarefa ao things`
3. Seguir o diálogo e verificar o inbox do Things3 em ~10 segundos
4. Para depuração: **CloudWatch Logs** na aba Code do Console
