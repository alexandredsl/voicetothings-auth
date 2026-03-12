const Alexa    = require('ask-sdk-core');
const nodemailer = require('nodemailer');

// Configuração (Alexa-Hosted não permite setar env vars via console federada)
const THINGS_EMAIL      = 'add-to-things-cqygplkx6be8e9l17nap9@things.email';
const GMAIL_USER        = 'alexandre.l4cerda@gmail.com';
const GMAIL_APP_PASSWORD = 'ecwt nhft akwd mjho';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
    },
});

async function sendTaskToThings(taskName) {
    await transporter.sendMail({
        from:    GMAIL_USER,
        to:      THINGS_EMAIL,
        subject: taskName,
        text:    '',
    });
}

// Suprime pings periódicos do Alexa (evita criar tarefas espúrias no Things)
const AvailabilityCheckHandler = {
    canHandle(handlerInput) {
        const session = handlerInput.requestEnvelope.session;
        const userId = session && session.user && session.user.userId;
        return userId === 'alexa-lambda-availability';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder.getResponse();
    },
};

// Turn 1 — Skill aberto sem tarefa: Alexa pergunta o nome
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak('Tudo bem! Qual tarefa você quer adicionar?')
            .reprompt('Qual tarefa você quer adicionar ao Things?')
            .getResponse();
    },
};

// Turn 2 (ou one-shot) — Captura o nome da tarefa e pede confirmação
const AddTaskIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AddTaskIntent';
    },
    handle(handlerInput) {
        const taskName = Alexa.getSlotValue(handlerInput.requestEnvelope, 'taskName');

        if (!taskName) {
            return handlerInput.responseBuilder
                .speak('Não entendi. Qual tarefa você quer adicionar?')
                .reprompt('Qual tarefa você quer adicionar?')
                .getResponse();
        }

        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes.pendingTask = taskName;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        return handlerInput.responseBuilder
            .speak(`Vou adicionar: ${taskName}. Confirmo?`)
            .reprompt('Confirmo a tarefa? Diga sim ou não.')
            .getResponse();
    },
};

// Turn 3a — Usuário confirma: envia email para Things e encerra sessão
const YesIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent';
    },
    async handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const taskName = sessionAttributes.pendingTask;

        if (!taskName) {
            return handlerInput.responseBuilder
                .speak('Não sei qual tarefa adicionar. Por favor, tente novamente.')
                .getResponse();
        }

        try {
            await sendTaskToThings(taskName);
            return handlerInput.responseBuilder
                .speak(`Pronto! "${taskName}" foi adicionada ao seu inbox do Things.`)
                .withShouldEndSession(true)
                .getResponse();
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            return handlerInput.responseBuilder
                .speak('Desculpe, não consegui adicionar a tarefa agora. Tente novamente.')
                .getResponse();
        }
    },
};

// Turn 3b — Usuário nega: volta a pedir o nome da tarefa
const NoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        delete sessionAttributes.pendingTask;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        return handlerInput.responseBuilder
            .speak('Tudo bem. Qual tarefa você quer adicionar?')
            .reprompt('Qual tarefa você quer adicionar?')
            .getResponse();
    },
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak('Diga o nome de uma tarefa e eu adiciono ao seu inbox do Things. Por exemplo: adicionar comprar leite.')
            .reprompt('Qual tarefa você quer adicionar?')
            .getResponse();
    },
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak('Até logo!')
            .withShouldEndSession(true)
            .getResponse();
    },
};

const ErrorHandler = {
    canHandle() { return true; },
    handle(handlerInput, error) {
        console.error('Erro não tratado:', error);
        return handlerInput.responseBuilder
            .speak('Desculpe, algo deu errado. Por favor, tente novamente.')
            .reprompt('Por favor, tente novamente.')
            .getResponse();
    },
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        AvailabilityCheckHandler,
        LaunchRequestHandler,
        AddTaskIntentHandler,
        YesIntentHandler,
        NoIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
