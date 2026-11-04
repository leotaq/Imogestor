import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { passwordHash } from './database.js';

// Try loading environment variables from .env relative to project root or cwd
try {
  const localEnv = fileURLToPath(new URL('../.env', import.meta.url));
  if (existsSync(localEnv) && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(localEnv);
  } else if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch {
  // Ignore if .env is missing or already loaded
}

const DEFAULT_SUPABASE_URL = 'https://pfakuvnuyixebvtmwmgu.supabase.co';
const DEFAULT_SERVICE_KEY = '';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

export function getSupabaseHeaders() {
  return {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json'
  };
}

export function mapUserToPersonRole(userOrInput) {
  const title = String(userOrInput.job_title || '').trim().toLowerCase();
  const role = String(userOrInput.role || '').trim().toLowerCase();
  if (title === 'vistoriador') return 'inspector';
  if (title === 'atendente') return 'attendant';
  if (title === 'assistente') return 'assistant';
  if (title === 'marketing') return 'marketing';
  if (title === 'scheduler') return 'scheduler';
  if (role === 'admin' || title === 'gestora' || title === 'gerente') return 'manager';
  if (role === 'finance') return 'manager';
  return 'attendant';
}

export function mapPersonRoleToJobTitle(role) {
  switch (role) {
    case 'inspector': return 'vistoriador';
    case 'attendant': return 'atendente';
    case 'assistant': return 'assistente';
    case 'marketing': return 'marketing';
    case 'manager': return 'gestora';
    default: return '';
  }
}

function slug(value) {
  return (value || '')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'usuario';
}

/**
 * Syncs a user record (or update) to Supabase 'people' table.
 */
export async function syncUserToSupabase(userRecord) {
  if (!isSupabaseConfigured() || !userRecord) {
    return null;
  }

  // Demo users without UUID shouldn't pollute real Supabase people
  if (['marina', 'rafael', 'bia', 'outra'].includes(userRecord.id)) {
    return null;
  }

  const payload = {
    id: userRecord.id,
    name: userRecord.name,
    role: mapUserToPersonRole(userRecord),
    active: Boolean(userRecord.active === 1 || userRecord.active === true)
  };

  if (userRecord.phone) {
    payload.phone = userRecord.phone;
  }

  const res = await fetch(SUPABASE_URL + '/rest/v1/people', {
    method: 'POST',
    headers: {
      ...getSupabaseHeaders(),
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error('Falha no Supabase people (' + res.status + ' ' + res.statusText + '): ' + errorText);
  }

  const result = await res.json().catch(() => null);
  return Array.isArray(result) ? result[0] : result;
}

/**
 * Bidirectional reconciliation: pulls people from Supabase into SQLite,
 * and ensures any valid SQLite users are present in Supabase.
 */
export async function syncPeopleFromSupabase(db, orgId = 'aurora') {
  if (!isSupabaseConfigured() || !db) return;

  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/people?select=*', {
      headers: getSupabaseHeaders()
    });

    if (!res.ok) {
      console.warn('[Supabase Sync] Falha ao consultar people:', res.status, res.statusText);
      return;
    }

    const people = await res.json();
    if (!Array.isArray(people)) return;

    const existingUsers = db.prepare('SELECT id, org_id, name, username, email, role, job_title, active FROM users').all();
    const userMap = new Map(existingUsers.map(u => [u.id, u]));
    const usedUsernames = new Set(existingUsers.map(u => u.username.toLowerCase()));

    const updateUser = db.prepare('UPDATE users SET name=?, role=?, job_title=?, active=? WHERE id=?');
    const insertUser = db.prepare('INSERT INTO users (id, org_id, name, username, email, password, role, job_title, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');

    // 1. Sync from Supabase -> SQLite
    for (const person of people) {
      const current = userMap.get(person.id);
      const appRole = person.role === 'manager' ? 'admin' : 'staff';
      const appJobTitle = mapPersonRoleToJobTitle(person.role);
      const activeInt = person.active ? 1 : 0;

      if (current) {
        if (current.name !== person.name || current.active !== activeInt) {
          updateUser.run(person.name, current.role || appRole, current.job_title || appJobTitle, activeInt, person.id);
        }
      } else {
        const base = slug(person.name);
        const suffix = person.id.replace(/[^a-z0-9]/g, '').slice(0, 6);
        let username = base;
        let attempt = 1;
        while (usedUsernames.has(username.toLowerCase())) {
          username = base + '_' + suffix + (attempt === 1 ? '' : '_' + attempt);
          attempt++;
        }
        usedUsernames.add(username.toLowerCase());
        const email = username + '@aliceimoveis.com.br';
        const defaultPasswordHash = passwordHash('1234');

        insertUser.run(
          person.id,
          orgId,
          person.name,
          username,
          email,
          defaultPasswordHash,
          appRole,
          appJobTitle,
          activeInt
        );
      }
    }

    // 2. Push SQLite users missing from Supabase
    const peopleIds = new Set(people.map(p => p.id));
    for (const u of existingUsers) {
      if (['marina', 'rafael', 'bia', 'outra'].includes(u.id)) continue;
      if (!peopleIds.has(u.id) && u.id.length > 20) {
        await syncUserToSupabase(u).catch(e => console.error('[Supabase Push Error for ' + u.name + ']:', e.message));
      }
    }
  } catch (err) {
    console.error('[Supabase Sync Error]:', err.message);
  }
}

/**
 * Syncs property created in panel to Supabase 'properties' table.
 */
export async function syncPropertyToSupabase(property) {
  if (!isSupabaseConfigured() || !property) return null;

  try {
    const payload = {
      id: property.id,
      code: property.code,
      code_normalized: property.code,
      address: property.address,
      property_street: property.property_street || property.name || '',
      property_number: property.property_number || '',
      property_complement: property.property_complement || property.unit || '',
      property_neighborhood: property.property_neighborhood || '',
      property_city: property.property_city || 'Taquara'
    };

    const res = await fetch(SUPABASE_URL + '/rest/v1/properties', {
      method: 'POST',
      headers: {
        ...getSupabaseHeaders(),
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.warn('[Supabase Property Sync Warning]:', res.status, res.statusText);
      return null;
    }

    return await res.json().catch(() => null);
  } catch (err) {
    console.error('[Supabase Property Sync Error]:', err.message);
    return null;
  }
}
