// Checks that the docs site agrees with the built packages. Every heading in docs-site/api/*.md that names exports must be exported from the package's built declarations, and every internal sidebar or nav link in the VitePress config must resolve to a page.
// Usage: node scripts/check-docs.mjs (run `pnpm build` first, because the declarations are read from packages/*/build)

import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsRoot = path.join(root, 'docs-site');
const apiDir = path.join(docsRoot, 'api');
const configPath = path.join(docsRoot, '.vitepress', 'config.ts');

// Sections whose names are documented as not exported. They are skipped on purpose.
const notExportedSections = new Set(['Not exported from the root']);
const identifier = /^[A-Za-z_$][\w$]*$/;

const require = createRequire(path.join(root, 'packages', 'core', 'package.json'));
const ts = require('typescript');

const failures = [];
const fail = message => {
	failures.push(message);
};

const loadExports = entry => {
	const program = ts.createProgram([entry], {
		noEmit: true,
		skipLibCheck: true,
	});
	const checker = program.getTypeChecker();
	const source = program.getSourceFile(entry);
	const moduleSymbol = source && checker.getSymbolAtLocation(source);

	if (!moduleSymbol) {
		return undefined;
	}

	const symbols = new Map(
		checker
			.getExportsOfModule(moduleSymbol)
			.map(symbol => [symbol.getName(), symbol]),
	);

	return {checker, symbols};
};

// A heading names exports when it is a list of identifiers, such as `render()`, `A, B` or `a and b()`. Other headings are prose, such as `Static members`.
const namesInHeading = heading => {
	const pieces = heading
		.split(/,\s*|\s+and\s+/)
		.map(piece => piece.trim().replace(/\(\)$/, ''));

	return pieces.every(piece => identifier.test(piece)) ? pieces : undefined;
};

// `useApp().suspendTerminal` documents a member of the value an export returns. It is checked against that return type, not against the top-level exports.
const memberOfHeading = heading => /^(\w+)\(\)\.(\w+)$/.exec(heading);

const hasReturnedMember = ({checker, symbols}, owner, member) => {
	const symbol = symbols.get(owner);
	const signature = symbol && checker.getTypeOfSymbol(symbol).getCallSignatures()[0];

	if (!signature) {
		return false;
	}

	const returned = checker.getReturnTypeOfSignature(signature);
	return checker.getPropertyOfType(returned, member) !== undefined;
};

const headingsOf = markdown => {
	const headings = [];
	let section;
	let inFence = false;

	markdown.split('\n').forEach((line, index) => {
		if (line.startsWith('```')) {
			inFence = !inFence;
			return;
		}

		if (inFence) {
			return;
		}

		const h2 = /^## (.+)$/.exec(line);
		if (h2) {
			section = h2[1].trim();
			return;
		}

		const h3 = /^### (.+)$/.exec(line);
		if (h3) {
			headings.push({heading: h3[1].trim(), line: index + 1, section});
		}
	});

	return headings;
};

// api/<name>.md documents packages/<name>, and its declarations are packages/<name>/build/index.d.ts.
const checkApiPage = file => {
	const markdown = readFileSync(file, 'utf8');
	const page = path.relative(root, file);
	const packageName = path.basename(file, '.md');
	const entry = path.join(root, 'packages', packageName, 'build', 'index.d.ts');

	if (!existsSync(entry)) {
		fail(`${path.relative(root, entry)} does not exist, so ${page} cannot be checked. Run "pnpm build" first.`);
		return {checked: 0, skipped: 0};
	}

	const loaded = loadExports(entry);
	if (!loaded) {
		fail(`${path.relative(root, entry)} has no module exports to check ${page} against.`);
		return {checked: 0, skipped: 0};
	}

	let checked = 0;
	let skipped = 0;

	for (const {heading, line, section} of headingsOf(markdown)) {
		if (notExportedSections.has(section)) {
			continue;
		}

		const member = memberOfHeading(heading);
		if (member) {
			checked++;
			if (!hasReturnedMember(loaded, member[1], member[2])) {
				fail(`${page}:${line} documents "${heading}", but ${member[1]}() does not return a "${member[2]}" member.`);
			}
			continue;
		}

		const names = namesInHeading(heading);
		if (!names) {
			skipped++;
			continue;
		}

		for (const name of names) {
			checked++;
			if (!loaded.symbols.has(name)) {
				fail(`${page}:${line} documents "${name}", which is not exported from ${path.relative(root, entry)}.`);
			}
		}
	}

	return {checked, skipped};
};

const apiPages = readdirSync(apiDir).filter(name => name.endsWith('.md')).map(name => path.join(apiDir, name));
let names = 0;
let prose = 0;
for (const file of apiPages) {
	const counts = checkApiPage(file);
	names += counts.checked;
	prose += counts.skipped;
}

// A sidebar or nav link is internal when it starts with a slash. It resolves to Markdown in docs-site, or to a directory index.
const config = readFileSync(configPath, 'utf8');
const links = [...config.matchAll(/\blink:\s*'([^']+)'/g)].map(match => match[1]);
let internal = 0;

for (const link of links) {
	if (!link.startsWith('/')) {
		continue;
	}

	internal++;
	const pathname = link.split('#')[0].split('?')[0].replace(/\/$/, '').replace(/^\//, '') || 'index';
	const candidates = [path.join(docsRoot, `${pathname}.md`), path.join(docsRoot, pathname, 'index.md')];

	if (!candidates.some(candidate => existsSync(candidate))) {
		fail(`docs-site/.vitepress/config.ts links to "${link}", which has no page.`);
	}
}

if (failures.length > 0) {
	console.error(failures.map(failure => `- ${failure}`).join('\n'));
	console.error(`\n${failures.length} docs problem(s).`);
	process.exit(1);
}

console.log(`Docs match the built packages: ${names} documented export names across ${apiPages.length} API pages (${prose} prose headings skipped), and ${internal} internal links resolve.`);
