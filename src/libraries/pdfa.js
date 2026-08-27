import { PDFArray, PDFDict, PDFName, PDFDocument } from 'pdf-lib';

const PDFA_LEVELS = {
    '1b': { name: 'PDF/A-1b', part: '1', compatibility: '1.4' },
    '2b': { name: 'PDF/A-2b', part: '2', compatibility: '1.7' },
    '3b': { name: 'PDF/A-3b', part: '3', compatibility: '1.7' }
};

let iccProfilePromise = null;

function toHex(bytes) {
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function createPdfADefinition(iccData, level) {
    const subtype = level.part === '1' ? '/GTS_PDFA1' : '/GTS_PDFA';
    return `%!
% PDF/A definition file for ${level.name}
[/_objdef {icc_PDFA} /type /stream /OBJ pdfmark
[{icc_PDFA} << /N 3 >> /PUT pdfmark
[{icc_PDFA} <${toHex(iccData)}> /PUT pdfmark
[/_objdef {OutputIntent_PDFA} /type /dict /OBJ pdfmark
[{OutputIntent_PDFA} <<
  /Type /OutputIntent
  /S ${subtype}
  /DestOutputProfile {icc_PDFA}
  /OutputConditionIdentifier (sRGB IEC61966-2.1)
  /Info (sRGB IEC61966-2.1)
  /RegistryName (http://www.color.org)
>> /PUT pdfmark
[{Catalog} << /OutputIntents [ {OutputIntent_PDFA} ] >> /PUT pdfmark
`;
}

async function loadIccProfile() {
    if (!iccProfilePromise) {
        iccProfilePromise = fetch(`${ASSETS_URL}ghostscript/sRGB.icc`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load sRGB ICC profile: HTTP ${response.status}.`);
                }
                return response.arrayBuffer();
            })
            .then(buffer => new Uint8Array(buffer))
            .then(bytes => {
                if (!bytes.length) {
                    throw new Error('The sRGB ICC profile is empty.');
                }
                return bytes;
            })
            .catch(error => {
                iccProfilePromise = null;
                throw error;
            });
    }
    return iccProfilePromise;
}

function unlinkQuietly(gs, path) {
    try {
        gs.FS.unlink(path);
    } catch (e) {}
}

async function addPageGroupDictionaries(pdfData) {
    const pdfDoc = await PDFDocument.load(pdfData, { updateMetadata: false });
    const outputIntents = pdfDoc.catalog.lookup(PDFName.of('OutputIntents'));
    let iccProfileRef;

    if (outputIntents instanceof PDFArray) {
        const firstIntent = outputIntents.lookup(0);
        if (firstIntent instanceof PDFDict) {
            iccProfileRef = firstIntent.get(PDFName.of('DestOutputProfile'));
        }
    }

    if (!iccProfileRef) {
        throw new Error('PDF/A output does not contain an ICC output intent.');
    }

    const updateGroupColorSpace = group => {
        const currentColorSpace = group.get(PDFName.of('CS'));
        if (currentColorSpace instanceof PDFName) {
            const name = currentColorSpace.decodeText();
            if (!['DeviceRGB', 'DeviceGray', 'DeviceCMYK'].includes(name)) {
                return;
            }
        } else if (currentColorSpace) {
            return;
        }

        group.set(PDFName.of('CS'), pdfDoc.context.obj([
            PDFName.of('ICCBased'),
            iccProfileRef
        ]));
    };

    for (const page of pdfDoc.getPages()) {
        const existingGroup = page.node.lookup(PDFName.of('Group'));
        if (existingGroup instanceof PDFDict) {
            updateGroupColorSpace(existingGroup);
            continue;
        }

        const group = pdfDoc.context.obj({
            Type: PDFName.of('Group'),
            S: PDFName.of('Transparency'),
            I: false,
            K: false,
            CS: [PDFName.of('ICCBased'), iccProfileRef]
        });
        page.node.set(PDFName.of('Group'), group);
    }

    pdfDoc.context.enumerateIndirectObjects().forEach(([, object]) => {
        const dict = object instanceof PDFDict
            ? object
            : object && object.dict instanceof PDFDict
                ? object.dict
                : null;
        if (!dict) return;

        const subtype = dict.get(PDFName.of('Subtype'));
        if (!(subtype instanceof PDFName) || subtype.decodeText() !== 'Form') return;

        const group = dict.lookup(PDFName.of('Group'));
        if (group instanceof PDFDict) {
            updateGroupColorSpace(group);
        }
    });

    return pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
        updateFieldAppearances: false
    });
}

async function convertToPdfA(gs, inputBytes, level = '2b') {
    const levelConfig = PDFA_LEVELS[level];
    const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const inputPath = `/tmp/pdfa_input_${stamp}.pdf`;
    const outputPath = `/tmp/pdfa_output_${stamp}.pdf`;
    const iccPath = `/tmp/pdfa_profile_${stamp}.icc`;
    const definitionPath = `/tmp/pdfa_definition_${stamp}.ps`;
    const tempPaths = [inputPath, outputPath, iccPath, definitionPath];
    const iccData = await loadIccProfile();

    try {
        gs.FS.writeFile(inputPath, inputBytes);
        gs.FS.writeFile(iccPath, iccData);
        gs.FS.writeFile(definitionPath, createPdfADefinition(iccData, levelConfig));

        const exitCode = gs.callMain([
            '-dNOSAFER',
            '-dBATCH',
            '-dNOPAUSE',
            '-dQUIET',
            '-sDEVICE=pdfwrite',
            `-dPDFA=${levelConfig.part}`,
            '-dPDFACompatibilityPolicy=1',
            `-dCompatibilityLevel=${levelConfig.compatibility}`,
            '-sColorConversionStrategy=RGB',
            '-sICCProfilesDir=/tmp/',
            `-sOutputICCProfile=${iccPath}`,
            `-sDefaultRGBProfile=${iccPath}`,
            `-sBlendColorProfile=${iccPath}`,
            '-dCompressPages=true',
            '-dWriteObjStms=false',
            '-dWriteXRefStm=false',
            '-dEmbedAllFonts=true',
            '-dSubsetFonts=true',
            '-dAutoRotatePages=/None',
            `-sOutputFile=${outputPath}`,
            definitionPath,
            inputPath
        ]);

        if (exitCode !== 0) {
            throw new Error(`Ghostscript conversion failed with exit code ${exitCode}.`);
        }

        const rawOutput = gs.FS.readFile(outputPath, { encoding: 'binary' });
        if (!rawOutput || !rawOutput.length) {
            throw new Error('Ghostscript did not produce a PDF/A file.');
        }

        const output = new Uint8Array(rawOutput.length);
        output.set(rawOutput);
        return levelConfig.part === '1' ? output : addPageGroupDictionaries(output);
    } finally {
        tempPaths.forEach(path => unlinkQuietly(gs, path));
    }
}

export {
    convertToPdfA
};
