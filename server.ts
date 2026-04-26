import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import pg from "pg";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("forensic.db");
// ... (rest of the database initialization remains the same)

// Initialize SQLite Database
// Drop old table if it has the old schema (id as primary key)
const tableInfo = db.prepare("PRAGMA table_info(forms)").all() as any[];
const hasIdColumn = tableInfo.some(col => col.name === 'id');
const hasSha256Column = tableInfo.some(col => col.name === 'sha256');

if (hasIdColumn || !hasSha256Column) {
  console.log("Updating forms table schema...");
  db.exec("DROP TABLE IF EXISTS forms");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS forms (
    cedula TEXT PRIMARY KEY,
    nombre TEXT,
    telefono TEXT,
    direccion TEXT,
    ciudad TEXT,
    marca TEXT,
    modelo TEXT,
    color TEXT,
    serial TEXT,
    imei1 TEXT,
    imei2 TEXT,
    numTelefónico TEXT,
    codigoDesbloqueo TEXT,
    estadoFisico TEXT,
    aplicacionObjeto TEXT,
    contactoEspecifico TEXT,
    fechaDesde TEXT,
    fechaHasta TEXT,
    aislamiento INTEGER,
    calculoHash INTEGER,
    sha256 TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT
  );

  INSERT OR IGNORE INTO users (username, password) VALUES ('julljoll', '15816003');

  INSERT OR IGNORE INTO posts (title, content) VALUES 
  ('Sistema SHA256.US Activo', 'Se ha desplegado la versión 1.0 del sistema de planillas forenses con integración Neon DB.'),
  ('Actualización de Seguridad', 'Se ha implementado la generación de hashes SHA256 reales para cada documento generado.');
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
    if (user) {
      res.json({ success: true, token: "fake-jwt-token" });
    } else {
      res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }
  });

  app.get("/api/forms", (req, res) => {
    const forms = db.prepare("SELECT * FROM forms ORDER BY created_at DESC").all();
    res.json(forms);
  });

  app.get("/api/posts", (req, res) => {
    const posts = db.prepare("SELECT * FROM posts ORDER BY created_at DESC").all();
    res.json(posts);
  });

  app.post("/api/posts", (req, res) => {
    const { title, content } = req.body;
    db.prepare("INSERT INTO posts (title, content) VALUES (?, ?)").run(title, content);
    res.json({ success: true });
  });

  app.post("/api/forms", (req, res) => {
    try {
      const form = req.body;
      console.log("Incoming form submission:", form.nombre);
      
      const hashData = JSON.stringify({
        ...form,
        timestamp: new Date().toISOString(),
        random: Math.random()
      });
      const id = crypto.createHash('sha256').update(hashData).digest('hex');
      
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO forms (
          cedula, nombre, telefono, direccion, ciudad,
          marca, modelo, color, serial, imei1, imei2, 
          numTelefónico, codigoDesbloqueo, estadoFisico, 
          aplicacionObjeto, contactoEspecifico, fechaDesde, 
          fechaHasta, aislamiento, calculoHash, sha256
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        form.cedula, form.nombre, form.telefono, form.direccion, form.ciudad,
        form.marca, form.modelo, form.color, form.serial, form.imei1, form.imei2,
        form.numTelefónico, form.codigoDesbloqueo, form.estadoFisico,
        form.aplicacionObjeto, form.contactoEspecifico, form.fechaDesde,
        form.fechaHasta, form.aislamiento ? 1 : 0, form.calculoHash ? 1 : 0, id
      );
      console.log("Form saved to SQLite successfully:", form.cedula);

      res.json({ success: true, id });
    } catch (error: any) {
      console.error("General form save error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/settings/neo/status", (req, res) => {
    res.json({ status: 'disconnected' });
  });

  app.get("/api/settings/neo", (req, res) => {
    res.json({ config: null });
  });

  app.post("/api/settings/neo", (req, res) => {
    res.json({ success: false, message: "Postgres sync disabled" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
