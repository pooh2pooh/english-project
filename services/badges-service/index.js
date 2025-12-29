const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const BADGES_FILE = path.join(DATA_DIR, 'badges.json');

function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(BADGES_FILE)) fs.writeFileSync(BADGES_FILE, JSON.stringify([], null, 2), 'utf8');
}
function readBadges() {
  ensureData();
  try {
    return JSON.parse(fs.readFileSync(BADGES_FILE, 'utf8'));
  } catch (e) {
    console.error('Failed to read badges file', e);
    return [];
  }
}
function writeBadges(arr) {
  try {
    fs.writeFileSync(BADGES_FILE, JSON.stringify(arr, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write badges file', e);
    throw e;
  }
}

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Get available badges
app.get('/badges', (req, res) => {
  try {
    const badges = readBadges();
    res.json(badges);
  } catch (e) {
    res.status(500).json({ error: 'Could not read badges' });
  }
});

// Add a new badge (admin endpoint)
app.post('/badges', (req, res) => {
  const { id, title, icon } = req.body;
  if (!id || !title) return res.status(400).json({ error: 'id and title required' });
  const badges = readBadges();
  if (badges.find(b => b.id === id)) return res.status(400).json({ error: 'badge exists' });
  const b = { id, title, icon: icon || '' };
  badges.push(b);
  writeBadges(badges);
  res.status(201).json(b);
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`badges-service listening on ${PORT}`));