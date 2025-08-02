const fs = require('fs');
const path = require('path');

const EXCLUDE = ['node_modules', '.git'];

function walk(dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => !EXCLUDE.includes(e.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  let result = '';
  entries.forEach((e, i) => {
    const isLast = i === entries.length - 1;
    const pointer = isLast ? '└── ' : '├── ';
    result += `${prefix}${pointer}${e.name}\n`;
    if (e.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      result += walk(path.join(dir, e.name), newPrefix);
    }
  });
  return result;
}

const tree = walk(process.cwd());
const mdContent = `# Estrutura do Projeto

\`\`\`text
${tree}
\`\`\`
`;
fs.writeFileSync('estrutura.md', mdContent);
console.log('✅ estrutura.md gerado');
