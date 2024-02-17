const fs = require('fs');

const parse = (filePath, replaceRegex, startWithLine) => {
    const data = fs.readFileSync(filePath, 'utf8');

    let content = data.split('\n').slice(startWithLine ?? 0).join('\n')

    if (replaceRegex != null) {
        content = content.replace(replaceRegex, '');
    }
    
    return content;
}

fs.writeFileSync(
'src/ambient.declarations.d.ts',
`// Automatically generated declaration file

declare module Cfx {
${parse('node_modules/@citizenfx/client/index.d.ts', /declare /g, 1)}
module Client {
${parse('node_modules/@citizenfx/client/index.d.ts', /declare /g, 1)}
${parse('node_modules/@citizenfx/client/natives_universal.d.ts', /declare /g)}
}

module Server {
${parse('node_modules/@citizenfx/client/index.d.ts', /declare /g, 1)}
${parse('node_modules/@citizenfx/server/natives_server.d.ts', /declare /g)}
}
}
`,
);

console.log('Declaration file generated successfully.');
