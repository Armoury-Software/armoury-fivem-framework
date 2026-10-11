const fs = require('fs');
const path = require('path');

const packageName = process.argv[2];
if (!['client', 'server'].includes(packageName)) {
	throw new Error('Specify the client or server package.');
}

const repositoryRoot = path.resolve(__dirname, '..');
const packageTypesPath = path.join(repositoryRoot, 'packages', packageName, 'dist', 'types');
const declarationPath = path.join(packageTypesPath, packageName, 'index.d.ts');
const ambientDeclarationPath = path.join(repositoryRoot, 'src', 'ambient.declarations.d.ts');
const reference = '/// <reference path="../ambient.declarations.d.ts" />\n';
const declaration = fs.readFileSync(declarationPath, 'utf8');

fs.writeFileSync(declarationPath, reference + declaration);
fs.copyFileSync(ambientDeclarationPath, path.join(packageTypesPath, 'ambient.declarations.d.ts'));

console.log(`Included ambient declarations in the ${packageName} package.`);
