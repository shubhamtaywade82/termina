// Release gate for the publish workflow. Fails unless the tag is a semver tag, every workspace package is public, and every package version equals the tag.
// Usage: node scripts/check-release.mjs v1.2.3

import {readdirSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const tag = process.argv[2] ?? '';
const semver = /^v(\d+\.\d+\.\d+(?:-[\w.-]+)?)$/;
const match = semver.exec(tag);
if (!match) {
	console.error(`"${tag}" is not a semver tag such as v1.2.3.`);
	process.exit(1);
}

const expected = match[1];
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagesDir = path.join(root, 'packages');
const failures = [];

for (const name of readdirSync(packagesDir, {withFileTypes: true}).filter(entry => entry.isDirectory()).map(entry => entry.name)) {
	const manifest = JSON.parse(readFileSync(path.join(packagesDir, name, 'package.json'), 'utf8'));
	if (manifest.private === true) {
		failures.push(`${manifest.name} is "private": true. Set it to false in the release commit before tagging.`);
	}

	if (manifest.version !== expected) {
		failures.push(`${manifest.name} is version ${manifest.version}, but the tag is ${tag}.`);
	}
}

if (failures.length > 0) {
	console.error(failures.map(failure => `- ${failure}`).join('\n'));
	process.exit(1);
}

console.log(`Every package is public and at version ${expected}.`);
