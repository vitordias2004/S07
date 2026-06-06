const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const RESULTS_FILE = '/data/results.json';

app.use(express.json());

function loadResults() {
  try {
    if (fs.existsSync(RESULTS_FILE)) {
      return JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
    }
  } catch (e) {}
  return [];
}

function saveResults(results) {
  const dir = path.dirname(RESULTS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
}

app.get('/', (req, res) => {
  res.json({
    service: 'Node App - Coletor de Resultados de Testes',
    status: 'running',
    endpoints: ['GET /health', 'POST /api/results', 'GET /api/results', 'DELETE /api/results']
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/api/results', (req, res) => {
  const { title, status, suite, duration, error } = req.body;

  if (!title || !status) {
    return res.status(400).json({ error: 'title e status são obrigatórios' });
  }

  const results = loadResults();
  const entry = {
    id: results.length + 1,
    title,
    status,
    suite: suite || 'sem suite',
    duration: duration || 0,
    error: error || null,
    timestamp: new Date().toISOString()
  };

  results.push(entry);
  saveResults(results);

  console.log(`[${entry.status.toUpperCase()}] ${entry.suite} > ${entry.title}`);
  res.status(201).json(entry);
});

app.get('/api/results', (req, res) => {
  const results = loadResults();
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;

  res.json({ total: results.length, passed, failed, results });
});

app.delete('/api/results', (req, res) => {
  saveResults([]);
  res.json({ message: 'Resultados limpos com sucesso' });
});

app.listen(PORT, () => {
  console.log(`Node App rodando na porta ${PORT}`);
  console.log(`Resultados persistidos em: ${RESULTS_FILE}`);
});