const express = require('express');
const crypto = require('crypto');
const app = express();

const SECRET_KEY = process.env.SECRET_KEY || "weeebagiiiisserracnjaeab2";
const BAGIBAGI_TOKEN = process.env.BAGIBAGI_WEBHOOK_TOKEN || "P5clNlrCKtoklPd7JW8qCAfAwy0uWs8b";

let queue = [];

// simpan raw body mentah, dibutuhkan buat hitung signature yang presisi
app.use(express.json({
	verify: (req, res, buf) => { req.rawBody = buf; }
}));

app.post('/webhook/bagibagi', (req, res) => {
	const signature = req.headers['x-bagibagi-signature'];
	const expected = crypto.createHmac('sha256', BAGIBAGI_TOKEN).update(req.rawBody).digest('hex');

	if (signature !== expected) {
		console.log('[BagiBagi] ⚠️ Signature gak cocok — Diterima:', signature, '| Dihitung:', expected);
		// SEMENTARA tetap diproses biar donasi gak ke-skip. Nanti kalau udah confirm cocok, ganti jadi: return res.status(403).send("Forbidden");
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

app.get('/', (req, res) => res.send("BagiBagi relay jalan"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Relay listening on " + PORT));
