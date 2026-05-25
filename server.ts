import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());

let users: Record<string, { name: string, min: number, max: number }> = {};
let claims: Array<{ name: string, prize: number, timestamp: string }> = [];
let validationLogs: Array<{ cedula: string, timestamp: string, valid: boolean }> = [];
let generatedPrizes: Record<string, { name: string, prize: number, timestamp: string }> = {};

const DB_FILE = path.join(process.cwd(), 'database.json');

try {
    if (fs.existsSync(DB_FILE)) {
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        users = data.users || {};
        claims = data.claims || [];
        validationLogs = data.validationLogs || [];
        generatedPrizes = data.generatedPrizes || {};
        
        // If users is empty, populate with default contacts from prompt
        if (Object.keys(users).length === 0) {
            users = {
                '02800651156': { name: 'Yajahira Perez', min: 2000, max: 3000 },
                '00100193325': { name: 'Digna Josefina Sanchez de Garcia', min: 1500, max: 2000 },
                '22300561119': { name: 'Josefina De los santos', min: 500, max: 800 },
                '00118213750': { name: 'Vanelis Rodríguez abad', min: 500, max: 800 },
                '02801144268': { name: 'Yoelis Segura', min: 500, max: 800 },
                '04900741598': { name: 'Gladys maria Holguin', min: 500, max: 800 },
                '03700794823': { name: 'Emmanuel Vargas Mercedes', min: 500, max: 800 },
                '40224010762': { name: 'Anyi Liriano', min: 500, max: 800 },
                '00107770968': { name: 'Yocasta Acosta', min: 500, max: 800 }
            };
            fs.writeFileSync(DB_FILE, JSON.stringify({ users, claims, validationLogs, generatedPrizes }, null, 2));
        }
    } else {
        // Initial defaults
        users = {
            '02800651156': { name: 'Yajahira Perez', min: 2000, max: 3000 },
            '00100193325': { name: 'Digna Josefina Sanchez de Garcia', min: 1500, max: 2000 },
            '22300561119': { name: 'Josefina De los santos', min: 500, max: 800 },
            '00118213750': { name: 'Vanelis Rodríguez abad', min: 500, max: 800 },
            '02801144268': { name: 'Yoelis Segura', min: 500, max: 800 },
            '04900741598': { name: 'Gladys maria Holguin', min: 500, max: 800 },
            '03700794823': { name: 'Emmanuel Vargas Mercedes', min: 500, max: 800 },
            '40224010762': { name: 'Anyi Liriano', min: 500, max: 800 },
            '00107770968': { name: 'Yocasta Acosta', min: 500, max: 800 }
        };
        fs.writeFileSync(DB_FILE, JSON.stringify({ users, claims, validationLogs, generatedPrizes }, null, 2));
    }
} catch (e) {
    console.error("Error loading DB", e);
}

const saveDb = () => {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users, claims, validationLogs, generatedPrizes }, null, 2));
};

// Helper for random choice
const getPrize = (min: number, max: number) => {
    const steps = (max - min) / 100;
    const choice = Math.floor(Math.random() * (steps + 1));
    return min + (choice * 100);
}

// API routes
app.post('/api/validate-cedula', (req, res) => {
    const rawCedula = String(req.body.cedula || '').trim();
    const cleanCedula = rawCedula.replace(/[-.\s]/g, '');
    
    // Check if the user exists either by clean cedula or raw cedula
    const userKey = Object.keys(users).find(k => String(k).replace(/[-.\s]/g, '') === cleanCedula);
    const user = userKey ? users[userKey] : null;
    const finalCedula = userKey || rawCedula;
    
    validationLogs.push({ cedula: finalCedula, timestamp: new Date().toISOString(), valid: !!user });
    
    if (user) {
        let prize;
        if (generatedPrizes[finalCedula]) {
            prize = generatedPrizes[finalCedula].prize;
        } else {
            prize = getPrize(user.min, user.max);
            generatedPrizes[finalCedula] = {
                name: user.name,
                prize,
                timestamp: new Date().toISOString()
            };
        }
        saveDb();    
        res.json({ valid: true, name: user.name, prize });
    } else {
        saveDb();
        res.json({ valid: false });
    }
});

app.post('/api/log-claim', (req, res) => {
    const { name, prize } = req.body;
    claims.push({ name, prize, timestamp: new Date().toISOString() });
    saveDb();    res.json({ success: true });
});

app.get('/api/admin/logs', (req, res) => {
    res.json({ validationLogs, claims, generatedPrizes, users });
});

app.post('/api/admin/users/add', (req, res) => {
    const { cedula, name, min, max } = req.body;
    if (!cedula || !name || min == null || max == null) {
        return res.status(400).json({ error: 'Faltan datos' });
    }
    users[cedula] = { name, min, max };
    saveDb();
    res.json({ success: true, users });
});

app.post('/api/admin/users/bulk', (req, res) => {
    const { users: newUsers } = req.body;
    if (!Array.isArray(newUsers)) {
        return res.status(400).json({ error: 'El formato no es un array' });
    }
    for (const u of newUsers) {
        if (u.cedula && u.name) {
            users[u.cedula] = { 
                name: u.name, 
                min: Number(u.min) || 500, 
                max: Number(u.max) || 800 
            };
        }
    }
    saveDb();
    res.json({ success: true, users });
});

app.delete('/api/admin/users/:cedula', (req, res) => {
    const { cedula } = req.params;
    if (users[cedula]) {
        delete users[cedula];
        saveDb();
        res.json({ success: true, users });
    } else {
        res.status(404).json({ error: 'Usuario no encontrado' });
    }
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

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
