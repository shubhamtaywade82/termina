#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '../..');
const taskDirectory = path.join(repositoryRoot, '.agents', 'evals', 'tasks');
const skillsDirectory = path.join(repositoryRoot, '.agents', 'skills');
const failures = [];

const allowedKinds = new Set(['implementation', 'analysis', 'core-regression']);
const allowedVerifications = new Set(['test', 'terminal-run', 'static-review', 'manual-review']);
const allowedExecutionModes = new Set([
  'interactive',
  'piped-stdin',
  'redirected-stdout',
  'term-dumb',
  'xterm-emulator',
  'repository-inspection',
]);
const allowedDimensions = new Set([
  'api-grounding',
  'ux-hierarchy',
  'terminal-resilience',
  'interaction',
  'async-integrity',
  'accessibility',
  'tests',
  'engineering-discipline',
]);

function fail(source, message) {
  failures.push(`${source}: ${message}`);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isUniqueStringArray(value) {
  return Array.isArray(value)
    && value.every(isNonEmptyString)
    && new Set(value).size === value.length;
}

function getKnownSkillNames() {
  if (!existsSync(skillsDirectory)) {
    fail('.agents/evals/tasks', 'skills directory is missing');
    return new Set();
  }

  const names = new Set();

  for (const entry of readdirSync(skillsDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const skillPath = path.join(skillsDirectory, entry.name, 'SKILL.md');

    if (!existsSync(skillPath)) {
      continue;
    }

    const content = readFileSync(skillPath, 'utf8');
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    const name = match?.[1].match(/^name:\s*(.+?)\s*$/m)?.[1]?.trim();

    if (name) {
      names.add(name);
    }
  }

  return names;
}

function validateTask(task, fileName, knownSkills) {
  const source = `.agents/evals/tasks/${fileName}`;

  if (!task || typeof task !== 'object' || Array.isArray(task)) {
    fail(source, 'task must be a JSON object');
    return;
  }

  if (task.schema_version !== 1) {
    fail(source, 'schema_version must be 1');
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(task.id ?? '')) {
    fail(source, 'id must be lowercase kebab-case');
  }

  if (fileName !== `${task.id}.json`) {
    fail(source, `filename must match task id ("${task.id}.json")`);
  }

  for (const field of ['title', 'user_prompt']) {
    if (!isNonEmptyString(task[field])) {
      fail(source, `"${field}" must be a non-empty string`);
    }
  }

  if (!allowedKinds.has(task.kind)) {
    fail(source, `kind must be one of: ${[...allowedKinds].join(', ')}`);
  }

  for (const field of ['expected_skills', 'adjacent_skills_not_required']) {
    if (!isUniqueStringArray(task[field])) {
      fail(source, `"${field}" must be an array of unique non-empty strings`);
      continue;
    }

    for (const name of task[field]) {
      if (!knownSkills.has(name)) {
        fail(source, `"${field}" refers to unknown skill "${name}"`);
      }

      if (field === 'expected_skills' && task.user_prompt?.toLowerCase().includes(name.toLowerCase())) {
        fail(source, `user_prompt must not reveal evaluator-only skill name "${name}"`);
      }
    }
  }

  if (
    Array.isArray(task.expected_skills)
    && Array.isArray(task.adjacent_skills_not_required)
    && task.expected_skills.some(name => task.adjacent_skills_not_required.includes(name))
  ) {
    fail(source, 'a skill cannot be both expected and marked not required');
  }

  const environment = task.environment;

  if (!environment || typeof environment !== 'object' || Array.isArray(environment)) {
    fail(source, '"environment" must be an object');
  } else {
    if (!Array.isArray(environment.terminal_sizes)) {
      fail(source, 'environment.terminal_sizes must be an array');
    } else {
      const seenSizes = new Set();

      for (const size of environment.terminal_sizes) {
        if (
          !size
          || !Number.isInteger(size.columns)
          || size.columns <= 0
          || !Number.isInteger(size.rows)
          || size.rows <= 0
        ) {
          fail(source, 'each terminal size must contain positive integer columns and rows');
          continue;
        }

        const key = `${size.columns}x${size.rows}`;

        if (seenSizes.has(key)) {
          fail(source, `terminal size ${key} is duplicated`);
        }

        seenSizes.add(key);
      }
    }

    if (!isUniqueStringArray(environment.execution_modes) || environment.execution_modes.length === 0) {
      fail(source, 'environment.execution_modes must contain unique non-empty strings');
    } else {
      for (const mode of environment.execution_modes) {
        if (!allowedExecutionModes.has(mode)) {
          fail(source, `unknown execution mode "${mode}"`);
        }
      }
    }
  }

  if (!Array.isArray(task.acceptance_checks) || task.acceptance_checks.length < 2) {
    fail(source, 'acceptance_checks must contain at least two objective checks');
  } else {
    const checkIds = new Set();

    for (const check of task.acceptance_checks) {
      if (!check || typeof check !== 'object' || Array.isArray(check)) {
        fail(source, 'every acceptance check must be an object');
        continue;
      }

      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(check.id ?? '')) {
        fail(source, 'acceptance check id must be lowercase kebab-case');
      } else if (checkIds.has(check.id)) {
        fail(source, `duplicate acceptance check id "${check.id}"`);
      }

      checkIds.add(check.id);

      if (!allowedVerifications.has(check.verification)) {
        fail(source, `check "${check.id}" has unknown verification method "${check.verification}"`);
      }

      if (!isNonEmptyString(check.assertion)) {
        fail(source, `check "${check.id}" needs a non-empty assertion`);
      }

      if (!isNonEmptyString(check.evidence_required)) {
        fail(source, `check "${check.id}" needs an evidence_required description`);
      }
    }
  }

  if (!Array.isArray(task.hard_gates) || task.hard_gates.length === 0) {
    fail(source, 'hard_gates must contain at least one hard-failure condition');
  } else {
    const gateIds = new Set();

    for (const gate of task.hard_gates) {
      if (!gate || typeof gate !== 'object' || Array.isArray(gate)) {
        fail(source, 'every hard gate must be an object');
        continue;
      }

      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(gate.id ?? '')) {
        fail(source, 'hard gate id must be lowercase kebab-case');
      } else if (gateIds.has(gate.id)) {
        fail(source, `duplicate hard gate id "${gate.id}"`);
      }

      gateIds.add(gate.id);

      if (!isNonEmptyString(gate.failure_condition)) {
        fail(source, `hard gate "${gate.id}" needs a failure_condition`);
      }
    }
  }

  if (!isUniqueStringArray(task.score_dimensions) || task.score_dimensions.length === 0) {
    fail(source, 'score_dimensions must be a non-empty array of unique dimension IDs');
  } else {
    for (const dimension of task.score_dimensions) {
      if (!allowedDimensions.has(dimension)) {
        fail(source, `unknown score dimension "${dimension}"`);
      }
    }
  }
}

if (!existsSync(taskDirectory)) {
  console.error('Evaluation fixture validation failed: .agents/evals/tasks is missing.');
  process.exit(1);
}

const files = readdirSync(taskDirectory, { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
  .map(entry => entry.name)
  .sort();

if (files.length === 0) {
  fail('.agents/evals/tasks', 'no JSON task fixtures found');
}

const knownSkills = getKnownSkillNames();
const taskIds = new Set();

for (const fileName of files) {
  const filePath = path.join(taskDirectory, fileName);
  let task;

  try {
    task = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`.agents/evals/tasks/${fileName}`, `invalid JSON: ${error.message}`);
    continue;
  }

  validateTask(task, fileName, knownSkills);

  if (task && typeof task.id === 'string') {
    if (taskIds.has(task.id)) {
      fail(`.agents/evals/tasks/${fileName}`, `duplicate task id "${task.id}"`);
    }

    taskIds.add(task.id);
  }
}

if (failures.length > 0) {
  console.error(`Evaluation fixture validation failed (${failures.length} issue${failures.length === 1 ? '' : 's'}):`);

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log(`Evaluation fixture validation passed: ${files.length} tasks, known skill routing, objective checks, evidence requirements, and hard gates validated.`);
