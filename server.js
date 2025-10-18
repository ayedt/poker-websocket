const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const app = express();

app.use(express.static('.'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let players = {};
let deck = [];

function createDeck() {
    const suits = ['♠','♥','♣','♦'];
    const values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push({suit, value});
        }
    }
}

function dealCard() {
    if (deck.length === 0) createDeck();
    const index = Math.floor(Math.random() * deck.length);
    return deck.splice(index, 1)[0];
}

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'register') {
            players[data.id] = ws;
        }
        if (data.type === 'deal') {
            const playerWs = players[data.id];
            if (playerWs) {
                const cards = [dealCard(), dealCard()];
                playerWs.send(JSON.stringify({type:'hand', cards}));
            }
        }
        if (data.type === 'dealCommunity') {
            const communityCards = [];
            for (let i =0;i<data.count;i++) communityCards.push(dealCard());
            for (let id in players) {
                players[id].send(JSON.stringify({type:'community', cards:communityCards}));
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));