# Online PDF Converter

Online PDF Converter is a browser-first collection of tools for converting, editing, organizing, compressing, OCR-processing, and signing PDF files. It also supports conversion between PDF and a wide range of document, image, and ebook formats.

## Features

- Edit and organize PDFs: merge, split, rotate, crop, delete or extract pages, add page numbers, and apply watermarks
- Secure PDFs: protect, unlock, sign, and repair files
- Convert PDFs to and from Word, Excel, PowerPoint, and image formats
- Convert documents to PDF, including Word, Excel, PowerPoint, Markdown, RTF, and ODT
- Convert images to PDF, including JPG, PNG, WebP, TIFF, HEIC, and PSD
- Handle ebook and other formats, including EPUB, MOBI, FB2, CBZ, DJVU, and XPS
- Process files in the browser with Web Workers, WebAssembly, PDF.js, PyMuPDF, and LibreOffice WASM
- Generate localized pages and routes through the internationalized build system

## Technology Stack

- JavaScript
- Webpack 5 and Webpack Dev Server
- Gulp
- PDF.js, pdf-lib, and jsPDF
- Pyodide and PyMuPDF
- LibreOffice WebAssembly
- Tesseract.js

## Local Development

### Requirements

- Node.js (the current LTS release is recommended)
- npm

### Install Dependencies

```bash
npm install
```

For the first run, create a local configuration file from the template:

```bash
cp webpack.constants.dist.js webpack.constants.js
```

On Windows PowerShell, use:

```powershell
Copy-Item webpack.constants.dist.js webpack.constants.js
```

### Start the Development Server

```bash
npm run dev
```

The default development configuration uses `localhost`. Server ports and proxy settings can be adjusted in `webpack.constants.js` and `webpack.dev.js`.

## Build

Create a production build:

```bash
npm run build
```

Build without copying static assets:

```bash
npm run build:no-assets
```

Create a ZIP release package:

```bash
npm run build:zip
```

Create a ZIP release package without static assets:

```bash
npm run build:zip:no-assets
```

Build output is written to `build/`, with ZIP packages stored in `build/zip/`. These directories are excluded from Git by default.

## Project Structure

```text
.
├── i18n/                  # Internationalization messages
├── routers/               # Page and development-server routes
├── src/
│   ├── assets/            # Fonts, WASM modules, PDF.js, and other static assets
│   ├── common/            # Shared modules and base UI code
│   ├── components/        # Page components
│   ├── css/               # Stylesheets
│   ├── entry/             # Webpack page entry points
│   ├── libraries/         # PDF, document, and third-party integration wrappers
│   ├── pages/             # HTML pages and layouts
│   └── workers/           # Web Workers for individual PDF tools
├── tools/                 # Utility scripts
├── gulpfile.mjs           # ZIP packaging workflow
└── webpack.*.js           # Webpack configuration
```

## Configuration

`webpack.constants.dist.js` is the configuration template. The local `webpack.constants.js` file contains domain, API path, third-party service, and development-server settings and is excluded through `.gitignore`. Configure it for the target environment before deployment, and never commit real secrets or access tokens.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE) (`AGPL-3.0-only`).
