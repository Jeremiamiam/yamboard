#!/usr/bin/env node

/**
 * GBD Tools — CLI utility for GetBrandDone workflow operations
 *
 * Usage: node gbd-tools.cjs <command> [args]
 *
 * Commands:
 *   init <client-name>          Create project structure, return status JSON
 *   status <client-name>        Return available outputs JSON
 *   list-inputs <client-name>   List files in inputs/ with types
 *   timestamp [format]          Current date (full|date|filename) — default: date
 *   clients                     List all client projects with their status
 */

const fs = require('fs');
const path = require('path');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function out(data) {
  console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
}

function err(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function getClientsDir(cwd) {
  return path.join(cwd, 'clients');
}

function getClientDir(cwd, clientName) {
  return path.join(getClientsDir(cwd), clientName);
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fileExists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function getInputFiles(clientDir) {
  const inputsDir = path.join(clientDir, 'inputs');
  if (!fileExists(inputsDir)) return [];

  const files = fs.readdirSync(inputsDir).filter(f => !f.startsWith('.'));
  return files.map(f => {
    const ext = path.extname(f).toLowerCase();
    const types = {
      '.pdf': 'PDF',
      '.md': 'Markdown',
      '.txt': 'Texte',
      '.eml': 'Email',
      '.docx': 'Word',
      '.doc': 'Word',
      '.html': 'HTML',
      '.htm': 'HTML',
    };
    return {
      name: f,
      path: path.join(inputsDir, f),
      type: types[ext] || 'Fichier',
    };
  });
}

function getOutputStatus(clientDir) {
  const outputs = {
    contre_brief: fileExists(path.join(clientDir, 'outputs', 'CONTRE-BRIEF.json')),
    platform: fileExists(path.join(clientDir, 'outputs', 'PLATFORM.json')),
    campaign: fileExists(path.join(clientDir, 'outputs', 'CAMPAIGN.json')),
    site: fileExists(path.join(clientDir, 'outputs', 'SITE.json')),
    wiki: fileExists(path.join(clientDir, 'outputs', 'GBD-WIKI.html')),
  };
  return outputs;
}

// ─── Commands ─────────────────────────────────────────────────────────────────

/**
 * init <client-name>
 * Create project structure. Return JSON with status.
 */
function cmdInit(cwd, clientName) {
  if (!clientName) err('client-name requis. Usage: gbd-tools init <client-name>');

  const slug = slugify(clientName);
  const clientDir = getClientDir(cwd, slug);
  const exists = fileExists(clientDir);

  if (!exists) {
    // Create full structure
    fs.mkdirSync(path.join(clientDir, 'inputs'), { recursive: true });
    fs.mkdirSync(path.join(clientDir, 'session'), { recursive: true });
    fs.mkdirSync(path.join(clientDir, 'outputs'), { recursive: true });
  }

  const inputs = getInputFiles(clientDir);
  const outputs = getOutputStatus(clientDir);

  out({
    client_name: clientName,
    client_slug: slug,
    client_dir: clientDir,
    inputs_dir: path.join(clientDir, 'inputs'),
    outputs_dir: path.join(clientDir, 'outputs'),
    session_dir: path.join(clientDir, 'session'),
    project_existed: exists,
    input_count: inputs.length,
    inputs: inputs,
    outputs: outputs,
  });
}

/**
 * status <client-name>
 * Return JSON with available outputs and overall project status.
 */
function cmdStatus(cwd, clientName) {
  if (!clientName) err('client-name requis. Usage: gbd-tools status <client-name>');

  const slug = slugify(clientName);
  const clientDir = getClientDir(cwd, slug);

  if (!fileExists(clientDir)) {
    out({
      found: false,
      client_slug: slug,
      message: `Projet "${clientName}" non trouvé. Lance /gbd_start ${clientName}`,
    });
    return;
  }

  const inputs = getInputFiles(clientDir);
  const outputs = getOutputStatus(clientDir);

  const steps = [
    { key: 'contre_brief', label: 'Contre-brief', command: 'gbd_start' },
    { key: 'platform', label: 'Plateforme de marque', command: 'gbd_platform' },
    { key: 'campaign', label: 'Campagne', command: 'gbd_campaign' },
    { key: 'site', label: 'Site web', command: 'gbd_site' },
    { key: 'wiki', label: 'Wiki', command: 'gbd_wiki' },
  ];

  const completed = steps.filter(s => outputs[s.key]).length;
  const next = steps.find(s => !outputs[s.key]);

  out({
    found: true,
    client_name: clientName,
    client_slug: slug,
    client_dir: clientDir,
    input_count: inputs.length,
    inputs: inputs,
    outputs: outputs,
    progress: `${completed}/${steps.length}`,
    next_step: next ? { label: next.label, command: `/${next.command} ${clientName}` } : null,
  });
}

/**
 * list-inputs <client-name>
 * List all files in inputs/ with their types.
 */
function cmdListInputs(cwd, clientName) {
  if (!clientName) err('client-name requis. Usage: gbd-tools list-inputs <client-name>');

  const slug = slugify(clientName);
  const clientDir = getClientDir(cwd, slug);
  const inputs = getInputFiles(clientDir);

  out({
    client_slug: slug,
    inputs_dir: path.join(clientDir, 'inputs'),
    count: inputs.length,
    files: inputs,
  });
}

/**
 * timestamp [format]
 * Returns current date. Formats: full (ISO), date (YYYY-MM-DD), filename (YYYY-MM-DD)
 */
function cmdTimestamp(format) {
  const now = new Date();

  switch (format) {
    case 'full':
      out(now.toISOString());
      break;
    case 'filename':
      out(now.toISOString().slice(0, 10));
      break;
    case 'fr': {
      const opts = { day: 'numeric', month: 'long', year: 'numeric' };
      out(now.toLocaleDateString('fr-FR', opts));
      break;
    }
    default:
      out(now.toISOString().slice(0, 10));
  }
}

/**
 * clients
 * List all client projects in clients/ with their status.
 */
function cmdClients(cwd) {
  const clientsDir = getClientsDir(cwd);

  if (!fileExists(clientsDir)) {
    out({ count: 0, clients: [], message: 'Aucun projet client. Lance /gbd_start <client-name>' });
    return;
  }

  const dirs = fs.readdirSync(clientsDir).filter(d => {
    const full = path.join(clientsDir, d);
    return fs.statSync(full).isDirectory() && !d.startsWith('.');
  });

  const clients = dirs.map(slug => {
    const clientDir = path.join(clientsDir, slug);
    const outputs = getOutputStatus(clientDir);
    const inputs = getInputFiles(clientDir);
    const completed = Object.values(outputs).filter(Boolean).length;

    return {
      slug,
      dir: clientDir,
      input_count: inputs.length,
      outputs,
      progress: `${completed}/5`,
    };
  });

  out({
    count: clients.length,
    clients,
  });
}

/**
 * read-json <filepath>
 * Read and output a JSON file. Used by workflows to load output files.
 */
function cmdReadJson(filePath) {
  if (!filePath) err('filepath requis. Usage: gbd-tools read-json <filepath>');

  const resolved = path.resolve(filePath);
  if (!fileExists(resolved)) {
    out({ found: false, path: resolved });
    return;
  }

  try {
    const content = fs.readFileSync(resolved, 'utf8');
    const json = JSON.parse(content);
    out({ found: true, path: resolved, data: json });
  } catch (e) {
    out({ found: true, path: resolved, parse_error: e.message });
  }
}

/**
 * write-json <filepath> <json-string>
 * Write a JSON file, creating parent directories as needed.
 */
function cmdWriteJson(filePath, jsonString) {
  if (!filePath) err('filepath requis. Usage: gbd-tools write-json <filepath> <json>');

  const resolved = path.resolve(filePath);
  const dir = path.dirname(resolved);

  fs.mkdirSync(dir, { recursive: true });

  try {
    const json = JSON.parse(jsonString);
    fs.writeFileSync(resolved, JSON.stringify(json, null, 2), 'utf8');
    out({ success: true, path: resolved });
  } catch (e) {
    err(`JSON invalide : ${e.message}`);
  }
}

/**
 * write-session <client-name> <filename> <content>
 * Write a file to session/.
 */
function cmdWriteSession(cwd, clientName, filename, content) {
  const slug = slugify(clientName);
  const sessionDir = path.join(getClientDir(cwd, slug), 'session');
  fs.mkdirSync(sessionDir, { recursive: true });
  const filePath = path.join(sessionDir, filename);
  fs.writeFileSync(filePath, content, 'utf8');
  out({ success: true, path: filePath });
}

// ─── Router ───────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const cwd = process.cwd();

  if (!command) {
    err('Usage: gbd-tools <command> [args]\nCommands: init, status, list-inputs, timestamp, clients, read-json, write-json, write-session');
  }

  switch (command) {
    case 'init':
      cmdInit(cwd, args[1]);
      break;
    case 'status':
      cmdStatus(cwd, args[1]);
      break;
    case 'list-inputs':
      cmdListInputs(cwd, args[1]);
      break;
    case 'timestamp':
      cmdTimestamp(args[1] || 'date');
      break;
    case 'clients':
      cmdClients(cwd);
      break;
    case 'read-json':
      cmdReadJson(args[1]);
      break;
    case 'write-json':
      // Args after filepath are joined as the JSON string (handles spaces)
      cmdWriteJson(args[1], args.slice(2).join(' '));
      break;
    case 'write-session':
      cmdWriteSession(cwd, args[1], args[2], args.slice(3).join(' '));
      break;
    default:
      err(`Commande inconnue : ${command}\nDisponibles : init, status, list-inputs, timestamp, clients, read-json, write-json, write-session`);
  }
}

main();
