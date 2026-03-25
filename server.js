const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const dataFolder = path.join(__dirname, 'data');

// Helper functions
function readJSON(fileName) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dataFolder, fileName), 'utf-8'));
  } catch {
    return [];
  }
}

function writeJSON(fileName, data) {
  fs.writeFileSync(path.join(dataFolder, fileName), JSON.stringify(data, null, 2));
}

// ------------------ API Routes ------------------

// Generic GET
app.get('/api/:type', (req, res) => {
  const type = req.params.type;
  if (!['live','videos','music'].includes(type)) return res.status(404).json({error:'Not Found'});
  res.json(readJSON(`${type}.json`));
});

// Generic POST (add new item)
app.post('/api/:type', (req, res) => {
  const type = req.params.type;
  if (!['live','videos','music'].includes(type)) return res.status(404).json({error:'Not Found'});

  const data = readJSON(`${type}.json`);
  const newItem = { id: Date.now(), ...req.body };
  data.push(newItem);
  writeJSON(`${type}.json`, data);

  res.json(newItem);
});

// Generic DELETE (by id)
app.delete('/api/:type/:id', (req, res) => {
  const type = req.params.type;
  if (!['live','videos','music'].includes(type)) return res.status(404).json({error:'Not Found'});

  const data = readJSON(`${type}.json`).filter(item => item.id != req.params.id);
  writeJSON(`${type}.json`, data);

  res.json({ success: true, deletedId: req.params.id });
});

// Generic UPDATE (PUT) by id
app.put('/api/:type/:id', (req, res) => {
  const type = req.params.type;
  const id = req.params.id;
  if (!['live','videos','music'].includes(type)) return res.status(404).json({ error: 'Not Found' });

  let data = readJSON(`${type}.json`);
  const index = data.findIndex(item => item.id == id);
  if (index === -1) return res.status(404).json({ error: 'Item not found' });

  data[index] = { ...data[index], ...req.body }; // merge updates
  writeJSON(`${type}.json`, data);

  res.json(data[index]);
});

// ------------------ Serve frontend ------------------
app.use(express.static(__dirname));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
// Serve login page at /admin
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));

// Catch-all
app.use((req,res) => res.status(404).send('Page not found'));

// ------------------ Start server ------------------
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));