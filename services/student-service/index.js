const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Ensure data directory and file exist
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'students.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

function readStudents() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read students file:', e);
    throw new Error('read_error');
  }
}
function writeStudents(arr) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write students file:', e);
    throw new Error('write_error');
  }
}

// JSON error helper
function jsonError(res, status, message) {
  return res.status(status).json({ error: message });
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/students', (req, res) => {
  try {
    const list = readStudents();
    res.json(list);
  } catch (e) {
    return jsonError(res, 500, 'Could not read students data');
  }
});

app.get('/students/:login', (req, res) => {
  try {
    const login = req.params.login;
    const list = readStudents();
    const s = list.find(u => u.login === login);
    if (!s) return jsonError(res, 404, 'not found');
    res.json(s);
  } catch (e) {
    return jsonError(res, 500, 'Could not read student');
  }
});

// Create or return existing
app.post('/students', (req, res) => {
  try {
    const { login } = req.body;
    if (!login) return jsonError(res, 400, 'login required');
    const list = readStudents();
    let s = list.find(u => u.login === login);
    if (!s) {
      s = { login, xp: 0, badges: [], completedTasks: [] };
      list.push(s);
      writeStudents(list);
    }
    res.json(s);
  } catch (e) {
    return jsonError(res, 500, 'Could not create or fetch student');
  }
});

// Full update of student fields (xp, badges, completedTasks)
app.put('/students/:login', (req, res) => {
  try {
    const login = req.params.login;
    const payload = req.body;
    const list = readStudents();
    const idx = list.findIndex(u => u.login === login);
    if (idx === -1) return jsonError(res, 404, 'not found');
    const s = list[idx];
    // Merge allowed fields
    s.xp = typeof payload.xp === 'number' ? payload.xp : s.xp;
    if (Array.isArray(payload.badges)) s.badges = payload.badges;
    if (Array.isArray(payload.completedTasks)) s.completedTasks = payload.completedTasks;
    writeStudents(list);
    res.json(s);
  } catch (e) {
    return jsonError(res, 500, 'Could not update student');
  }
});

// Add a badge
app.post('/students/:login/badges', (req, res) => {
  try {
    const login = req.params.login;
    const { badge } = req.body;
    if (!badge) return jsonError(res, 400, 'badge required');
    const list = readStudents();
    const s = list.find(u => u.login === login);
    if (!s) return jsonError(res, 404, 'not found');
    s.badges = s.badges || [];
    s.badges.push(badge);
    writeStudents(list);
    res.json(s);
  } catch (e) {
    return jsonError(res, 500, 'Could not add badge');
  }
});

// Generic error handler to ensure JSON output
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (!res.headersSent) res.status(500).json({ error: 'internal_server_error' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`student-service listening on ${PORT}`));