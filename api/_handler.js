import { fileURLToPath } from 'node:url';
import { existsSync, copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openDatabase, seedDemo } from '../server/database.js';
import { createHandler } from '../server/http.js';
import { syncAllFromSupabase, syncPeopleFromSupabase } from '../server/supabase.js';

let appHandler = null;
let currentDb = null;
let lastSyncTime = 0;

async function ensureSync(db) {
  const now = Date.now();
  if (now - lastSyncTime < 15000) return;
  lastSyncTime = now;
  try {
    await syncAllFromSupabase(db, 'aurora');
  } catch (err) {
    console.error('[Vercel Supabase Sync Error]:', err.message);
  }
}

function getHandler() {
  if (appHandler) return appHandler;
  const isVercel = Boolean(process.env.VERCEL);
  let dbPath;

  if (isVercel) {
    dbPath = '/tmp/gestor.sqlite';
    if (!existsSync(dbPath)) {
      const candidates = [
        join(process.cwd(), 'data', 'gestor.sqlite'),
        fileURLToPath(new URL('../data/gestor.sqlite', import.meta.url)),
        join('/var/task', 'data', 'gestor.sqlite')
      ];
      for (const cand of candidates) {
        if (existsSync(cand)) {
          copyFileSync(cand, dbPath);
          break;
        }
      }
    }
  } else {
    dbPath = fileURLToPath(new URL('../data/gestor.sqlite', import.meta.url));
  }

  currentDb = openDatabase(dbPath);
  seedDemo(currentDb);
  const uploadsDir = isVercel ? '/tmp/uploads' : fileURLToPath(new URL('../uploads', import.meta.url));
  try { mkdirSync(uploadsDir, { recursive: true }); } catch {}
  appHandler = createHandler({ db: currentDb, uploadsDir });
  return appHandler;
}

export default async function (req, res) {
  try {
    const h = getHandler();
    if (currentDb) {
      await ensureSync(currentDb);
    }
    return await h(req, res);
  } catch (err) {
    console.error('API Handler Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: err.message || 'Erro interno no servidor.' }));
  }
}
