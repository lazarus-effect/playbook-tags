#!/usr/bin/env node
// Validator for the Playbook tag database. No dependencies on purpose: anyone who can run Node can
// check their contribution before opening a PR, and CI runs exactly the same command.
//
//   node validate.mjs            # every file in data/
//   node validate.mjs data/x.json
//
// Checks the schema (a small subset of JSON Schema, enough for this file), plus the rules a schema
// can't express: unique keys within a file, no duplicate keys across files, toggle/rider only when
// tagged, and the content rule — entries carry ids, names, and opinions, never rules text.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SCHEMA = JSON.parse(readFileSync(new URL('./schema/tags.schema.json', import.meta.url), 'utf8'));
const root = new URL('.', import.meta.url).pathname;

const errors = [];
const fail = (file, path, message) => errors.push(`${file}${path ? ` ${path}` : ''}: ${message}`);

/** Resolve a local $ref against the schema document. */
function deref(node) {
  if (!node || typeof node !== 'object' || !node.$ref) return node;
  const parts = node.$ref.replace(/^#\//, '').split('/');
  return parts.reduce((acc, part) => acc?.[part], SCHEMA);
}

const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v === 'number' && Number.isInteger(v) ? 'integer' : typeof v);
const typeOk = (v, type) => {
  const want = Array.isArray(type) ? type : [type];
  const actual = typeOf(v);
  return want.some((t) => t === actual || (t === 'number' && actual === 'integer'));
};

/** The subset of JSON Schema this file uses: type, const, enum, required, additionalProperties,
 *  properties, items, minimum/maximum, minLength/maxLength, pattern, minItems, uniqueItems, $ref. */
function check(value, schemaNode, file, path) {
  const schema = deref(schemaNode);
  if (!schema) return;
  if ('const' in schema && value !== schema.const) return fail(file, path, `must be ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(value)) return fail(file, path, `must be one of: ${schema.enum.join(', ')} (got ${JSON.stringify(value)})`);
  if (schema.type && !typeOk(value, schema.type)) return fail(file, path, `must be ${Array.isArray(schema.type) ? schema.type.join(' or ') : schema.type} (got ${typeOf(value)})`);

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) fail(file, path, `must be at least ${schema.minLength} character(s)`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) fail(file, path, `must be at most ${schema.maxLength} characters`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) fail(file, path, `must match ${schema.pattern}`);
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) fail(file, path, `must be >= ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) fail(file, path, `must be <= ${schema.maximum}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) fail(file, path, `needs at least ${schema.minItems} item(s)`);
    if (schema.uniqueItems && new Set(value.map((v) => JSON.stringify(v))).size !== value.length) fail(file, path, 'has duplicate items');
    if (schema.items) value.forEach((v, i) => check(v, schema.items, file, `${path}[${i}]`));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required ?? []) if (!(key in value)) fail(file, path, `missing "${key}"`);
    for (const [key, v] of Object.entries(value)) {
      const sub = schema.properties?.[key];
      if (!sub) {
        if (schema.additionalProperties === false) fail(file, `${path}.${key}`, 'is not a field in the schema');
        continue;
      }
      check(v, sub, file, `${path}.${key}`);
    }
  }
}

// Rules a schema can't state.
const RULES_TEXT = /\b(you (can|may|must|regain|gain|have)|as an action|saving throw against|hit points equal to|the target must|choose one of the following)\b/i;

function checkEntryRules(entry, file, path) {
  const tags = entry.tags ?? [];
  if (entry.toggle && !tags.includes('toggle')) fail(file, path, 'has a toggle block but is not tagged "toggle"');
  if (entry.rider && !tags.includes('rider')) fail(file, path, 'has a rider block but is not tagged "rider"');
  if (tags.includes('concentration') && entry.kind !== 'spell') fail(file, path, 'only spells can be tagged "concentration"');
  if (entry.definitionId === undefined && entry.source === 'hand') {
    fail(file, path, 'a hand-curated entry needs a definitionId (name-only keys are for homebrew fallback)');
  }
  // Content rule (PRD 5, 9.3): opinions only. A long prose note is how rules text sneaks in.
  if (entry.note && RULES_TEXT.test(entry.note)) fail(file, path, 'note reads like rules text — say why Playbook ranks it this way instead');
}

const keyOf = (entry) => (entry.definitionId ? `${entry.kind}:${entry.definitionId}` : `${entry.kind}:name:${entry.name.toLowerCase()}`);

function validateFile(file, seenAcrossFiles) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    return fail(file, '', `is not valid JSON — ${e.message}`);
  }
  check(parsed, SCHEMA, file, '');
  const seenHere = new Map();
  for (const [i, entry] of (parsed.entries ?? []).entries()) {
    if (!entry || typeof entry !== 'object') continue;
    const path = `entries[${i}]`;
    checkEntryRules(entry, file, path);
    if (typeof entry.name !== 'string' || typeof entry.kind !== 'string') continue;
    const key = keyOf(entry);
    if (seenHere.has(key)) fail(file, path, `duplicate key ${key} (also ${seenHere.get(key)})`);
    else seenHere.set(key, path);
    const elsewhere = seenAcrossFiles.get(key);
    if (elsewhere && elsewhere.file !== file) fail(file, path, `key ${key} is already defined in ${elsewhere.file}`);
    else seenAcrossFiles.set(key, { file, path });
  }
  return parsed.entries?.length ?? 0;
}

const args = process.argv.slice(2);
const dataDir = join(root, 'data');
const files = args.length
  ? args.map((f) => resolve(f))
  : existsSync(dataDir) ? readdirSync(dataDir).filter((f) => f.endsWith('.json')).sort().map((f) => join(dataDir, f)) : [];

if (files.length === 0) {
  console.error('No data files found. Put tag files in data/*.json, or pass paths.');
  process.exit(2);
}

let entries = 0;
const seen = new Map();
for (const file of files) entries += validateFile(file, seen) || 0;

const rel = (f) => f.replace(root, '');
if (errors.length) {
  console.error(`✖ ${errors.length} problem(s) in ${files.length} file(s):\n`);
  for (const e of errors) console.error('  ' + rel(e));
  process.exit(1);
}
console.log(`✔ ${files.length} file(s), ${entries} entries, ${seen.size} unique keys — schema v${SCHEMA.properties.schemaVersion.const} OK`);
