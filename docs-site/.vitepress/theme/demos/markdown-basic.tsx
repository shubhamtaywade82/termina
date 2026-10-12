import {Markdown} from '@nemesis-oss/termina-ui';

const readme = `# termina-ui

Components for **terminal** apps, built on \`termina-core\`.

## Install

- Add the package to your app
- Import components from \`@nemesis-oss/termina-ui\`

1. Render a \`Box\` layout
2. Add a \`Markdown\` view

> Markdown is display only. It takes no keyboard input.

\`\`\`tsx
render(<App />);
\`\`\`
`;

export default function MarkdownBasic() {
  return <Markdown>{readme}</Markdown>;
}
