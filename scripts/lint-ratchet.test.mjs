// Tests for scripts/lint-ratchet.mjs. Each case builds a throwaway git repository with one xo package and runs the ratchet inside it.
// Run with: node --test scripts/lint-ratchet.test.mjs

import {execFileSync} from 'node:child_process';
import {
	mkdirSync,
	mkdtempSync,
	rmSync,
	symlinkSync,
	unlinkSync,
	writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(here, 'lint-ratchet.mjs');
// The temporary package borrows the UI package's installed xo, so the test needs no install of its own.
const xoNodeModules = path.join(here, '..', 'packages', 'ui', 'node_modules');
const createdRoots = [];

// The xo config forbids `var`. Each `var` declaration inside a function is one error.
const clean = 'export function legacy() {\n\tconst old = 1;\n\treturn old;\n}\n';
const oneError = 'export function legacy() {\n\tvar old = 1;\n\treturn old;\n}\n';
const twoErrors = 'export function legacy() {\n\tvar old = 1;\n\tvar other = 2;\n\treturn old + other;\n}\n';
const oneErrorRenamed = 'export function legacy() {\n\tvar renamed = 2;\n\treturn renamed;\n}\n';

test.after(() => {
	for (const root of createdRoots) {
		try {
			unlinkSync(path.join(root, 'packages', 'app', 'node_modules'));
		} catch {}

		rmSync(root, {recursive: true, force: true});
	}
});

function git(cwd, args) {
	return execFileSync('git', args, {
		cwd,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
	});
}

function commit(root, files, message) {
	for (const [file, content] of Object.entries(files)) {
		mkdirSync(path.dirname(path.join(root, file)), {recursive: true});
		writeFileSync(path.join(root, file), content);
	}

	git(root, ['add', ...Object.keys(files)]);
	git(root, ['commit', '-q', '-m', message]);
}

// `base` is committed on main and `change` on a feature branch. The ratchet then runs against main.
function createRepo({base, change}) {
	const root = mkdtempSync(path.join(tmpdir(), 'lint-ratchet-test-'));
	createdRoots.push(root);
	const pkg = path.join(root, 'packages', 'app');
	mkdirSync(pkg, {recursive: true});
	symlinkSync(xoNodeModules, path.join(pkg, 'node_modules'), 'dir');
	git(root, ['init', '-q', '-b', 'main']);
	git(root, ['config', 'user.email', 'ratchet@example.invalid']);
	git(root, ['config', 'user.name', 'Ratchet Test']);
	commit(root, {
		'packages/app/package.json': '{"name": "app", "private": true, "type": "module"}\n',
		'packages/app/xo.config.mjs': 'export default [{rules: {"no-var": "error"}}];\n',
		...base,
	}, 'base');
	git(root, ['checkout', '-q', '-b', 'feature']);
	commit(root, change, 'change');
	return root;
}

function runRatchet(root) {
	try {
		const stdout = execFileSync(process.execPath, [scriptPath, '--base', 'main'], {
			cwd: root,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		return {status: 0, stdout};
	} catch (error) {
		return {status: error.status, stdout: error.stdout};
	}
}

test('a file the change adds fails when it has errors', () => {
	const root = createRepo({
		base: {'packages/app/src/index.ts': clean},
		change: {'packages/app/src/added.ts': oneError},
	});

	const result = runRatchet(root);

	assert.equal(result.status, 1, result.stdout);
	assert.match(result.stdout, /FAIL\s+new\s+1\s+packages\/app\/src\/added\.ts/);
});

test('a file the change adds passes when it is clean', () => {
	const root = createRepo({
		base: {'packages/app/src/index.ts': clean},
		change: {'packages/app/src/added.ts': clean},
	});

	const result = runRatchet(root);

	assert.equal(result.status, 0, result.stdout);
	assert.match(result.stdout, /ok\s+new\s+0\s+packages\/app\/src\/added\.ts/);
});

test('an existing file fails when it gains errors', () => {
	const root = createRepo({
		base: {'packages/app/src/index.ts': clean},
		change: {'packages/app/src/index.ts': twoErrors},
	});

	const result = runRatchet(root);

	assert.equal(result.status, 1, result.stdout);
	assert.match(result.stdout, /FAIL\s+0\s+2\s+packages\/app\/src\/index\.ts/);
});

test('an existing file passes when it loses errors', () => {
	const root = createRepo({
		base: {'packages/app/src/index.ts': twoErrors},
		change: {'packages/app/src/index.ts': oneError},
	});

	const result = runRatchet(root);

	assert.equal(result.status, 0, result.stdout);
	assert.match(result.stdout, /ok\s+2\s+1\s+packages\/app\/src\/index\.ts/);
});

test('an existing file with no errors at head passes without linting its base copy', () => {
	const root = createRepo({
		base: {'packages/app/src/index.ts': oneError},
		change: {'packages/app/src/index.ts': clean},
	});

	const result = runRatchet(root);

	assert.equal(result.status, 0, result.stdout);
	assert.match(result.stdout, /ok\s+-\s+0\s+packages\/app\/src\/index\.ts/);
});

test('an existing file passes when its error count is unchanged', () => {
	const root = createRepo({
		base: {'packages/app/src/index.ts': oneError},
		change: {'packages/app/src/index.ts': oneErrorRenamed},
	});

	const result = runRatchet(root);

	assert.equal(result.status, 0, result.stdout);
	assert.match(result.stdout, /ok\s+1\s+1\s+packages\/app\/src\/index\.ts/);
});

test('a changed file outside every xo package is skipped', () => {
	const root = createRepo({
		base: {'docs/example.ts': clean},
		change: {'docs/example.ts': oneError},
	});

	const result = runRatchet(root);

	assert.equal(result.status, 0, result.stdout);
	assert.match(result.stdout, /skip\s+-\s+-\s+docs\/example\.ts/);
});
