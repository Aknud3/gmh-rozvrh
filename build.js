import fs from 'fs';
import path from 'path';
import JavaScriptObfuscator from 'javascript-obfuscator';
import { getFullHtml, FULL_CLIENT_JS } from './public/index.template.js';
import { SW_CODE } from './public/js/sw-code.js';

const __dirname = path.resolve();

const OBFUSCATION_CONFIG = {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    debugProtectionInterval: 0,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: false,
    renameGlobals: false,
    selfDefending: false,
    simplify: true,
    splitStrings: false,
    stringArray: true,
    stringArrayCallsTransform: false,
    stringArrayCallsTransformThreshold: 0.5,
    stringArrayEncoding: [],
    stringArrayIndexesType: [
        'hexadecimal-number'
    ],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 2,
    stringArrayWrappersType: 'variable',
    stringArrayThreshold: 0.75,
    unicodeEscapeSequence: false
};

/**
 * Basic HTML minifier that removes comments, collapses whitespace, 
 * and removes spaces between tags.
 */
function minifyHtml(html) {
    return html
        .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
        .replace(/\s+/g, ' ')             // Collapse whitespace
        .replace(/>\s+</g, '><')           // Remove spaces between tags
        .replace(/\s+\//g, '/')            // e.g., <link /> -> <link/>
        .trim();
}

async function build() {
    console.log('Building project with full minification and obfuscation for Cloudflare Pages...');

    // 1. Obfuscate Client JS
    console.log('- Obfuscating main JavaScript...');
    const obfuscatedClientJs = JavaScriptObfuscator.obfuscate(
        FULL_CLIENT_JS,
        OBFUSCATION_CONFIG
    ).getObfuscatedCode();

    // 2. Generate and Minify index.html
    const indexPath = path.join(__dirname, 'public', 'index.html');
    const rawHtml = getFullHtml(obfuscatedClientJs);
    const minifiedHtml = minifyHtml(rawHtml);
    fs.writeFileSync(indexPath, minifiedHtml);
    console.log(`- Generated minified/obfuscated ${indexPath}`);

    // 3. Obfuscate Service Worker
    console.log('- Obfuscating Service Worker...');
    const obfuscatedSwJs = JavaScriptObfuscator.obfuscate(
        SW_CODE,
        OBFUSCATION_CONFIG
    ).getObfuscatedCode();

    // 4. Generate sw.js
    const swPath = path.join(__dirname, 'public', 'sw.js');
    fs.writeFileSync(swPath, obfuscatedSwJs);
    console.log(`- Generated obfuscated ${swPath}`);

    console.log('Build complete!');
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
