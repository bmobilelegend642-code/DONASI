const express = require('express');
const crypto = require('crypto');
const axios = require('axios'); // Wajib instal axios
const app = express();

// --- KONFIGURASI ---
const SECRET_KEY = process.env.SECRET_KEY || "GAweeebagiiiisserracnjaeab2";
const BAGIBAGI_TOKEN = process.env.BAGIBAGI_WEBHOOK_TOKEN || "P5clNlrCKtoklPd7JW8qCAfAwy0uWs8b";

// Konfigurasi Roblox OAuth (Gunakan Environment Variables di Render)
const ROBLOX_CLIENT_ID = process.env.ROBLOX_CLIENT_ID || "isi_client_id_dari_dashboard_roblox";
const ROBLOX_CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET || "isi_client_secret_dari_dashboard_roblox";
const ROBLOX_REDIRECT_URI = process.env.ROBLOX_REDIRECT_URI || "https://NAMA-WEB-SERVICE-RENDER-KAMU.onrender.com/callback";

let queue = [];

// Middleware raw body untuk kalkulasi signature Bagibagi
app.use(express.json({
	verify: (req, res, buf) => { req.rawBody = buf; }
}));

// --- FITUR 1: RELAY BAGIBAGI ---
app.post('/webhook/bagibagi', (req, res) => {
	const signature = req.headers['x-bagibagi-signature'];
	const expected = crypto.createHmac('sha256', BAGIBAGI_TOKEN).update(req.rawBody).digest('hex');

	if (signature !== expected) {
		console.log('[BagiBagi] ⚠️ Signature gak cocok — Diterima:', signature, '| Dihitung:', expected);
	}

	const b = req.body;
	console.log('[BagiBagi] Donasi masuk:', b.name, b.amount);

	queue.push({
		id: b.transaction_id || (Date.now() + "_" + Math.random()),
		username: String(b.name || "Anonim").trim(),
		message: String(b.message || "").trim(),
		amount: Number(b.amount) || 0,
		time: Date.now(),
	});

	res.status(200).send("OK");
});

app.get('/pending', (req, res) => {
	if (req.query.key !== SECRET_KEY) return res.status(403).send("Forbidden");
	const items = queue;
	queue = [];
	res.json(items);
});

// --- FITUR 2: LOGIN ROBLOX OAUTH ---
app.get('/login-roblox', (req, res) => {
	const robloxAuthUrl = `https://apis.roblox.com/oauth/v1/authorize?client_id=${ROBLOX_CLIENT_ID}&redirect_uri=${ROBLOX_REDIRECT_URI}&scope=openid+profile&response_type=code`;
	res.redirect(robloxAuthUrl);
});

app.get('/callback', async (req, res) => {
	const code = req.query.code;
	if (!code) return res.status(400).send('Login gagal, tidak ada kode otorisasi dari Roblox.');

	try {
		// Tukar authorization code dengan Access Token
		const tokenResponse = await axios.post('https://apis.roblox.com/oauth/v1/token', 
			new URLSearchParams({
				client_id: ROBLOX_CLIENT_ID,
				client_secret: ROBLOX_CLIENT_SECRET,
				grant_type: 'authorization_code',
				code: code,
				redirect_uri: ROBLOX_REDIRECT_URI
			}).toString(), {
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
		});

		const accessToken = tokenResponse.data.access_token;

		// Ambil data user (Username dan ID Roblox) menggunakan Access Token
		const userResponse = await axios.get('https://apis.roblox.com/oauth/v1/userinfo', {
			headers: { 'Authorization': `Bearer ${accessToken}` }
		});

		const userData = userResponse.data;
		
		res.send(`
            <h1>Login Roblox Sukses!</h1>
            <p><strong>Username:</strong> ${userData.preferred_username}</p>
            <p><strong>Roblox ID:</strong> ${userData.sub}</p>
            <p>Kamu sekarang bisa menutup halaman ini dan kembali ke aplikasi.</p>
        `);

	} catch (error) {
		console.error('[Roblox Auth] Error:', error.response ? error.response.data : error.message);
		res.status(500).send('Terjadi kesalahan saat memproses login Roblox.');
	}
});

app.get('/', (req, res) => res.send("BagiBagi relay & Auth siap"));

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Relay listening on " + PORT));
