// Lint ratchet. A changed TypeScript file may not have more xo errors than its base copy, and a file that the change adds must have none.
// Usage: node scripts/lint-ratchet.mjs [--base <ref>]
// Without --base, the base is the merge-base of HEAD and origin/main. Each base copy is linted with the current xo config, so a config change cannot make a file look cleaner than it is.
// Exit codes: 0 when no file gained errors, 1 when at least one did, 2 when the check itself could not run.

import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const xoConfigNames = [
	'xo.config.ts',
	'xo.config.mts',
	'xo.config.cts',
	'xo.config.js',
	'xo.config.mjs',
	'xo.config.cjs',
];
const maxBuffer = 1024 * 1024 * 256;

function git(cwd, args) {
	return execFileSync('git', args, {
		cwd,
		encoding: 'utf8',
		maxBuffer,
		stdio: ['ignore', 'pipe', 'pipe'],
	});
}

function parseArguments(argv) {
	let base;
	for (let index = 0; index < argv.length; index++) {
		const argument = argv[index];
		if (argument === '--base') {
			base = argv[++index];
		} else if (argument?.startsWith('--base=')) {
			base = argument.slice('--base='.length);
		} else {
			throw new Error(`Unknown argument "${argument}". Usage: node scripts/lint-ratchet.mjs [--base <ref>]`);
		}
	}

	if (base === '') {
		throw new Error('--base needs a git ref.');
	}

	return {base};
}

function resolveBase(repoRoot, requestedBase) {
	if (requestedBase !== undefined) {
		return git(repoRoot, ['rev-parse', '--verify', `${requestedBase}^{commit}`]).trim();
	}

	try {
		return git(repoRoot, ['merge-base', 'HEAD', 'origin/main']).trim();
	} catch {
		throw new Error('No merge base with origin/main. Fetch origin/main, or pass --base <ref>.');
	}
}

// --no-renames keeps a renamed file in the list as an addition, so the new path must have zero errors.
function changedTypeScriptFiles(repoRoot, base) {
	return git(repoRoot, [
		'diff',
		'--name-only',
		'--diff-filter=ACMR',
		'--no-renames',
		`${base}...HEAD`,
		'--',
		'*.ts',
		'*.tsx',
	])
		.split('\n')
		.filter(Boolean);
}

// The base copy of a file, or undefined when the file is not in the base.
function readBaseFile(repoRoot, base, file) {
	try {
		return git(repoRoot, ['show', `${base}:${file}`]);
	} catch {
		return undefined;
	}
}

// The nearest directory at or above the file that holds an xo config. Files outside every such package are not checked.
function findXoPackageDir(repoRoot, file) {
	let directory = path.posix.dirname(file);
	for (;;) {
		if (xoConfigNames.some(name => existsSync(path.join(repoRoot, directory, name)))) {
			return directory;
		}

		if (directory === '.') {
			return undefined;
		}

		directory = path.posix.dirname(directory);
	}
}

// The package's own xo, so each file is checked with the rules that package's lint script uses.
async function countErrors(packageAbs, fileAbs, text) {
	const requireFromPackage = createRequire(path.join(packageAbs, 'package.json'));
	const {Xo} = await import(pathToFileURL(requireFromPackage.resolve('xo')).href);
	const result = await Xo.lintText(text, {cwd: packageAbs, filePath: fileAbs});
	return result.errorCount;
}

// A base copy is linted in a child process. Type-aware linting keeps the text it was given in a program that the process shares, so a base copy linted here would be what the head lint of any file importing it sees.
function countBaseErrors(packageAbs, fileAbs, baseText) {
	const output = execFileSync(
		process.execPath,
		[scriptPath, '--count-errors', packageAbs, fileAbs],
		{
			input: baseText,
			encoding: 'utf8',
			maxBuffer,
			stdio: ['pipe', 'pipe', 'pipe'],
		},
	);
	return Number(output.trim().split('\n').at(-1));
}

async function checkFile(repoRoot, base, file) {
	const packageDir = findXoPackageDir(repoRoot, file);
	if (packageDir === undefined) {
		return {file, skipped: true};
	}

	const packageAbs = path.join(repoRoot, packageDir);
	const fileAbs = path.join(repoRoot, file);
	const headErrors = await countErrors(packageAbs, fileAbs, readFileSync(fileAbs, 'utf8'));
	const baseText = readBaseFile(repoRoot, base, file);

	if (baseText === undefined) {
		return {file, baseErrors: undefined, headErrors, failed: headErrors > 0};
	}

	// A file with no errors at head cannot gain any, so its base copy is not linted. Linting every base copy is the slow part, and a changed file with no errors is the common case.
	if (headErrors === 0) {
		return {file, baseErrors: null, headErrors, failed: false};
	}

	const baseErrors = countBaseErrors(packageAbs, fileAbs, baseText);
	return {file, baseErrors, headErrors, failed: headErrors > baseErrors};
}

function printTable(base, rows) {
	const label = row => {
		if (row.skipped) {
			return 'skip';
		}

		return row.failed ? 'FAIL' : 'ok';
	};
	const cell = value => (value === undefined ? 'new' : String(value));
	// A null base count means the base copy was not linted, because the head file has no errors.
	const baseCells = rows.map(row =>
		row.skipped || row.baseErrors === null ? '-' : cell(row.baseErrors),
	);
	const headCells = rows.map(row => (row.skipped ? '-' : cell(row.headErrors)));
	const width = values => Math.max(4, ...values.map(value => value.length));
	const baseWidth = width(baseCells);
	const headWidth = width(headCells);

	console.log(`Lint ratchet against ${base.slice(0, 12)} (errors per file, base then head)`);
	console.log(`${'result'.padEnd(6)}  ${'base'.padStart(baseWidth)}  ${'head'.padStart(headWidth)}  file`);
	rows.forEach((row, index) => {
		console.log(`${label(row).padEnd(6)}  ${baseCells[index].padStart(baseWidth)}  ${headCells[index].padStart(headWidth)}  ${row.file}`);
	});

	const checked = rows.filter(row => !row.skipped).length;
	const failed = rows.filter(row => row.failed).length;
	console.log(`Checked ${checked} file(s), skipped ${rows.length - checked} outside an xo package, ${failed} gained errors.`);
}

async function run(argv) {
	const {base: requestedBase} = parseArguments(argv);
	const repoRoot = git(process.cwd(), ['rev-parse', '--show-toplevel']).trim();
	const base = resolveBase(repoRoot, requestedBase);
	const files = changedTypeScriptFiles(repoRoot, base);

	if (files.length === 0) {
		console.log(`No TypeScript files changed since ${base.slice(0, 12)}.`);
		return 0;
	}

	const rows = [];
	for (const file of files) {
		rows.push(await checkFile(repoRoot, base, file));
	}

	printTable(base, rows);
	return rows.some(row => row.failed) ? 1 : 0;
}

async function main(argv) {
	// Child mode for countBaseErrors: the file's text arrives on stdin and the error count goes to stdout.
	if (argv[0] === '--count-errors') {
		// typescript-estree's single-run inference (inferSingleRun) treats CI=true, which every
		// CI provider sets, as a one-shot CLI lint. In single-run mode lintText parses the file on
		// disk instead of the text it was given, so the base copy would be linted as the head copy
		// and every base count would be wrong on CI. The base copy only ever exists as text, so
		// the child must always run in watch mode, which honors the given text.
		process.env.TSESTREE_SINGLE_RUN = 'false';
		const [packageAbs, fileAbs] = argv.slice(1);
		const count = await countErrors(packageAbs, fileAbs, readFileSync(0, 'utf8'));
		console.log(String(count));
		return 0;
	}

	return run(argv);
}

try {
	process.exitCode = await main(process.argv.slice(2));
} catch (error) {
	console.error(`lint-ratchet: ${error instanceof Error ? error.message : String(error)}`);
	process.exitCode = 2;
}
