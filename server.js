const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    // Broadcast message
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => console.log('Client disconnected'));
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
