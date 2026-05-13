import fs from 'fs';
const content = fs.readFileSync('src/pages/Home.jsx', 'utf8');
const lines = content.split('\n');

let stack = [];
lines.forEach((line, i) => {
    // Match opening divs that are NOT self-closing
    // This is a naive regex, but better
    const openingMatches = line.match(/<div(?![^>]*\/>)/g) || [];
    const closingMatches = line.match(/<\/div>/g) || [];
    
    openingMatches.forEach(() => stack.push(i + 1));
    closingMatches.forEach(() => {
        if (stack.length === 0) console.log(`Unmatched closing div at line ${i + 1}`);
        else stack.pop();
    });
});

if (stack.length > 0) {
    console.log(`Unclosed divs opened at lines: ${stack.join(', ')}`);
} else {
    console.log('All divs matched');
}
