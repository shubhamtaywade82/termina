#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '../..');
const taskDirectory = path.join(repositoryRoot, '.agents', 'evals', 'tasks');
const knownSkillsDirectory = path.join(repositoryRoot, '.agents', 'skills');
const args = process.argv.slice(2);
const partialMode = args.includes('--partial');
const reportArgument = args.find(argument => argument !== '--partial');
const failures = [];
const warnings = [];

function fail(source, message) {
  failures.push(`${source}: ${message}`);
}

function warn(message) {
  warnings.push(message);
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasPlaceholder(value) {
  return typeof value === 'string' && /(?:REPLACE(?:_WITH)?_|TODO|TBD|CHANGEME)/i.test(value);
}

function uniqueStrings(value) {
  return Array.isArray(value)
    && value.every(nonEmpty)
    && new Set(value).size === value.length;
}

function readJson(filePath, source) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(source, `invalid JSON: ${error.message}`);
    return null;
  }
}

function readKnownSkills() {
  const names = new Set();

  if (!existsSync(knownSkillsDirectory)) {
    fail('report', 'repository skill directory is missing');
    return names;
  }

  for (const entry of readdirSync(knownSkillsDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const skillPath = path.join(knownSkillsDirectory, entry.name, 'SKILL.md');

    if (!existsSync(skillPath)) {
      continue;
    }

    const match = readFileSync(skillPath, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    const name = match?.[1].match(/^name:\s*(.+?)\s*$/m)?.[1]?.trim();

    if (name) {
      names.add(name);
    }
  }

  return names;
}

function validateMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    fail('run_metadata', 'must be an object');
    return;
  }

  if (!nonEmpty(metadata.started_at) || hasPlaceholder(metadata.started_at) || Number.isNaN(Date.parse(metadata.started_at))) {
    fail('run_metadata.started_at', 'must be a real, parseable timestamp');
  }

  if (!nonEmpty(metadata.repository) || hasPlaceholder(metadata.repository)) {
    fail('run_metadata.repository', 'must identify the evaluated repository');
  }

  for (const field of ['base_commit', 'skills_commit']) {
    if (!/^[a-f0-9]{40}$/i.test(metadata[field] ?? '')) {
      fail(`run_metadata.${field}`, 'must be a full 40-character Git commit SHA');
    }
  }

  for (const group of ['agent', 'model']) {
    const entry = metadata[group];

    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      fail(`run_metadata.${group}`, 'must be an object');
      continue;
    }

    const required = group === 'agent' ? ['name', 'version'] : ['provider', 'id', 'version'];

    for (const field of required) {
      if (!nonEmpty(entry[field]) || hasPlaceholder(entry[field])) {
        fail(`run_metadata.${group}.${field}`, 'must be populated and must not contain a placeholder');
      }
    }
  }

  if (!nonEmpty(metadata.tool_permissions_fingerprint) || hasPlaceholder(metadata.tool_permissions_fingerprint)) {
    fail('run_metadata.tool_permissions_fingerprint', 'must identify the tool permission/configuration set');
  }

  if (!Number.isInteger(metadata.repetitions_per_condition) || metadata.repetitions_per_condition < 1) {
    fail('run_metadata.repetitions_per_condition', 'must be a positive integer');
  } else if (metadata.repetitions_per_condition < 3) {
    warn('Fewer than three repetitions per condition are recorded. Treat this as a pilot, not evidence of a stable effect.');
  }
}

function loadTasks() {
  const tasks = new Map();

  if (!existsSync(taskDirectory)) {
    fail('tasks', 'task directory is missing');
    return tasks;
  }

  for (const entry of readdirSync(taskDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) {
      continue;
    }

    const source = `.agents/evals/tasks/${entry.name}`;
    const task = readJson(path.join(taskDirectory, entry.name), source);

    if (!task || typeof task.id !== 'string') {
      fail(source, 'task must have a string id');
      continue;
    }

    if (tasks.has(task.id)) {
      fail(source, `duplicate task id "${task.id}"`);
      continue;
    }

    tasks.set(task.id, task);
  }

  return tasks;
}

function validateEvidence(evidence, source, required) {
  if (!Array.isArray(evidence)) {
    fail(source, 'evidence must be an array');
    return;
  }

  if (required && evidence.length === 0) {
    fail(source, 'evidence is required for this result');
  }

  for (const [index, item] of evidence.entries()) {
    const evidenceSource = `${source}[${index}]`;

    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      fail(evidenceSource, 'must be an object');
      continue;
    }

    for (const field of ['kind', 'reference']) {
      if (!nonEmpty(item[field]) || hasPlaceholder(item[field])) {
        fail(`${evidenceSource}.${field}`, 'must be populated and must not be a placeholder');
      }
    }

    if (item.note !== undefined && hasPlaceholder(item.note)) {
      fail(`${evidenceSource}.note`, 'must not contain a placeholder');
    }
  }
}

function validateRun(run, index, tasks, knownSkills, metadata, seenRunKeys) {
  const source = `runs[${index}]`;

  if (!run || typeof run !== 'object' || Array.isArray(run)) {
    fail(source, 'must be an object');
    return;
  }

  const task = tasks.get(run.task_id);

  if (!task) {
    fail(`${source}.task_id`, `unknown task "${run.task_id}"`);
    return;
  }

  if (!['baseline', 'treatment'].includes(run.condition)) {
    fail(`${source}.condition`, 'must be "baseline" or "treatment"');
  }

  if (!Number.isInteger(run.repetition) || run.repetition < 1 || run.repetition > metadata.repetitions_per_condition) {
    fail(`${source}.repetition`, 'must be a positive integer within repetitions_per_condition');
  }

  const runKey = `${run.task_id}| ${run.condition}|${run.repetition}`;

  if (seenRunKeys.has(runKey)) {
    fail(source, `duplicate task/condition/repetition key "${runKey}"`);
  }

  seenRunKeys.add(runKey);

  if (!uniqueStrings(run.selected_skills)) {
    fail(`${source}.selected_skills`, 'must be an array of unique skill names (an empty array is valid)');
  } else {
    for (const skill of run.selected_skills) {
      if (!knownSkills.has(skill)) {
        fail(`${source}.selected_skills`, `unknown skill "${skill}"`);
      }

      if (run.condition === 'baseline' && knownSkills.has(skill)) {
        fail(`${source}.selected_skills`, `baseline run must not load repository-local skill "${skill}"`);
      }
    }
  }

  if (!run.scores || typeof run.scores !== 'object' || Array.isArray(run.scores)) {
    fail(`${source}.scores`, 'must be an object mapping applicable score dimensions to integers 0–2');
  } else {
    const expectedDimensions = new Set(task.score_dimensions ?? []);

    for (const dimension of expectedDimensions) {
      const score = run.scores[dimension];

      if (!Number.isInteger(score) || score < 0 || score > 2) {
        fail(`${source}.scores.${dimension}`, 'must be an integer from 0 to 2');
      }
    }

    for (const dimension of Object.keys(run.scores)) {
      if (!expectedDimensions.has(dimension)) {
        fail(`${source}.scores.${dimension}`, 'dimension does not apply to this task');
      }
    }
  }

  if (!Array.isArray(run.acceptance_results)) {
    fail(`${source}.acceptance_results`, 'must record a result for every fixture acceptance check');
  } else {
    const actualIds = new Set();

    for (const [resultIndex, result] of run.acceptance_results.entries()) {
      const resultSource = `${source}.acceptance_results[${resultIndex}]`;

      if (!result || typeof result !== 'object' || Array.isArray(result)) {
        fail(resultSource, 'must be an object');
        continue;
      }

      if (actualIds.has(result.check_id)) {
        fail(resultSource, `duplicate check id "${result.check_id}"`);
      }

      actualIds.add(result.check_id);

      if (!(task.acceptance_checks ?? []).some(check => check.id === result.check_id)) {
        fail(resultSource, `unknown acceptance check "${result.check_id}"`);
      }

      if (!['pass', 'fail', 'not_run', 'blocked'].includes(result.status)) {
        fail(`${resultSource}.status`, 'must be pass, fail, not_run, or blocked');
      }

      validateEvidence(result.evidence, `${resultSource}.evidence`, ['pass', 'fail'].includes(result.status));

      if (['not_run', 'blocked'].includes(result.status) && !nonEmpty(result.note)) {
        fail(resultSource, `status "${result.status}" requires a note explaining why`);
      }

      if (result.note !== undefined && hasPlaceholder(result.note)) {
        fail(`${resultSource}.note`, 'must not contain a placeholder');
      }
    }

    const expectedIds = new Set((task.acceptance_checks ?? []).map(check => check.id));

    for (const id of expectedIds) {
      if (!actualIds.has(id)) {
        fail(`${source}.acceptance_results`, `missing result for acceptance check "${id}"`);
      }
    }

    for (const id of actualIds) {
      if (!expectedIds.has(id)) {
        fail(`${source}.acceptance_results`, `unexpected check id "${id}"`);
      }
    }
  }

  if (!Array.isArray(run.hard_gate_failures)) {
    fail(`${source}.hard_gate_failures`, 'must be an array of gate IDs');
  } else {
    const knownGateIds = new Set((task.hard_gates ?? []).map(gate => gate.id));
    const seenGates = new Set();

    for (const gateId of run.hard_gate_failures) {
      if (!nonEmpty(gateId) || !knownGateIds.has(gateId)) {
        fail(`${source}.hard_gate_failures`, `unknown hard-gate ID "${gateId}"`);
      }

      if (seenGates.has(gateId)) {
        fail(`${source}.hard_gate_failures`, `duplicate hard-gate ID "${gateId}"`);
      }

      seenGates.add(gateId);
    }

    if (run.hard_gate_failures.length > 0) {
      validateEvidence(run.hard_gate_evidence, `${source}.hard_gate_evidence`, true);
    }
  }

  if (!nonEmpty(run.review_notes) || hasPlaceholder(run.review_notes)) {
    fail(`${source}.review_notes`, 'must contain actual notes, including limitations or why none were found');
  }
}

function validateCoverage(runs, tasks, repetitions, partialMode) {
  const byTaskAndCondition = new Map();

  for (const run of runs) {
    if (!run || !tasks.has(run.task_id) || !['baseline', 'treatment'].includes(run.condition) || !Number.isInteger(run.repetition)) {
      continue;
    }

    const key = `${run.task_id}|${run.condition}`;

    if (!byTaskAndCondition.has(key)) {
      byTaskAndCondition.set(key, new Set());
    }

    byTaskAndCondition.get(key).add(run.repetition);
  }

  const taskIdsToCheck = partialMode
    ? new Set(runs.filter(run => run && tasks.has(run.task_id)).map(run => run.task_id))
    : new Set(tasks.keys());

  for (const taskId of taskIdsToCheck) {
    const baseline = byTaskAndCondition.get(`${taskId}|baseline`) ?? new Set();
    const treatment = byTaskAndCondition.get(`${taskId}|treatment`) ?? new Set();

    if (baseline.size === 0 || treatment.size === 0) {
      fail('runs', `task "${taskId}" needs at least one baseline run and one treatment run`);
      continue;
    }

    const repetitionsMatch = baseline.size === treatment.size
      && [...baseline].every(repetition => treatment.has(repetition));

    if (!repetitionsMatch) {
      fail('runs', `task "${taskId}" must have matching repetition numbers in baseline and treatment`);
    }

    if (!partialMode) {
      for (let repetition = 1; repetition <= repetitions; repetition++) {
        if (!baseline.has(repetition)) {
          fail('runs', `task "${taskId}" is missing baseline repetition ${repetition}`);
        }

        if (!treatment.has(repetition)) {
          fail('runs', `task "${taskId}" is missing treatment repetition ${repetition}`);
        }
      }
    }
  }

  if (partialMode) {
    const completeTasks = [...taskIdsToCheck].filter(taskId => {
      const baseline = byTaskAndCondition.get(`${taskId}|baseline`) ?? new Set();
      const treatment = byTaskAndCondition.get(`${taskId}|treatment`) ?? new Set();
      return baseline.size > 0 && baseline.size === treatment.size && [...baseline].every(value => treatment.has(value));
    }).length;

    warn(`Partial report mode: ${completeTasks} task(s) have matched baseline/treatment repetitions; this is not a complete suite result.`);
  }
}

function main() {
  if (!reportArgument || args.filter(argument => argument !== '--partial').length !== 1) {
    console.error('Usage: pnpm evals:report:check -- <report.json> [--partial]');
    console.error('Default mode requires all task fixtures and repetitions. --partial permits a paired pilot subset.');
    process.exit(2);
  }

  const reportPath = path.resolve(process.cwd(), reportArgument);

  if (!existsSync(reportPath)) {
    console.error(`Report file does not exist: ${reportArgument}`);
    process.exit(2);
  }

  const report = readJson(reportPath, reportArgument);

  if (!report || typeof report !== 'object' || Array.isArray(report)) {
    console.error('Evaluation report validation failed.');
    process.exit(1);
  }

  if (report.schema_version !== 1) {
    fail('report.schema_version', 'must be 1');
  }

  if (report.suite_id !== 'termina-agent-skills-v1') {
    fail('report.suite_id', 'must be termina-agent-skills-v1');
  }

  validateMetadata(report.run_metadata);

  if (!partialMode && Number.isInteger(report.run_metadata?.repetitions_per_condition) && report.run_metadata.repetitions_per_condition < 3) {
    fail('run_metadata.repetitions_per_condition', 'complete reports require at least three repetitions per condition; use --partial for a pilot subset');
  }

  if (!Array.isArray(report.runs) || report.runs.length === 0) {
    fail('report.runs', 'must contain at least one recorded run');
  }

  const tasks = loadTasks();
  const knownSkills = readKnownSkills();
  const seenRunKeys = new Set();

  for (const [index, run] of (Array.isArray(report.runs) ? report.runs : []).entries()) {
    validateRun(run, index, tasks, knownSkills, report.run_metadata ?? {}, seenRunKeys);
  }

  validateCoverage(
    Array.isArray(report.runs) ? report.runs : [],
    tasks,
    report.run_metadata?.repetitions_per_condition,
    partialMode,
  );

  if (failures.length > 0) {
    console.error(`Evaluation report validation failed (${failures.length} issue${failures.length === 1 ? '' : 's'}):`);

    for (const failure of failures) {
      console.error(`- ${failure}`);
    }

    process.exit(1);
  }

  for (const warning of warnings) {
    console.warn(`WARNING: ${warning}`);
  }

  const failedGates = report.runs.filter(run => run.hard_gate_failures?.length > 0).length;
  console.log(`Evaluation report valid: ${report.runs.length} run(s), ${new Set(report.runs.map(run => run.task_id)).size} task(s), ${failedGates} run(s) with hard-gate failures.`);

  if (failedGates > 0) {
    console.log('Interpretation: any run with a hard-gate failure is a failed run regardless of numerical score.');
  }
}

main();
