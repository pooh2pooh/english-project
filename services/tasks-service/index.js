const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_PATH = path.join(__dirname, 'data', 'tasks.json');

app.get('/tasks', (req, res) => {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const tasks = JSON.parse(raw);
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not read tasks' });
  }
});

// Static images (for triple tasks)
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

const PORT = 3001;
app.listen(PORT, () => console.log(`tasks-service listening on ${PORT}`));