# WhatsApp GLPI Chatbot

Sistema de chatbot para WhatsApp integrado com GLPI para gerenciamento de chamados.

## Requisitos

- Node.js 16 ou superior
- MongoDB 4.4 ou superior
- GLPI 10.0.16
- Conta no WhatsApp
- Servidor Ubuntu com acesso à VPN onde está o GLPI

## 1. Instalação

### 1.1 Preparação do Ambiente

```bash
# Clone o repositório
git clone [seu-repositorio]
cd whatsapp-glpi-chatbot

# Instale as dependências
npm install
```

### 1.2 Configuração do MongoDB

```bash
# Instale o MongoDB
sudo apt update
sudo apt install -y mongodb

# Inicie o serviço
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### 1.3 Configuração das Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
GLPI_URL=https://seu-glpi-server.com/apirest.php
GLPI_APP_TOKEN=your-app-token-from-api-client
GLPI_USER_TOKEN=your-user-token-from-remote-access-keys
MONGODB_URI=mongodb://localhost:27017/whatsapp-glpi
OPENAI_API_KEY=your-openai-api-key
```

## 2. Configuração do GLPI

### 2.1 Configuração da API

1. Acesse o GLPI como administrador
2. Vá para "Administração > Usuários"
3. Selecione seu usuário administrador
4. Na aba "Chaves de acesso remoto", clique em "Regenerar"
5. Copie o token gerado e salve como `GLPI_USER_TOKEN` no arquivo `.env`

### 2.2 Criação do Cliente API

1. Acesse "Configurar > Geral > API"
2. Clique em "Adicionar cliente de API"
3. Preencha:
   - Nome: WhatsApp Chatbot
   - Status: Ativo
   - Token de aplicação: (será gerado automaticamente)
4. Copie o token gerado e salve como `GLPI_APP_TOKEN` no arquivo `.env`

### 2.3 Configuração das Regras de Negócio

1. Acesse "Administração > Regras > Regras de Negócio para Chamados"
2. Clique em "+" para adicionar uma nova regra
3. Configure:
   - Nome: Notificação WhatsApp
   - Descrição: Envia notificações via WhatsApp quando um chamado é atualizado
   - Menu suspenso: Chamados
   - Status: Ativo

4. Na aba "Critérios":
   - Critério: "Atualizações" 
   - Condição: "Existe"
   - Valor: (deixe em branco)

5. Na aba "Ações":
   - Ação: "Ações específicas"
   - Campo: "Executar script personalizado"
   - Valor: Cole o script abaixo

```php
<?php
$ticket = new Ticket();
$ticket->getFromDB($data['id']);

$url = 'http://seu-servidor:3000/webhook/ticket-update';
$headers = [
    'Content-Type: application/json',
    'App-Token: ' . $CFG_GLPI["app_token"]
];

$postData = [
    'ticket_id' => $data['id'],
    'user_phone' => $ticket->fields['users_id'],
    'update_description' => $data['content']
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);
?>
```

6. Salve o script em `/var/www/html/glpi/scripts/whatsapp-notification.php`
7. Configure as permissões:
```bash
sudo chmod 755 /var/www/html/glpi/scripts/whatsapp-notification.php
sudo chown www-data:www-data /var/www/html/glpi/scripts/whatsapp-notification.php
```

## 3. Inicialização do Chatbot

```bash
# Inicie o servidor em modo desenvolvimento
npm run dev

# Ou em produção
npm start
```

Ao iniciar, um QR Code será exibido no terminal. Escaneie-o com o WhatsApp do número que será usado como bot.

## 4. Uso do Chatbot

### 4.1 Comandos Disponíveis

- "oi", "olá", "bom dia": Inicia a conversa
- "preciso abrir um chamado" ou "novo chamado": Inicia o processo de abertura de chamado

### 4.2 Fluxo de Abertura de Chamado

1. Usuário inicia solicitando abertura de chamado
2. Bot solicita email corporativo
3. Bot solicita senha
4. Bot solicita descrição do problema
5. Chamado é criado e número é retornado ao usuário

### 4.3 Notificações

- O usuário receberá notificações automáticas quando:
  - O chamado for atualizado por um técnico
  - Houver mudança no status do chamado
  - Novos comentários forem adicionados

## 5. Manutenção

### 5.1 Logs

Os logs são salvos em `logs/app.log`. Monitore-os para identificar possíveis problemas:

```bash
tail -f logs/app.log
```

### 5.2 Backup

Faça backup regular do banco de dados MongoDB:

```bash
mongodump --db whatsapp-glpi --out /backup/$(date +%Y%m%d)
```

### 5.3 Monitoramento

Use o PM2 para monitorar o processo em produção:

```bash
npm install -g pm2
pm2 start src/index.js --name whatsapp-glpi
pm2 monitor
```

## 6. Solução de Problemas

### 6.1 Problemas Comuns

1. QR Code não aparece:
   - Verifique se o WhatsApp Web está desconectado de outras sessões
   - Limpe a pasta `.wwebjs_auth`

2. Erro de autenticação GLPI:
   - Verifique se os tokens no `.env` estão corretos
   - Confirme se o cliente API está ativo no GLPI

3. Notificações não chegam:
   - Verifique as permissões do script PHP
   - Confirme se o webhook está acessível
   - Verifique os logs do Apache/GLPI

### 6.2 Suporte

Para problemas não resolvidos:
1. Verifique os logs
2. Consulte a documentação do GLPI
3. Abra uma issue no repositório do projeto

## 7. Segurança

- Mantenha todos os tokens seguros
- Use HTTPS para o webhook
- Faça backup regular dos dados
- Monitore os logs em busca de atividades suspeitas
- Mantenha o Node.js e dependências atualizados

## 8. Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Faça commit das alterações
4. Push para a branch
5. Abra um Pull Request

## 9. Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.