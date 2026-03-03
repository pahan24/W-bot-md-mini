import fetch from "node-fetch";

export const handleCommand = async (sock, msg, text) => {
    const sender = msg.key.participant || msg.key.remoteJid;
    const lower = text.toLowerCase();

    switch(lower) {
        case '!ping':
            await sock.sendMessage(sender, { text: 'Pong!' });
            break;
        case '!menu':
            await sock.sendMessage(sender, { text: 'Commands:\n!ping\n!menu\n!say <text>\n!hiru\n!groupinfo' });
            break;
        default:
            if(lower.startsWith('!say ')) {
                await sock.sendMessage(sender, { text: text.slice(5) });
            } else if(lower === '!hiru') {
                try {
                    const res = await fetch(process.env.HIRU_NEWS_URL);
                    const html = await res.text();
                    const news = html.match(/<h2 class="title">([^<]+)<\/h2>/g)?.slice(0,5).map(t=>t.replace(/<[^>]+>/g,'')).join('\n');
                    await sock.sendMessage(sender, { text: news || 'No news found' });
                } catch(e) {
                    await sock.sendMessage(sender, { text: 'Error fetching news' });
                }
            } else if(lower === '!groupinfo') {
                if(msg.key.remoteJid.endsWith('@g.us')) {
                    const metadata = await sock.groupMetadata(msg.key.remoteJid);
                    await sock.sendMessage(sender, { text: `Group: ${metadata.subject}\nMembers: ${metadata.participants.length}` });
                } else {
                    await sock.sendMessage(sender, { text: 'This command works only in groups' });
                }
            }
            break;
    }
};
