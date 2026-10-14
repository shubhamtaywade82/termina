#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '../..');
const taskDirectory = path.join(repositoryRoot, '.agents', 'evals', 'tasks');
const args = process.argv.slice(2);

function usage() {
  console.error('Usage: pnpm evals:prompt -- <task-id> | pnpm evals:prompt -- --list | pnpm evals:prompt -- --check');
}

function listTasks() {
  if (!existsSync(taskDirectory)) {
    throw new Error('Evaluation task directory is missing.');
  }

  return readdirSync(taskDirectory, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
    .map(entry => {
      const filePath = path.join(taskDirectory, entry.name);
      const task = JSON.parse(readFileSync(filePath, 'utf8'));
      return { id: task.id, title: task.title, userPrompt: task.user_prompt, fileName: entry.name };
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}

let tasks;

try {
  tasks = listTasks();
} catch (error) {
  console.error(`Cannot read evaluation tasks: ${error.message}`);
  process.exit(1);
}

if (args.length === 1 && args[0] === '--list') {
  for (const task of tasks) {
    console.log(`${task.id}\t${task.title}`);
  }

  process.exit(0);
}

if (args.length === 1 && args[0] === '--check') {
  const failures = [];

  if (tasks.length === 0) {
    failures.push('No task fixtures found.');
  }

  for (const task of tasks) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(task.id ?? '')) {
      failures.push(`${task.fileName}: invalid task id`);
    }

    if (task.fileName !== `${task.id}.json`) {
      failures.push(`${task.fileName}: filename does not match task id`);
    }

    if (typeof task.userPrompt !== 'string' || task.userPrompt.trim().length === 0) {
      failures.push(`${task.fileName}: missing user-facing prompt`);
    }
  }

  if (failures.length > 0) {
    console.error(`Evaluation prompt check failed ( ${failures.length} issues):`);

    for (const failure of failures) {
      console.error(`- ${failure}`);
    }

    process.exit(1);
  }

  console.log(`Evaluation prompt check passed: ${tasks.length} user-facing prompts are available.`);
  process.exit(0);
}

if (args.length !== 1 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(args[0])) {
  usage();
  process.exit(2);
}

const task = tasks.find(candidate => candidate.id === args[0]);

if (!task) {
  console.error(`Unknown evaluation task "${args[0]}". Use --list to see available task IDs.`);
  process.exit(2);
}

// Intentionally emit only the user prompt. Never leak expected skills, acceptance
// checks, hard gates, or scoring metadata into the agent's task context.
process.stdout.write(`${task.userPrompt.trim()}\n`);
