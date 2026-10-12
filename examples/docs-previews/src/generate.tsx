import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

// Colour is pinned before chalk and the core package load, so the output does not depend on the terminal that runs this script. Dynamic imports below make sure these assignments happen first.
process.env['FORCE_COLOR'] = '3';
// TERM=linux makes is-unicode-supported (used by figures) choose ASCII glyphs, so the same component would draw different symbols on a Linux console. Pinning TERM keeps the frames the same on every host.
process.env['TERM'] = 'xterm-256color';
delete process.env['NO_COLOR'];

const {renderToString} = await import('@nemesis-oss/termina-core');
const {previews} = await import('./previews/index.js');
const {convertAnsi} = await import('./ansi-to-html.js');

const docsRoot = fileURLToPath(new URL('../../../docs-site/', import.meta.url));
const outputPath = path.join(docsRoot, '.vitepress/generated/previews.json');
const checkOnly = process.argv.includes('--check');

type Entry = {
	title: string;
	caption?: string;
	columns: number;
	html: string;
	text: string;
};

const entries = new Map<string, Entry>();
for (const preview of previews) {
	if (entries.has(preview.id)) {
		throw new Error(`Duplicate preview id: ${preview.id}`);
	}

	const columns = preview.columns ?? 80;
	let output: string;
	try {
		output = renderToString(preview.element, {columns});
	} catch (error) {
		throw new Error(`Preview ${preview.id} failed to render: ${(error as Error).message}`, {cause: error});
	}

	const {html, text} = convertAnsi(output);
	entries.set(preview.id, {
		title: preview.title,
		...(preview.caption === undefined ? {} : {caption: preview.caption}),
		columns,
		html,
		text,
	});
}

// Every id a page uses must exist, and every preview must be used. A preview nobody shows is dead documentation, and a page pointing at a missing id would render an empty box.
const pages = listMarkdown(docsRoot);
const referenced = new Map<string, string[]>();
for (const page of pages) {
	const source = readFileSync(page, 'utf8');
	for (const match of source.matchAll(/<TerminalPreview\s+id="([^"]+)"/g)) {
		const id = match[1]!;
		referenced.set(id, [...(referenced.get(id) ?? []), path.relative(docsRoot, page)]);
	}
}

const problems: string[] = [];
for (const [id, where] of referenced) {
	if (!entries.has(id)) {
		problems.push(`unknown preview "${id}" referenced in ${where.join(', ')}`);
	}
}

for (const id of entries.keys()) {
	if (!referenced.has(id)) {
		problems.push(`preview "${id}" is defined but no page shows it`);
	}
}

if (problems.length > 0) {
	console.error(problems.map(problem => `- ${problem}`).join('\n'));
	process.exit(1);
}

const sorted = Object.fromEntries([...entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
const json = JSON.stringify(sorted, null, 2) + '\n';

if (checkOnly) {
	const current = existsSync(outputPath) ? readFileSync(outputPath, 'utf8') : '';
	if (current !== json) {
		console.error(`${path.relative(process.cwd(), outputPath)} is stale. Run: npm run generate`);
		process.exit(1);
	}

	console.log(`${entries.size} previews are current.`);
} else {
	mkdirSync(path.dirname(outputPath), {recursive: true});
	writeFileSync(outputPath, json);
	console.log(`Wrote ${entries.size} previews to ${path.relative(process.cwd(), outputPath)}.`);
}

function listMarkdown(root: string): string[] {
	const found: string[] = [];
	const visit = (directory: string) => {
		for (const name of readdirSync(directory, {withFileTypes: true})) {
			if (name.name === 'node_modules' || name.name.startsWith('.')) {
				continue;
			}

			const full = path.join(directory, name.name);
			if (name.isDirectory()) {
				visit(full);
			} else if (name.name.endsWith('.md')) {
				found.push(full);
			}
		}
	};

	visit(root);
	return found;
}
