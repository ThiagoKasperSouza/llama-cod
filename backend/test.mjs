import express from 'express';
const app = express();
app.use(express.json());
app.post('/api/chat', (req, res) => res.json({ ok: true }));
app.listen(4000, () => console.log('test server running'));
