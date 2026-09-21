const express = require('express');
const app = express();
app.use(express.json());

const SECRET_KEY = process.env.SECRET_KEY || "weeebagiiiisserracnjaeab2";
let queue = [];

// Daftarin URL ini di dashboard Saweria: Pengaturan > Webhook
app.post('/webhook/saweria', (req, res) => {
	const b = req.body;
	queue.push({
		id: b.id || (Date.now() + "_" + Math.random()), // buat dedupe di Roblox
		username: String(b.donator_name || "Anonim").trim(), // donatur isi username Roblox di kolom "Nama"
		message: String(b.message || "").trim(),
		amount: Number(b.amount) || 0, // rupiah
		time: Date.now(),
	});
	res.status(200).send("OK");
});

// Roblox polling endpoint ini tiap beberapa detik
app.get('/pending', (req, res) => {
	if (req.query.key !== SECRET_KEY) return res.status(403).send("Forbidden");
	const items = queue;
	queue = []; // kosongin biar gak keproses dobel
	res.json(items);
});

app.get('/', (req, res) => res.send("Saweria relay jalan"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Relay listening on " + PORT));
