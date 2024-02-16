const fs = require('fs');

const HARDCODED_DECLARATIONS = [
    'function on(',
    'function emitNet('
];

const parse = (input, startFromLine) => {
    const declarationFilePath = input;
    const declarationFileContent = fs.readFileSync(declarationFilePath, 'utf-8');

    startFromLine = startFromLine ?? 0;

    // Split the file content by lines
    const lines = declarationFileContent.split('\n').slice(startFromLine);

    // Regular expression to match function declarations
    const functionDeclarationRegex = /^declare function\s+(\w+)\s*\(/;

    // Process each line
    const modifiedLines = [];
    lines.forEach((line, index) => {
        let match = null;
        if ((match = line.match(functionDeclarationRegex)) != null || (match = line.match(/^declare\s+var\s+(\w+)\s*:\s*\w+;/)) != null) {
            const functionNameInitial = match[1];
            let functionName; let declaration = null;
            if ((declaration = HARDCODED_DECLARATIONS.find((decl) => line.includes(decl))) != null) {
                const i = lines.slice(0, index + 1).filter((_line) => _line.includes(declaration)).length;
                functionName = `${functionNameInitial}${i <= 1 ? '' : i}`;
            } else {
                functionName =
                    lines.indexOf(line) == index
                        ? functionNameInitial
                        : `${functionNameInitial}${lines.slice(0, index + 1).filter((_line) => _line == line).length}`
                ;
            }
            const modifiedFunctionName = `_${functionName}`;
            // Modify the function name
            const modifiedLine = line.replace(new RegExp(`(?<!:)\\s${functionNameInitial}`, 'g'), ` ${modifiedFunctionName}`);
            modifiedLines.push(modifiedLine);
            // Generate export statement
            modifiedLines.push(`export const ${functionName} = ${modifiedFunctionName};`);
        } else {
            modifiedLines.push(line);
        }
    });

    // Iterate through lines and process
    for (let i = 1; i < modifiedLines.length; i++) {
        if (modifiedLines[i].trim().startsWith('export const')) {
            // Swap the current line with the previous line
            const temp = modifiedLines[i];
            modifiedLines[i] = modifiedLines[i - 1];
            modifiedLines[i - 1] = temp;
        }
    }

    return modifiedLines.join('\n');
}

fs.writeFileSync(
'src/ambient.declarations.ts',
`// Automatically generated declaration file

export namespace CitizenFXClient {
${[
    parse('node_modules/@citizenfx/client/index.d.ts', 1),
    parse('node_modules/@citizenfx/client/natives_universal.d.ts')
].join('\n')}
}

export namespace CitizenFXServer {
${[
    parse('node_modules/@citizenfx/server/index.d.ts', 1),
    parse('node_modules/@citizenfx/server/natives_server.d.ts')
].join('\n')}
}
`,
);

console.log('Declaration file generated successfully.');
