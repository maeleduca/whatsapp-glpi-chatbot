const { NlpManager } = require('node-nlp');
const glpiService = require('../services/glpiService');
const UserState = require('../models/UserState');

const nlpManager = new NlpManager({ languages: ['pt'] });

// Train NLP manager with common phrases
async function trainNLP() {
    // Greeting intents
    nlpManager.addDocument('pt', 'olá', 'greeting');
    nlpManager.addDocument('pt', 'oi', 'greeting');
    nlpManager.addDocument('pt', 'bom dia', 'greeting');
    
    // Ticket creation intents
    nlpManager.addDocument('pt', 'preciso abrir um chamado', 'create_ticket');
    nlpManager.addDocument('pt', 'novo chamado', 'create_ticket');
    
    // Train and save the model
    await nlpManager.train();
}

trainNLP();

const handleMessage = async (client, message) => {
    try {
        const userState = await UserState.findOne({ 
            phoneNumber: message.from 
        }) || new UserState({ phoneNumber: message.from });

        const response = await nlpManager.process('pt', message.body);
        
        switch (userState.currentState) {
            case 'INITIAL':
                if (response.intent === 'create_ticket') {
                    await message.reply('Por favor, informe seu email corporativo:');
                    userState.currentState = 'WAITING_EMAIL';
                } else {
                    await message.reply('Olá! Como posso ajudar? Você pode dizer "preciso abrir um chamado" para começar.');
                }
                break;

            case 'WAITING_EMAIL':
                userState.email = message.body;
                await message.reply('Agora, informe sua senha:');
                userState.currentState = 'WAITING_PASSWORD';
                break;

            case 'WAITING_PASSWORD':
                try {
                    const sessionToken = await glpiService.initSession(userState.email, message.body);
                    userState.sessionToken = sessionToken;
                    await message.reply('Descreva o problema que você está enfrentando:');
                    userState.currentState = 'WAITING_DESCRIPTION';
                } catch (error) {
                    await message.reply('Credenciais inválidas. Por favor, informe seu email novamente:');
                    userState.currentState = 'WAITING_EMAIL';
                }
                break;

            case 'WAITING_DESCRIPTION':
                const ticketData = {
                    name: `Chamado via WhatsApp - ${message.from}`,
                    content: message.body,
                    status: 'new'
                };
                
                const ticket = await glpiService.createTicket(userState.sessionToken, ticketData);
                await message.reply(`Chamado criado com sucesso! Número do ticket: ${ticket.id}`);
                userState.currentState = 'INITIAL';
                break;
        }

        await userState.save();

    } catch (error) {
        console.error('Error handling message:', error);
        await message.reply('Desculpe, ocorreu um erro. Por favor, tente novamente mais tarde.');
    }
};

module.exports = { handleMessage };