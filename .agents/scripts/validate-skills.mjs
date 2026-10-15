#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '../..');
const skillsDirectory = path.join(repositoryRoot, '.agents', 'skills');
const indexPath = path.join(skillsDirectory, 'README.md');
const failures = [];

function fail(message) {
  failures.push(message);
}

function readText(filePath) {
  return readFileSync(filePath, 'utf8');
}

function parseFrontmatter(filePath) {
  const content = readText(filePath);
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);

  if (!match) {
    fail(`${path.relative(repositoryRoot, filePath)}: missing YAML frontmatter block`);
    return null;
  }

  const frontmatter = match[1];
  const values = {};

  for (const key of ['name', 'description']) {
    const lines = frontmatter.split(/\r?\n/).filter(line => new RegExp(`^${key}\\s*:`).test(line));

    if (lines.length !== 1) {
      fail(`${path.relative(repositoryRoot, filePath)}: expected exactly one "${key}" field in frontmatter`);
      continue;
    }

    const value = lines[0].replace(new RegExp(`^${key}\\s*:\\s*`), '').trim();
    values[key] = value.replace(/^(['"])(.*)\1$/, '$2');

    if (!values[key]) {
      fail(`${path.relative(repositoryRoot, filePath)}: "${key}" must not be empty`);
    }
  }

  return values;
}

function extractMarkdownLinks(content) {
  const links = [];
  const expression = /\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+[^)]*)?\)/g;

  for (const match of content.matchAll(expression)) {
    links.push(match[1].replace(/^<|>$/g, ''));
  }

  return links;
}

function checkLocalLinks(filePath) {
  const content = readText(filePath);

  for (const target of extractMarkdownLinks(content)) {
    if (
      target.startsWith('#')
      || target.startsWith('//')
      || /^[a-z][a-z\d+.-]*:/i.test(target)
    ) {
      continue;
    }

    const cleanTarget = target.split(/[?#]/, 1)[0];

    if (!cleanTarget) {
      continue;
    }

    let decodedTarget = cleanTarget;

    try {
      decodedTarget = decodeURIComponent(cleanTarget);
    } catch {
      fail(`${path.relative(repositoryRoot, filePath)}: malformed URL encoding in link "${target}"`);
      continue;
    }

    const resolvedPath = decodedTarget.startsWith('/')
      ? path.resolve(repositoryRoot, decodedTarget.slice(1))
      : path.resolve(path.dirname(filePath), decodedTarget);

    if (!existsSync(resolvedPath)) {
      fail(`${path.relative(repositoryRoot, filePath)}: broken local link "${target}"`);
    }
  }
}

if (!existsSync(indexPath)) {
  console.error('Agent skill validation failed: .agents/skills/README.md is missing.');
  process.exit(1);
}

const skillDirectories = readdirSync(skillsDirectory, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();

const skillNames = new Set();

for (const directoryName of skillDirectories) {
  const skillPath = path.join(skillsDirectory, directoryName, 'SKILL.md');

  if (!existsSync(skillPath)) {
    fail(`.agents/skills/${directoryName}: directory is missing SKILL.md`);
    continue;
  }

  const metadata = parseFrontmatter(skillPath);

  if (!metadata) {
    continue;
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.name ?? '')) {
    fail(`${path.relative(repositoryRoot, skillPath)}: name must be lowercase kebab-case`);
  }

  if (metadata.name !== directoryName) {
    fail(`${path.relative(repositoryRoot, skillPath)}: frontmatter name "${metadata.name}" must match directory "${directoryName}"`);
  }

  if (skillNames.has(metadata.name)) {
    fail(`${path.relative(repositoryRoot, skillPath)}: duplicate skill name "${metadata.name}"`);
  }

  skillNames.add(metadata.name);
  checkLocalLinks(skillPath);
}

const indexContent = readText(indexPath);
const indexedSkillPaths = extractMarkdownLinks(indexContent)
  .map(target => target.split(/[?#]/, 1)[0].replace(/^\.\//, ''))
  .filter(target => /^([^/]+)\/SKILL\.md$/.test(target));

const indexCounts = new Map();

for (const target of indexedSkillPaths) {
  const name = target.slice(0, -'/SKILL.md'.length);
  indexCounts.set(name, (indexCounts.get(name) ?? 0) + 1);

  if (!skillNames.has(name)) {
    fail(`.agents/skills/README.md: index links to unknown skill "${name}"`);
  }
}

for (const name of skillNames) {
  const count = indexCounts.get(name) ?? 0;

  if (count !== 1) {
    fail(`.agents/skills/README.md: expected skill "${name}" exactly once in the routing index; found ${count}`);
  }
}

checkLocalLinks(indexPath);

if (failures.length > 0) {
  console.error(`Agent skill validation failed (${failures.length} issue${failures.length === 1 ? '' : 's'}):`);

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log(`Agent skill validation passed: ${skillNames.size} skills, valid frontmatter, complete routing index, and local links resolved.`);
