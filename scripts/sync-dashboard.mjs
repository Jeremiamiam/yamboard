#!/usr/bin/env node
/**
 * Sync dashboard — Envoie les clients et wikis locaux vers Supabase getBrandon
 *
 * Usage: node scripts/sync-dashboard.mjs
 * Prérequis: SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

function loadEnv() {
  // Clés dans webapp/ (dossier au-dessus de getBrandon)
  const webappEnv = path.join(rootDir, '..', 'webapp', '.env.local');
  const localEnv = path.join(rootDir, '.env');
  const envPath = fs.existsSync(webappEnv) ? webappEnv : localEnv;
  if (!fs.existsSync(envPath)) return {};
  const vars = {};
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) return;
    vars[line.slice(0, eqIdx).trim()] = line.slice(eqIdx + 1).trim();
  });
  return vars;
}

const ENV = loadEnv();
const supabaseUrl = ENV.SUPABASE_URL || ENV.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Erreur: NEXT_PUBLIC_SUPABASE_URL + (SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) requis dans webapp/.env.local'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function getClientsDir() {
  return path.join(rootDir, 'clients');
}

function fileExists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function getOutputStatus(clientDir) {
  const outputsDir = path.join(clientDir, 'outputs');
  const hasBrief =
    fileExists(path.join(outputsDir, 'BRIEF-STRATEGIQUE.json')) ||
    fileExists(path.join(outputsDir, 'CONTRE-BRIEF.json'));
  return {
    brief_strategique: hasBrief,
    platform: fileExists(path.join(clientDir, 'outputs', 'PLATFORM.json')),
    campaign: fileExists(path.join(clientDir, 'outputs', 'CAMPAIGN.json')),
    site: fileExists(path.join(clientDir, 'outputs', 'SITE.json')),
    wiki: fileExists(path.join(clientDir, 'outputs', 'GBD-WIKI.html')),
  };
}

async function sync() {
  const clientsDir = getClientsDir();
  if (!fileExists(clientsDir)) {
    console.log('Aucun dossier clients/ trouvé.');
    return;
  }

  const dirs = fs.readdirSync(clientsDir).filter((d) => {
    const full = path.join(clientsDir, d);
    return fs.statSync(full).isDirectory() && !d.startsWith('.');
  });

  let synced = 0;
  let errors = 0;

  for (const slug of dirs) {
    const clientDir = path.join(clientsDir, slug);
    const outputs = getOutputStatus(clientDir);
    const completed = Object.values(outputs).filter(Boolean).length;
    const progress = `${completed}/5`;

    const name = slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    try {
      const { error: clientErr } = await supabase.from('dashboard_clients').upsert(
        { slug, name, outputs, progress, updated_at: new Date().toISOString() },
        { onConflict: 'slug' }
      );
      if (clientErr) throw clientErr;

      let wikiHtml = null;
      const wikiPath = path.join(clientDir, 'outputs', 'GBD-WIKI.html');
      if (fileExists(wikiPath)) {
        wikiHtml = fs.readFileSync(wikiPath, 'utf8');
      }

      const { error: wikiErr } = await supabase.from('dashboard_wikis').upsert(
        {
          client_slug: slug,
          html_content: wikiHtml,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'client_slug' }
      );
      if (wikiErr) throw wikiErr;

      synced++;
      console.log(`✓ ${name} (${slug})`);
    } catch (e) {
      errors++;
      console.error(`✗ ${slug}:`, e.message);
    }
  }

  console.log(`\nSync terminé: ${synced} clients, ${errors} erreurs`);
}

sync().catch((e) => {
  console.error(e);
  process.exit(1);
});
