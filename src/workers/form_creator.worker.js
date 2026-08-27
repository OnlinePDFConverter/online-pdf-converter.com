import fontkit from '@pdf-lib/fontkit';
import notoSansUrl from '@assets/fonts/NotoSansSC-Regular.ttf';
import { dataURLToBytes } from '@src/libraries/misc';
import {
    PDFArray,
    PDFDict,
    PDFDocument,
    PDFName,
    PDFNumber,
    PDFString,
    TextAlignment,
    adjustDimsForRotation,
    componentsToColor,
    degrees,
    drawButton,
    drawRectangle,
    layoutSinglelineText,
    reduceRotation,
    rgb,
    rotateInPlace
} from 'pdf-lib';

self.addEventListener('message', async event => {
    const { type, files, settings = {} } = event.data;
    if (type !== 'process') return;
    try {
        const sourceFile = files && files[0] && files[0].file;
        if (!sourceFile) throw new Error('No PDF file.');
        const fields = Array.isArray(settings.fields) ? settings.fields : [];
        const importedFieldNames = Array.isArray(settings.importedFieldNames)
            ? settings.importedFieldNames
            : [];
        self.postMessage({ type: 'progress', progress: 0 });
        const pdfDoc = await PDFDocument.load(await sourceFile.arrayBuffer());
        pdfDoc.registerFontkit(fontkit);
        const fontBytes = await fetch(notoSansUrl).then(response => {
            if (!response.ok) throw new Error('Could not load the form font.');
            return response.arrayBuffer();
        });
        const formFont = await pdfDoc.embedFont(fontBytes, { subset: false });
        const form = pdfDoc.getForm();
        const pages = pdfDoc.getPages();

        for (const name of new Set(importedFieldNames)) {
            const existing = form.getFieldMaybe(name);
            if (existing) form.removeField(existing);
        }

        const groups = groupFields(fields);
        let processed = 0;
        for (const group of groups) {
            await createGroup(pdfDoc, form, pages, formFont, group);
            processed += 1;
            self.postMessage({
                type: 'progress',
                progress: Math.round(processed / Math.max(1, groups.length) * 90)
            });
        }

        form.updateFieldAppearances(formFont);
        const bytes = await pdfDoc.save();
        self.postMessage({ type: 'progress', progress: 100 });
        self.postMessage({
            type: 'complete',
            blob: [new Blob([bytes], { type: 'application/pdf' })],
            extra: [{ pages: pages.length, fields: fields.length }]
        });
    } catch (error) {
        self.postMessage({
            type: 'error',
            error: error.message ? error.message : String(error)
        });
    }
});

function groupFields(fields) {
    const map = new Map();
    fields.forEach(field => {
        const key = field.type === 'radio'
            ? `radio:${field.name}`
            : field.type === 'barcode'
                ? `barcode:${field.id}`
                : `${field.type}:${field.fieldKey || field.id}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(field);
    });
    return Array.from(map.values());
}

function getPage(pages, model) {
    return pages[Number(model.pageNumber) - 1] || null;
}

function color(hex, fallback = '#000000') {
    const values = colorComponents(hex, fallback);
    return rgb(values[0], values[1], values[2]);
}

function colorComponents(hex, fallback = '#000000') {
    const value = /^#[0-9a-f]{6}$/i.test(hex || '') ? hex : fallback;
    return [
        parseInt(value.slice(1, 3), 16) / 255,
        parseInt(value.slice(3, 5), 16) / 255,
        parseInt(value.slice(5, 7), 16) / 255
    ];
}

function widgetOptions(model, font, background = '#ffffff') {
    return {
        x: Number(model.rect.x),
        y: Number(model.rect.y),
        width: Math.max(1, Number(model.rect.width)),
        height: Math.max(1, Number(model.rect.height)),
        borderWidth: model.hideBorder ? 0 : 1,
        borderColor: color(model.borderColor),
        backgroundColor: model.transparentBackground ? undefined : color(background),
        textColor: color(model.textColor),
        font
    };
}

function applyCommon(field, model) {
    if (model.required && typeof field.enableRequired === 'function') field.enableRequired();
    if (model.readOnly && typeof field.enableReadOnly === 'function') field.enableReadOnly();
}

function applyTooltip(field, widgets, tooltip) {
    if (!tooltip) return;
    field.acroField.dict.set(PDFName.of('TU'), PDFString.of(tooltip));
    widgets.forEach(widget => {
        widget.dict.set(PDFName.of('TU'), PDFString.of(tooltip));
        widget.dict.set(PDFName.of('Contents'), PDFString.of(tooltip));
    });
}

function newWidgets(field, previousCount) {
    return field.acroField.getWidgets().slice(previousCount);
}

async function createGroup(pdfDoc, form, pages, font, models) {
    const model = models[0];
    if (!model || !model.name) return;
    if (model.type === 'barcode') {
        for (const item of models) await drawBarcode(pdfDoc, pages, item);
        return;
    }
    if (model.type === 'text') return createText(form, pages, font, models);
    if (model.type === 'checkbox') return createCheckbox(form, pages, font, models);
    if (model.type === 'radio') return createRadio(form, pages, font, models);
    if (model.type === 'dropdown') return createDropdown(form, pages, font, models);
    if (model.type === 'optionlist') return createOptionList(form, pages, font, models);
    if (model.type === 'button') return createButton(pdfDoc, form, pages, font, models);
    if (model.type === 'date') return createDate(pdfDoc, form, pages, font, models);
    if (model.type === 'signature') return createSignature(pdfDoc, form, pages, models);
}

function createText(form, pages, font, models) {
    const model = models[0];
    const field = form.createTextField(model.name);
    models.forEach(item => {
        const page = getPage(pages, item);
        if (!page) return;
        const before = field.acroField.getWidgets().length;
        field.addToPage(page, widgetOptions(item, font));
        applyTooltip(field, newWidgets(field, before), item.tooltip);
    });
    field.setText(model.defaultValue || '');
    field.setFontSize(clampNumber(model.fontSize, 8, 72, 12));
    field.setAlignment(model.alignment === 'center'
        ? TextAlignment.Center
        : model.alignment === 'right' ? TextAlignment.Right : TextAlignment.Left);
    if (Number(model.combCells) > 0) {
        field.setMaxLength(Number(model.combCells));
        field.enableCombing();
    } else if (Number(model.maxLength) > 0) {
        field.setMaxLength(Number(model.maxLength));
    }
    if (model.multiline) field.enableMultiline();
    else field.disableMultiline();
    applyCommon(field, model);
}

function createCheckbox(form, pages, font, models) {
    const model = models[0];
    const field = form.createCheckBox(model.name);
    models.forEach(item => {
        const page = getPage(pages, item);
        if (!page) return;
        const before = field.acroField.getWidgets().length;
        field.addToPage(page, widgetOptions(item, font));
        applyTooltip(field, newWidgets(field, before), item.tooltip);
    });
    if (model.checked) field.check();
    applyCommon(field, model);
}

function createRadio(form, pages, font, models) {
    const model = models[0];
    const group = form.createRadioGroup(model.name);
    models.forEach((item, index) => {
        const page = getPage(pages, item);
        if (!page) return;
        const before = group.acroField.getWidgets().length;
        const exportValue = item.exportValue || `Option${index + 1}`;
        group.addOptionToPage(exportValue, page, widgetOptions(item, font));
        applyTooltip(group, newWidgets(group, before), item.tooltip);
        if (item.checked) group.select(exportValue);
    });
    applyCommon(group, model);
}

function createDropdown(form, pages, font, models) {
    const model = models[0];
    const field = form.createDropdown(model.name);
    models.forEach(item => {
        const page = getPage(pages, item);
        if (!page) return;
        const before = field.acroField.getWidgets().length;
        field.addToPage(page, widgetOptions(item, font));
        applyTooltip(field, newWidgets(field, before), item.tooltip);
    });
    field.setOptions(model.options || []);
    if (model.defaultValue && (model.options || []).includes(model.defaultValue)) field.select(model.defaultValue);
    field.acroField.setFontSize(clampNumber(model.fontSize, 8, 72, 12));
    applyCommon(field, model);
}

function createOptionList(form, pages, font, models) {
    const model = models[0];
    const field = form.createOptionList(model.name);
    models.forEach(item => {
        const page = getPage(pages, item);
        if (!page) return;
        const before = field.acroField.getWidgets().length;
        field.addToPage(page, widgetOptions(item, font));
        applyTooltip(field, newWidgets(field, before), item.tooltip);
    });
    field.setOptions(model.options || []);
    if (model.defaultValue && (model.options || []).includes(model.defaultValue)) field.select(model.defaultValue);
    field.acroField.setFontSize(clampNumber(model.fontSize, 8, 72, 12));
    applyCommon(field, model);
}

function createButton(pdfDoc, form, pages, font, models) {
    const model = models[0];
    const field = form.createButton(model.name);
    models.forEach(item => {
        const page = getPage(pages, item);
        if (!page) return;
        const before = field.acroField.getWidgets().length;
        field.addToPage(item.label || 'Button', page, widgetOptions(item, font, '#e6e6e6'));
        const widgets = newWidgets(field, before);
        applyTooltip(field, widgets, item.tooltip);
        widgets.forEach(widget => applyButtonAction(pdfDoc, widget, item));
    });
    field.updateAppearances(font, (_button, widget, appearanceFont) => {
        return createCenteredButtonAppearance(widget, appearanceFont, model.textColor);
    });
    applyCommon(field, model);
}

function createCenteredButtonAppearance(widget, font, textColorHex) {
    const rectangle = widget.getRectangle();
    const characteristics = widget.getAppearanceCharacteristics();
    const borderStyle = widget.getBorderStyle();
    const captions = characteristics?.getCaptions();
    const normalText = captions?.normal || '';
    const downText = captions?.down || normalText;
    const borderWidth = borderStyle?.getWidth() || 0;
    const rotation = reduceRotation(characteristics?.getRotation());
    const dimensions = adjustDimsForRotation(rectangle, rotation);
    const rotate = rotateInPlace({ ...rectangle, rotation });
    const bounds = {
        x: borderWidth,
        y: borderWidth,
        width: dimensions.width - borderWidth * 2,
        height: dimensions.height - borderWidth * 2
    };
    const normalLayout = layoutSinglelineText(normalText, {
        alignment: TextAlignment.Center,
        font,
        bounds
    });
    const downLayout = layoutSinglelineText(downText, {
        alignment: TextAlignment.Center,
        fontSize: normalLayout.fontSize,
        font,
        bounds
    });
    // PDF text is positioned by its baseline. Moving it by roughly a quarter
    // of the font size visually centers capital and mixed-case button labels
    // instead of leaving them sitting against the lower half of the widget.
    const baselineOffset = normalLayout.fontSize * .24;
    const options = {
        x: borderWidth / 2,
        y: borderWidth / 2,
        width: dimensions.width - borderWidth,
        height: dimensions.height - borderWidth,
        borderWidth,
        borderColor: componentsToColor(characteristics?.getBorderColor()),
        textColor: color(textColorHex),
        font: font.name,
        fontSize: normalLayout.fontSize
    };
    return {
        normal: [
            ...rotate,
            ...drawButton({
                ...options,
                color: componentsToColor(characteristics?.getBackgroundColor()),
                textLines: [{ ...normalLayout.line, y: normalLayout.line.y + baselineOffset }]
            })
        ],
        down: [
            ...rotate,
            ...drawButton({
                ...options,
                color: componentsToColor(characteristics?.getBackgroundColor(), .8),
                textLines: [{ ...downLayout.line, y: downLayout.line.y + baselineOffset }]
            })
        ]
    };
}

function applyButtonAction(pdfDoc, widget, model) {
    let action = null;
    if (model.action === 'reset') {
        action = pdfDoc.context.obj({ Type: 'Action', S: 'ResetForm' });
    } else if (model.action === 'print') {
        action = pdfDoc.context.obj({ Type: 'Action', S: 'JavaScript', JS: PDFString.of('print();') });
    } else if (model.action === 'url' && /^https?:\/\//i.test(model.actionUrl || '')) {
        action = pdfDoc.context.obj({ Type: 'Action', S: 'URI', URI: PDFString.of(model.actionUrl) });
    } else if (model.action === 'js' && model.jsScript) {
        action = pdfDoc.context.obj({ Type: 'Action', S: 'JavaScript', JS: PDFString.of(model.jsScript) });
    } else if (model.action === 'showHide' && model.targetFieldName) {
        const target = String(model.targetFieldName)
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n');
        const script = model.visibilityAction === 'show'
            ? `var f=this.getField("${target}");if(f)f.display=display.visible;`
            : model.visibilityAction === 'hide'
                ? `var f=this.getField("${target}");if(f)f.display=display.hidden;`
                : `var f=this.getField("${target}");if(f)f.display=(f.display===display.visible)?display.hidden:display.visible;`;
        action = pdfDoc.context.obj({ Type: 'Action', S: 'JavaScript', JS: PDFString.of(script) });
    }
    if (action) widget.dict.set(PDFName.of('A'), action);
}

function createDate(pdfDoc, form, pages, font, models) {
    const model = models[0];
    const field = form.createTextField(model.name);
    models.forEach(item => {
        const page = getPage(pages, item);
        if (!page) return;
        const before = field.acroField.getWidgets().length;
        field.addToPage(page, widgetOptions(item, font));
        applyTooltip(field, newWidgets(field, before), item.tooltip);
    });
    const format = String(model.dateFormat || 'mm/dd/yyyy').replace(/[^a-zA-Z0-9/:.,\- ]/g, '');
    const formatAction = pdfDoc.context.obj({
        Type: 'Action', S: 'JavaScript', JS: PDFString.of(`AFDate_FormatEx("${format}");`)
    });
    const keystrokeAction = pdfDoc.context.obj({
        Type: 'Action', S: 'JavaScript', JS: PDFString.of(`AFDate_KeystrokeEx("${format}");`)
    });
    field.acroField.dict.set(PDFName.of('AA'), pdfDoc.context.obj({ F: formatAction, K: keystrokeAction }));
    applyCommon(field, model);
}

function createSignature(pdfDoc, form, pages, models) {
    const model = models[0];
    const flags = (model.readOnly ? 1 : 0) | (model.required ? 2 : 0);
    const sigDict = pdfDoc.context.obj({
        FT: PDFName.of('Sig'),
        T: PDFString.of(model.name),
        Kids: [],
        Ff: flags
    });
    if (model.tooltip) sigDict.set(PDFName.of('TU'), PDFString.of(model.tooltip));
    const sigRef = pdfDoc.context.register(sigDict);
    const kids = sigDict.get(PDFName.of('Kids'));
    form.acroForm.dict.set(PDFName.of('SigFlags'), PDFNumber.of(3));
    models.forEach(item => {
        const page = getPage(pages, item);
        if (!page) return;
        const x = Number(item.rect.x);
        const y = Number(item.rect.y);
        const width = Math.max(1, Number(item.rect.width));
        const height = Math.max(1, Number(item.rect.height));
        const mk = {};
        if (!item.hideBorder) mk.BC = colorComponents(item.borderColor);
        if (!item.transparentBackground) mk.BG = [1, 1, 1];
        const widget = pdfDoc.context.obj({
            Type: PDFName.of('Annot'),
            Subtype: PDFName.of('Widget'),
            Rect: [x, y, x + width, y + height],
            F: 4,
            P: page.ref,
            Parent: sigRef,
            BS: { W: item.hideBorder ? 0 : 1, S: PDFName.of('S') },
            MK: mk
        });
        if (item.tooltip) {
            widget.set(PDFName.of('TU'), PDFString.of(item.tooltip));
            widget.set(PDFName.of('Contents'), PDFString.of(item.tooltip));
        }
        const appearance = createSignatureAppearance(pdfDoc, item, width, height);
        widget.set(PDFName.of('AP'), pdfDoc.context.obj({ N: appearance }));
        const widgetRef = pdfDoc.context.register(widget);
        if (kids instanceof PDFArray) kids.push(widgetRef);
        page.node.addAnnot(widgetRef);
    });
    form.acroForm.addField(sigRef);
}

function createSignatureAppearance(pdfDoc, model, width, height) {
    const borderWidth = model.hideBorder ? 0 : 1;
    const operators = drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        borderWidth,
        color: model.transparentBackground ? undefined : rgb(1, 1, 1),
        borderColor: model.hideBorder ? undefined : color(model.borderColor),
        rotate: degrees(0),
        xSkew: degrees(0),
        ySkew: degrees(0)
    });
    const stream = pdfDoc.context.formXObject(operators, {
        BBox: pdfDoc.context.obj([0, 0, width, height]),
        Matrix: pdfDoc.context.obj([1, 0, 0, 1, 0, 0])
    });
    return pdfDoc.context.register(stream);
}

async function drawBarcode(pdfDoc, pages, model) {
    const page = getPage(pages, model);
    if (!page || !model.barcodePng) return;
    const image = await pdfDoc.embedPng(dataURLToBytes(model.barcodePng));
    const boxWidth = Math.max(1, Number(model.rect.width));
    const boxHeight = Math.max(1, Number(model.rect.height));
    const borderWidth = model.hideBorder ? 0 : 1;
    page.drawRectangle({
        x: Number(model.rect.x),
        y: Number(model.rect.y),
        width: boxWidth,
        height: boxHeight,
        borderWidth,
        borderColor: model.hideBorder ? undefined : color(model.borderColor),
        color: model.transparentBackground ? undefined : rgb(1, 1, 1)
    });
    const padding = model.hideBorder ? 0 : 3;
    const availableWidth = Math.max(1, boxWidth - padding * 2);
    const availableHeight = Math.max(1, boxHeight - padding * 2);
    const dimensions = image.scaleToFit(availableWidth, availableHeight);
    page.drawImage(image, {
        x: Number(model.rect.x) + padding + (availableWidth - dimensions.width) / 2,
        y: Number(model.rect.y) + padding + (availableHeight - dimensions.height) / 2,
        width: dimensions.width,
        height: dimensions.height
    });
}

function clampNumber(value, minimum, maximum, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback;
}
