// Prints the frames of one fixture module, or of every module when no id is given, without writing the generated JSON or checking page references. Authors use it to see what a preview looks like before they wire it into a page.
// Usage: npm run print -- <preview-id-prefix>
process.env['FORCE_COLOR'] = '3';
// TERM=linux makes is-unicode-supported (used by figures) choose ASCII glyphs, so the same component would draw different symbols on a Linux console. Pinning TERM keeps the frames the same on every host.
process.env['TERM'] = 'xterm-256color';
delete process.env['NO_COLOR'];

const {renderToString} = await import('@nemesis-oss/termina-core');
const {previews} = await import('./previews/index.js');
const {convertAnsi} = await import('./ansi-to-html.js');

const prefix = process.argv[2] ?? '';
const selected = previews.filter(preview => preview.id.startsWith(prefix));
if (selected.length === 0) {
	console.error(`No preview id starts with "${prefix}".`);
	process.exit(1);
}

for (const preview of selected) {
	const {text} = convertAnsi(renderToString(preview.element, {columns: preview.columns ?? 80}));
	console.log(`=== ${preview.id} (${preview.title}, ${preview.columns ?? 80} columns)`);
	console.log(text);
	console.log('');
}
