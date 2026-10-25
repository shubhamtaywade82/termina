// Rehearses the release of every workspace package without uploading anything. It runs `pnpm publish --dry-run`, packs each package into a tarball, and checks what the tarball would install: the compiled entry and declarations must be present, no workspace: range may remain, and nothing outside build/ and the manifest may ship.
// Usage: node scripts/rehearse-release.mjs (run `pnpm build` first)

import {spawnSync} from 'node:child_process';
import {mkdtempSync, readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

// Captured output is printed only when the command fails, so a passing rehearsal stays short in CI logs.
const run = (command, args, options = {}) => {
	const result = spawnSync(command, args, {
		cwd: root,
		encoding: 'utf8',
		stdio: options.capture ? 'pipe' : 'inherit',
	});

	if (result.error || result.status !== 0) {
		const detail = result.error ? result.error.message : `exit ${result.status}`;
		const stderr = options.capture ? result.stderr?.trim() : '';
		failures.push(`${command} ${args.join(' ')} failed (${detail}).${stderr ? `\n${stderr}` : ''}`);
		return undefined;
	}

	return result.stdout;
};

// `--force` publishes even when npm already has this version, such as the current 0.2.0. The dry run never uploads, so forcing it only lets the rehearsal reach the packaging steps.
const publishDryRun = () => {
	run('pnpm', ['-r', '--filter', './packages/*', 'publish', '--dry-run', '--force', '--no-git-checks', '--access', 'public']);
};

const packInto = destination => {
	run('pnpm', ['-r', '--filter', './packages/*', 'pack', '--pack-destination', destination], {capture: true});
	return readdirSync(destination).filter(name => name.endsWith('.tgz'));
};

const extract = (tarball, member) => run('tar', ['-xzOf', tarball, member], {capture: true});

const allowed = entry =>
	entry === 'package/package.json' ||
	entry.startsWith('package/build/') ||
	/^package\/(README|LICENSE)/i.test(entry);

const checkTarball = (directory, tarball) => {
	const file = path.join(directory, tarball);
	const listing = run('tar', ['-tzf', file], {capture: true});

	if (listing === undefined) {
		return;
	}

	const entries = listing.split('\n').filter(Boolean);
	for (const required of ['package/package.json', 'package/build/index.js', 'package/build/index.d.ts']) {
		if (!entries.includes(required)) {
			failures.push(`${tarball} does not contain ${required}.`);
		}
	}

	for (const entry of entries.filter(entry => !allowed(entry))) {
		failures.push(`${tarball} ships ${entry}, which is outside build/ and the manifest.`);
	}

	const manifestText = extract(file, 'package/package.json');
	if (manifestText === undefined) {
		return;
	}

	const manifest = JSON.parse(manifestText);
	for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
		for (const [name, range] of Object.entries(manifest[field] ?? {})) {
			if (String(range).startsWith('workspace:')) {
				failures.push(`${tarball} keeps ${field}.${name} as "${range}", which the registry cannot resolve.`);
			}
		}
	}

	console.log(`${manifest.name}@${manifest.version}: ${entries.length} entries, dependency ranges resolved.`);
};

publishDryRun();

const directory = mkdtempSync(path.join(tmpdir(), 'termina-tarballs-'));
const tarballs = packInto(directory);

if (tarballs.length === 0) {
	failures.push('pnpm pack produced no tarballs.');
}

for (const tarball of tarballs) {
	checkTarball(directory, tarball);
}

if (failures.length > 0) {
	console.error(failures.map(failure => `- ${failure}`).join('\n'));
	console.error(`\n${failures.length} release problem(s).`);
	process.exit(1);
}

console.log(`Release rehearsal passed for ${tarballs.length} packages.`);
