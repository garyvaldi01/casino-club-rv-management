import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());

// In-memory storage for demo purposes
const users: Record<string, { name: string, min: number, max: number }> = {
    '02800651156': { name: 'YAJAHIRA PEREZ', min: 2000, max: 3000 },
    '40219735111': { name: 'ANA NICOLE PEÑA', min: 500, max: 1000 },
    '00118213750': { name: 'VANELIS RODRIGUEZ', min: 500, max: 1000 },
    '40219910185': { name: 'DEURI GARCÍA', min: 500, max: 1000 }
};

const DB_FILE = path.join(process.cwd(), 'database.json');

let claims: Array<{ name: string, prize: number, timestamp: string }> = [];
let validationLogs: Array<{ cedula: string, timestamp: string, valid: boolean }> = [];

try {
    if (fs.existsSync(DB_FILE)) {
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        claims = data.claims || [];
        validationLogs = data.validationLogs || [];
    }
} catch (e) {
    console.error("Error loading DB", e);
}

const saveDb = () => {
    fs.writeFileSync(DB_FILE, JSON.stringify({ claims, validationLogs }, null, 2));
};

// Helper for random choice
const getPrize = (min: number, max: number) => {
    const steps = (max - min) / 100;
    const choice = Math.floor(Math.random() * (steps + 1));
    return min + (choice * 100);
}

// API routes
app.post('/api/validate-cedula', (req, res) => {
    const { cedula } = req.body;
    const user = users[cedula];
    
    validationLogs.push({ cedula, timestamp: new Date().toISOString(), valid: !!user });
    saveDb();    
    if (user) {
        const prize = getPrize(user.min, user.max);
        res.json({ valid: true, name: user.name, prize });
    } else {
        res.json({ valid: false });
    }
});

app.post('/api/log-claim', (req, res) => {
    const { name, prize } = req.body;
    claims.push({ name, prize, timestamp: new Date().toISOString() });
    saveDb();    res.json({ success: true });
});

app.get('/api/admin/logs', (req, res) => {
    res.json({ validationLogs, claims });
});

// Vite middleware development / production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
