const express = require('express');
const app = express();
app.use(express.json());

const SECRET_KEY = process.env.SECRET_KEY || "GANTI_INI_SECRET_KAMU";
let queue = [];

app.post('/webhook/bagibagi', (req, res) => {
	console.log('=== WEBHOOK BAGIBAGI MASUK ===');
	console.log('HEADERS:', JSON.stringify(req.headers, null, 2));
	console.log('BODY:', JSON.stringify(req.body, null, 2));
	console.log('================================');
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
