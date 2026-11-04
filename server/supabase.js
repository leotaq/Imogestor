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
  if (process.env.NODE_ENV === 'test' || Boolean(process.env.NODE_TEST_CONTEXT)) {
    return false;
  }
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

export function mapSupabaseTypeToKind(type) {
  switch (type) {
    case 'ocupacao': return 'occupation';
    case 'desocupacao': return 'move_out';
    case 'revistoria': return 'reinspection';
    case 'visita': return 'visit';
    case 'placa_fotos': return 'plate_photos';
    case 'manutencao': return 'maintenance';
    default: return 'occupation';
  }
}

export function mapAppKindToSupabaseType(kind) {
  switch (kind) {
    case 'occupation': return 'ocupacao';
    case 'move_out': return 'desocupacao';
    case 'reinspection': return 'revistoria';
    case 'visit': return 'visita';
    case 'plate_photos': return 'placa_fotos';
    case 'maintenance': return 'manutencao';
    default: return 'ocupacao';
  }
}

export function mapSupabaseStatusToApp(status) {
  if (status === 'canceled') return 'cancelled';
  if (['new', 'received', 'in_progress', 'no_contract', 'completed', 'finalized', 'cancelled'].includes(status)) {
    return status;
  }
  return 'new';
}

export function mapAppStatusToSupabaseStatus(status) {
  switch (status) {
    case 'cancelled': return 'canceled';
    case 'received': return 'scheduled';
    case 'in_progress': return 'scheduled';
    case 'no_contract': return 'canceled';
    case 'completed': return 'completed';
    case 'finalized': return 'finalized';
    default: return 'new';
  }
}

/**
 * Syncs properties from Supabase into SQLite.
 */
export async function syncPropertiesFromSupabase(db, orgId = 'aurora') {
  if (!isSupabaseConfigured() || !db) return;
  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/properties?select=*&limit=1000', {
      headers: getSupabaseHeaders()
    });
    if (!res.ok) {
      console.warn('[Supabase Sync Properties Warning]:', res.status, res.statusText);
      return;
    }
    const properties = await res.json();
    if (!Array.isArray(properties)) return;

    const findProp = db.prepare('SELECT id, code FROM properties WHERE id = ? OR code = ? LIMIT 1');
    const insertProp = db.prepare(`
      INSERT INTO properties (
        id, org_id, code, name, address, unit, tenant, contact, owner, active,
        property_street, property_number, property_complement, property_neighborhood, property_city
      ) VALUES (?, ?, ?, ?, ?, ?, '', '', '', 1, ?, ?, ?, ?, ?)
    `);
    const updateProp = db.prepare(`
      UPDATE properties SET
        name = ?, address = ?, unit = ?,
        property_street = ?, property_number = ?, property_complement = ?,
        property_neighborhood = ?, property_city = ?
      WHERE id = ?
    `);

    for (const p of properties) {
      const existing = findProp.get(p.id, p.code);
      const unit = p.property_complement || '';
      const name = p.property_street ? `${p.property_street}${p.property_number ? ', ' + p.property_number : ''}` : p.address;
      if (!existing) {
        insertProp.run(
          p.id,
          orgId,
          p.code,
          name,
          p.address,
          unit,
          p.property_street || '',
          p.property_number || '',
          p.property_complement || '',
          p.property_neighborhood || '',
          p.property_city || 'Taquara'
        );
      } else {
        updateProp.run(
          name,
          p.address,
          unit,
          p.property_street || '',
          p.property_number || '',
          p.property_complement || '',
          p.property_neighborhood || '',
          p.property_city || 'Taquara',
          existing.id
        );
      }
    }
  } catch (err) {
    console.error('[Supabase Sync Properties Error]:', err.message);
  }
}

/**
 * Syncs inspections from Supabase into SQLite.
 */
export async function syncInspectionsFromSupabase(db, orgId = 'aurora') {
  if (!isSupabaseConfigured() || !db) return;
  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/inspections?select=*&order=created_at.desc&limit=1000', {
      headers: getSupabaseHeaders()
    });
    if (!res.ok) {
      console.warn('[Supabase Sync Inspections Warning]:', res.status, res.statusText);
      return;
    }
    const inspections = await res.json();
    if (!Array.isArray(inspections)) return;

    const findInsp = db.prepare('SELECT id, protocol, status, revision FROM inspections WHERE id = ?');
    const propByCode = db.prepare('SELECT id, code, address, unit, name FROM properties WHERE code = ? LIMIT 1');
    const insertProp = db.prepare(`
      INSERT INTO properties (
        id, org_id, code, name, address, unit, tenant, contact, owner, active,
        property_street, property_number, property_complement, property_neighborhood, property_city
      ) VALUES (?, ?, ?, ?, ?, ?, '', '', '', 1, ?, ?, ?, ?, ?)
    `);
    const defaultAdmin = db.prepare("SELECT id FROM users WHERE org_id = ? AND role = 'admin' LIMIT 1").get(orgId)?.id || 'marina';

    const insertInsp = db.prepare(`
      INSERT INTO inspections (
        id, org_id, protocol, property_id, property_code_snapshot, address_snapshot,
        kind, requester_id, inspector_id, status, deadline_at, scheduled_at, scheduled_end,
        duration_minutes, contract_id, reason, completion_note, created_at, updated_at, revision
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, 1)
    `);

    const updateInsp = db.prepare(`
      UPDATE inspections SET
        inspector_id = ?, status = ?, deadline_at = ?, scheduled_at = ?, scheduled_end = ?,
        duration_minutes = ?, reason = ?, completion_note = ?, updated_at = ?
      WHERE id = ?
    `);

    const insertEvent = db.prepare(`
      INSERT INTO inspection_events (org_id, inspection_id, actor, action, detail, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const s of inspections) {
      const existing = findInsp.get(s.id);
      const kind = mapSupabaseTypeToKind(s.type);
      const status = mapSupabaseStatusToApp(s.status);
      const deadline = s.contract_date ? s.contract_date.slice(0, 10) : '';
      const scheduled = s.scheduled_start || '';
      const scheduledEnd = s.scheduled_end || '';
      const duration = Number(s.duration_minutes) || 0;
      const reason = s.notes || '';
      const completionNote = s.completed_at ? (s.notes || '') : '';
      const updatedAt = s.updated_at || s.created_at || new Date().toISOString();

      if (existing) {
        updateInsp.run(
          s.assigned_to || null,
          status,
          deadline,
          scheduled,
          scheduledEnd,
          duration,
          reason,
          completionNote,
          updatedAt,
          s.id
        );
      } else {
        let prop = s.property_code ? propByCode.get(s.property_code) : null;
        let propId = prop?.id;
        let propCode = s.property_code || '';
        let addressSnapshot = s.property_address || '';

        if (!propId) {
          propId = 'prop-' + (s.property_code || s.id.slice(0, 8));
          insertProp.run(
            propId,
            orgId,
            propCode,
            s.property_street || s.property_address || 'Imóvel ' + propCode,
            addressSnapshot,
            s.property_complement || '',
            s.property_street || '',
            s.property_number || '',
            s.property_complement || '',
            s.property_neighborhood || '',
            s.property_city || 'Taquara'
          );
        }

        const count = db.prepare('SELECT COUNT(*) n FROM inspections WHERE org_id = ?').get(orgId).n;
        const protocol = `VST-${String(count + 1).padStart(4, '0')}`;
        const requesterId = s.created_by || defaultAdmin;

        insertInsp.run(
          s.id,
          orgId,
          protocol,
          propId,
          propCode,
          addressSnapshot,
          kind,
          requesterId,
          s.assigned_to || null,
          status,
          deadline,
          scheduled,
          scheduledEnd,
          duration,
          reason,
          completionNote,
          s.created_at,
          updatedAt
        );

        insertEvent.run(
          orgId,
          s.id,
          'Sistema (Supabase)',
          'Vistoria importada',
          `Vistoria sincronizada do Supabase (${kind} · código ${propCode}).`,
          s.created_at
        );
      }
    }
  } catch (err) {
    console.error('[Supabase Sync Inspections Error]:', err.message);
  }
}

/**
 * Syncs a single inspection from panel to Supabase.
 */
export async function syncInspectionToSupabase(inspection, property) {
  if (!isSupabaseConfigured() || !inspection) return null;
  try {
    const payload = {
      id: inspection.id,
      type: mapAppKindToSupabaseType(inspection.kind),
      status: mapAppStatusToSupabaseStatus(inspection.status),
      property_code: inspection.property_code_snapshot || property?.code || '',
      property_address: inspection.address_snapshot || property?.address || '',
      scheduled_start: inspection.scheduled_at || null,
      scheduled_end: inspection.scheduled_end || null,
      duration_minutes: inspection.duration_minutes || null,
      contract_date: inspection.deadline_at || null,
      notes: inspection.completion_note || inspection.reason || null,
      updated_at: inspection.updated_at || new Date().toISOString()
    };
    if (inspection.requester_id && inspection.requester_id.length > 20) {
      payload.created_by = inspection.requester_id;
    }
    if (inspection.inspector_id && inspection.inspector_id.length > 20) {
      payload.assigned_to = inspection.inspector_id;
    }
    if (['completed', 'finalized'].includes(inspection.status)) {
      payload.completed_at = inspection.updated_at || new Date().toISOString();
    }

    const res = await fetch(SUPABASE_URL + '/rest/v1/inspections', {
      method: 'POST',
      headers: {
        ...getSupabaseHeaders(),
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errTxt = await res.text().catch(() => '');
      console.warn('[Supabase Inspection Sync Warning]:', res.status, res.statusText, errTxt);
      return null;
    }
    return await res.json().catch(() => null);
  } catch (err) {
    console.error('[Supabase Inspection Sync Error]:', err.message);
    return null;
  }
}

/**
 * Full synchronization of all entities from Supabase.
 */
export async function syncAllFromSupabase(db, orgId = 'aurora') {
  if (!isSupabaseConfigured() || !db) return;
  await syncPeopleFromSupabase(db, orgId);
  await syncPropertiesFromSupabase(db, orgId);
  await syncInspectionsFromSupabase(db, orgId);
}
