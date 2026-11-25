const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const users = {};
const messages = {};

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (users[username]) return res.status(400).json({ error: 'Юзер существует' });
    users[username] = { password };
    res.json({ success: true });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!users[username] || users[username].password !== password) {
        return res.status(400).json({ error: 'Неверный логин или пароль' });
    }
    res.json({ success: true });
});

wss.on('connection', (ws) => {
    console.log('Клиент подключился к серверу');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'message') {
                const { chatId, from, text } = data;
                if (!messages[chatId]) messages[chatId] = [];
                messages[chatId].push({ from, text, time: new Date().toISOString() });
                
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'new_message', chatId, from, text }));
                    }
                });
            }
        } catch (e) {
            console.error(e);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Vaskyagram Server запущен на порту ${PORT}`);
});
