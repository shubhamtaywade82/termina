#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '../..');
const taskDirectory = path.join(repositoryRoot, '.agents', 'evals', 'tasks');
const promptExporter = path.join(scriptDirectory, 'eval-prompt.mjs');
const reportValidator = path.join(scriptDirectory, 'validate-eval-report.mjs');
const errors = [];

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

function runNode(scriptPath, args = []) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    timeout: 10_000,
  });
}

const fixturePath = path.join(taskDirectory, 'responsive-status-dashboard.json');
const task = JSON.parse(readFileSync(fixturePath, 'utf8'));

const promptResult = runNode(promptExporter, [task.id]);

assert(promptResult.status === 0, 'prompt exporter should succeed for a known task');
assert(promptResult.stdout === `${task.user_prompt.trim()}\n`, 'prompt exporter must emit exactly the user-facing prompt');
assert(
  !task.expected_skills.some(skill => promptResult.stdout.includes(skill)),
  'exported prompt must not reveal expected skill names',
);
assert(
  !promptResult.stdout.includes('acceptance_checks') && !promptResult.stdout.includes('hard_gates'),
  'exported prompt must not leak evaluator-only fields',
);

const listResult = runNode(promptExporter, ['--list']);

assert(listResult.status === 0, 'prompt exporter --list should succeed');
assert(listResult.stdout.includes(task.id), 'task list should contain the selected task');
assert(!listResult.stdout.includes('expected_skills'), 'task list must not print evaluator metadata');

const metadata = {
  started_at: '2026-10-15T00:00:00.000Z',
  repository: 'shubhamtaywade82/termina',
  // Synthetic hashes in this temporary fixture do not identify an actual experiment.
  base_commit: '0'.repeat(40),
  skills_commit: '1'.repeat(40),
  agent: { name: 'eval-tooling-smoke-test', version: '1' },
  model: { provider: 'synthetic-test', id: 'no-model-invoked', version: '1' },
  tool_permissions_fingerprint: 'synthetic-test-without-agent-tools',
  repetitions_per_condition: 3,
};

function buildRun(condition) {
  return {
    task_id: task.id,
    condition,
    repetition: 1,
    selected_skills: condition === 'baseline' ? [] : task.expected_skills,
    acceptance_results: task.acceptance_checks.map(check => ({
      check_id: check.id,
      status: 'pass',
      evidence: [{
        kind: 'synthetic-test-fixture',
        reference: `synthetic://${check.id}`,
        note: 'Temporary validator test data; not agent-generated evidence.',
      }],
    })),
    scores: Object.fromEntries(task.score_dimensions.map(dimension => [dimension, 1])),
    hard_gate_failures: [],
    review_notes: 'Synthetic report used only to smoke-test report validation; not an evaluation result.',
  };
}

const report = {
  schema_version: 1,
  suite_id: 'termina-agent-skills-v1',
  run_metadata: metadata,
  runs: [buildRun('baseline'), buildRun('treatment')],
};

const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), 'termina-eval-smoke-'));

try {
  const validReportPath = path.join(temporaryDirectory, 'pilot-report.json');
  const invalidReportPath = path.join(temporaryDirectory, 'missing-evidence-report.json');

  writeFileSync(validReportPath, JSON.stringify(report, null, 2));
  const validResult = runNode(reportValidator, [validReportPath, '--partial']);

  assert(
    validResult.status === 0,
    `report validator should accept a well-formed paired pilot; exit=${validResult.status}; stderr=${validResult.stderr}`,
  );

  const invalidReport = structuredClone(report);
  invalidReport.runs[0].acceptance_results[0].evidence = [];
  writeFileSync(invalidReportPath, JSON.stringify(invalidReport, null, 2));

  const invalidResult = runNode(reportValidator, [invalidReportPath, '--partial']);

  assert(
    invalidResult.status !== 0,
    'report validator must reject a passing acceptance result without evidence',
  );
  assert(
    invalidResult.stderr.includes('evidence is required'),
    'missing evidence failure should explain the validation problem',
  );
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

if (errors.length > 0) {
  console.error(`Evaluation tooling smoke tests failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  process.exit(1);
}

console.log('Evaluation tooling smoke tests passed: prompt isolation and report evidence enforcement. Synthetic test data was temporary and is not a model-evaluation result.');
