import { fileURLToPath } from 'node:url';
import { existsSync, copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openDatabase, seedDemo } from '../server/database.js';
import { createHandler } from '../server/http.js';

let handler = null;

function getHandler() {
  if (handler) return handler;
  const isVercel = Boolean(process.env.VERCEL);
  let dbPath;
  if (isVercel) {
    dbPath = '/tmp/gestor.sqlite';
    if (!existsSync(dbPath)) {
      const seedPath = fileURLToPath(new URL('../data/gestor.sqlite', import.meta.url));
      if (existsSync(seedPath)) {
        copyFileSync(seedPath, dbPath);
      }
    }
  } else {
    dbPath = fileURLToPath(new URL('../data/gestor.sqlite', import.meta.url));
  }
  const db = openDatabase(dbPath);
  seedDemo(db);
  const uploadsDir = isVercel ? '/tmp/uploads' : fileURLToPath(new URL('../uploads', import.meta.url));
  try { mkdirSync(uploadsDir, { recursive: true }); } catch {}
  handler = createHandler({ db, uploadsDir });
  return handler;
}

export default async function (req, res) {
  const h = getHandler();
  return h(req, res);
}
