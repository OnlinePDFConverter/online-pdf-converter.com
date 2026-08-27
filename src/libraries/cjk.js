import JSZip from 'jszip';

const CJK_PATTERN = /[\u3400-\u4DBF\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\uF900-\uFAFF]/;

function getExtension(fileName) {
    const match = fileName.toLowerCase().match(/\.([^.]+)$/);
    return match ? match[1] : '';
}

export function hasCJKCharacters(text) {
    return CJK_PATTERN.test(text || '');
}

async function detectCJKInZipDocument(file, extension) {
    try {
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const xmlFiles = Object.values(zip.files).filter(entry => {
            if (entry.dir) return false;
            const name = entry.name.toLowerCase();
            if (extension === 'odt') return name === 'content.xml' || name === 'styles.xml';
            return name.startsWith('word/') && name.endsWith('.xml');
        });

        if (xmlFiles.length === 0) return null;
        for (const entry of xmlFiles) {
            if (hasCJKCharacters(await entry.async('string'))) return true;
        }
        return false;
    } catch (error) {
        return null;
    }
}

function hasCJKRtfUnicodeEscape(text) {
    const pattern = /\\u(-?\d+)\??/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
        let codePoint = Number(match[1]);
        if (codePoint < 0) codePoint += 65536;
        if (hasCJKCharacters(String.fromCodePoint(codePoint))) return true;
    }
    return false;
}

async function detectCJKInTextDocument(file, extension) {
    try {
        const buffer = await file.arrayBuffer();
        const utf8Text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
        if (hasCJKCharacters(utf8Text)) return true;
        if (extension === 'rtf' && hasCJKRtfUnicodeEscape(utf8Text)) return true;

        if (extension === 'doc') {
            const utf16Text = new TextDecoder('utf-16le', { fatal: false }).decode(buffer);
            if (hasCJKCharacters(utf16Text)) return true;
        }
        return false;
    } catch (error) {
        return null;
    }
}

export async function detectCJKInFile(file) {
    const extension = getExtension(file && file.name);
    if (extension === 'docx' || extension === 'odt') {
        return detectCJKInZipDocument(file, extension);
    }
    return detectCJKInTextDocument(file, extension);
}

export async function batchNeedsCJKFont(files) {
    for (const file of files) {
        const result = await detectCJKInFile(file);
        if (result !== false) return true;
    }
    return false;
}

export async function loadCJKFont() {
    const response = await fetch(`${ASSETS_URL}fonts/NotoSansCJKsc-Regular.otf`, {
        cache: 'force-cache'
    });
    if (!response.ok) {
        throw new Error(`Failed to load CJK font (${response.status}).`);
    }
    return {
        filename: 'NotoSansCJKsc-Regular.otf',
        data: new Uint8Array(await response.arrayBuffer())
    };
}
