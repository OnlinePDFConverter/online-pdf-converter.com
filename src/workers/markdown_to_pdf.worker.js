import { loadPyMuPDF } from '@src/libraries/external';
import { marked } from 'marked';

const MARKDOWN_STYLES = `
    body {
        font-family: sans-serif;
        font-size: 12pt;
        line-height: 1.6;
        color: #222;
    }
    h1 { font-size: 24pt; }
    h2 { font-size: 20pt; }
    h3 { font-size: 16pt; }
    h1, h2, h3, h4, h5, h6 {
        margin: 1em 0 0.5em;
        line-height: 1.25;
    }
    p, ul, ol, pre, blockquote, table {
        margin: 0 0 1em;
    }
    ul, ol {
        padding-left: 2em;
    }
    code {
        font-family: monospace;
        font-size: 0.9em;
        background-color: #f0f0f0;
        padding: 2px 4px;
    }
    pre {
        display: block;
        background-color: #f5f5f5;
        padding: 12px;
        white-space: pre-wrap;
    }
    pre code {
        padding: 0;
    }
    blockquote {
        border-left: 3px solid #ccc;
        color: #555;
        margin-left: 0;
        padding-left: 12px;
    }
    table {
        border-collapse: collapse;
        width: 100%;
    }
    th, td {
        border: 1px solid #ccc;
        padding: 6px 10px;
        text-align: left;
    }
    a {
        color: #0969da;
    }
    img {
        max-width: 100%;
        height: auto;
    }
`;

self.addEventListener('message', async e => {
    const { type, files } = e.data;
    if (type != 'process') return;

    try {
        const pymupdf = await loadPyMuPDF();
        const filesBlob = [];
        const fileExtra = [];
        for (const item of files) {
            const { fileId, file } = item;
            try {
                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 0
                });

                const markdown = await file.text();
                if (!markdown.trim()) {
                    throw new Error('The Markdown file is empty.');
                }
                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 20
                });

                const content = marked.parse(markdown);
                const html = `<!DOCTYPE html>
                    <html>
                        <head>
                            <meta charset="utf-8">
                            <style>${MARKDOWN_STYLES}</style>
                        </head>
                        <body>${content}</body>
                    </html>`;
                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 40
                });

                const blob = await pymupdf.htmlToPdf(html, {
                    pageSize: 'a4'
                });
                self.postMessage({
                    type: 'file-progress',
                    fileId,
                    progress: 90
                });

                filesBlob.push(blob);
                fileExtra.push({
                    originalSize: file.size,
                    convertedSize: blob.size
                });

                self.postMessage({
                    type: 'file-complete',
                    fileId
                });
            } catch (e) {
                self.postMessage({
                    type: 'file-error',
                    fileId,
                    error: e.message ? e.message : String(e)
                });
                return;
            }
        }

        self.postMessage({
            type: 'complete',
            blob: filesBlob,
            extra: fileExtra
        });
    } catch (e) {
        self.postMessage({ 
            type: 'error', 
            error: e.message ? e.message : String(e) 
        });
    }
});
