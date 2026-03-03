import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import P from "pino";
import dotenv from "dotenv";
import express from "express";
import qrcode from "qrcode";
import { handleCommand } from "./commands.js";

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.static('public'));

let qrCodeData = '';

app.get('/qr', async (req, res) => {
    res.send(`<h2>Scan QR to pair:</h2><img src="${qrCodeData}" />`);
});

const startBot = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        logger: P({ level: 'info' })
    });

    sock.ev.on('connection.update', async (update) => {
        const { qr, connection } = update;
        if (qr) {
            qrCodeData = await qrcode.toDataURL(qr);
            console.log("QR Code ready at /qr");
        }
        if (connection === 'close') {
            console.log("Disconnected, reconnecting...");
            startBot();
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        if (text) handleCommand(sock, msg, text);
    });

    app.listen(PORT, () => console.log(`Pair site running on http://localhost:${PORT}/qr`));
};

startBot();
