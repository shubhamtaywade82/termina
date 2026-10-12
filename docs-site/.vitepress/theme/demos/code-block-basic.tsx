import {CodeBlock} from '@nemesis-oss/termina-ui';

const code = `import express from 'express';

const app = express();

app.get('/health', (req, res) => {
  res.json({ok: true});
});

app.listen(3000);`;

export default function CodeBlockBasic() {
  return <CodeBlock code={code} language="typescript" highlightLines={[6]} />;
}
