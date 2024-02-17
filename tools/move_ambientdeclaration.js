const fs = require('fs');

const indexFilePath = './dist/types/index.d.ts';
const ambientDeclarationPath = './src/ambient.declarations.d.ts';

const data = fs.readFileSync(indexFilePath, 'utf8').replace('"../../src/ambient.declarations.d.ts"', '"./ambient.declarations.d.ts"');
fs.writeFileSync(indexFilePath, data);

fs.writeFileSync('./dist/types/ambient.declarations.d.ts', fs.readFileSync(ambientDeclarationPath, 'utf8'));

console.log('Successfully included ambient declarations file in the types folder.');
