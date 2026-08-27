function getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name)
}

function mergeDeep(target, source) {
    for (let key in source) {
        let val = source[key];
        if (typeof(val) == 'object' && !Array.isArray(val)) {
            target[key] = mergeDeep(target[key], val);
        } else {
            target[key] = val;
        }
    }
    return target;
}

function appendSuffix(name, suffix, fileExt) {
    let index = name.lastIndexOf('.');
    let fileName = (index > 0 ? name.slice(0, index) : name) + (suffix || '');
    if (!fileExt) {
        fileExt = index > 0 ? name.slice(index) : '';
    }
    return fileName + fileExt;
}

function getPosRotation(x, y, width, height, deg) {
    // let toDegree = function (radians) {
    //     return radians * (180 / Math.PI);
    // }
    let toRadians = function (degree) {
        return degree * (Math.PI / 180);
    };

    let centerX = width / 2;
    let centerY = height / 2;
    // Diagonal angle
    let diagRadians = Math.atan(width / height);
    // let diagAngle = toDegree(diagRadians);
    // Half Length diagonal
    let diagHalfLength = Math.sqrt(Math.pow(height, 2) + Math.pow(width, 2)) / 2;

    // Center coordinates of rotated rectangle.
    let rotatedCenterX = Math.sin(diagRadians + toRadians(deg)) * diagHalfLength;
    let rotatedCenterY = Math.cos(diagRadians + toRadians(deg)) * diagHalfLength;
    let offsetX = centerX - rotatedCenterX;
    let offsetY = centerY - rotatedCenterY;
    return {
        x: x + offsetX,
        y: y - offsetY
    }
}

// function getRotatePoint(x, y, centerX, centerY, angle) {
//     const radians = (Math.PI / 180) * angle;
//     const cos = Math.cos(radians);
//     const sin = Math.sin(radians);
//     const nx = (cos * (x - centerX)) + (sin * (y - centerY)) + centerX;
//     const ny = (cos * (y - centerY)) - (sin * (x - centerX)) + centerY;
//     return {
//         x: nx,
//         y: ny
//     };
// }

function splitText(text) {
    return text.split(/[\n\f\r\u000B]/);
}

function measureText(text, font, fontSize, lineHeight) {
    const splitText = (text) => {
        return text.split(/[\n\f\r\u000B]/);
    }
    if (!lineHeight) {
        lineHeight = fontSize;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = fontSize + 'px ' + font;

    let lines = splitText(text);
    let lineCount = lines.length;
    let width = 0;
    let height = 0;
    lines.forEach(text => {
        let metrics = ctx.measureText(text);
        if (width <= metrics.width) {
            width = metrics.width;
        }
    });
    height = fontSize * lineCount;
    return { width, height, lineCount };
}

function getBrowserLangCode($replace = ['_', '-']) {
    let langCode = (navigator.language || navigator.userLanguage).toLowerCase();
    langCode = langCode.replace(...$replace).toLowerCase();
    return langCode;
}

function strToUtf8(str) {
    let utf8 = '';
    for(let i = 0; i < str.length; i++) {
        let charCode = str.charCodeAt(i);
        if((charCode >= 0x0001) && (charCode <= 0x007F)) {
            utf8 += str.charAt(i);
        } else if(charCode > 0x07FF) {
            utf8 += String.fromCharCode(0xE0 | ((charCode >> 12) & 0x0F));
            utf8 += String.fromCharCode(0x80 | ((charCode >> 6) & 0x3F));
            utf8 += String.fromCharCode(0x80 | ((charCode >> 0) & 0x3F));
        } else {
            utf8 += String.fromCharCode(0xC0 | ((charCode >> 6) & 0x1F));
            utf8 += String.fromCharCode(0x80 | ((charCode >> 0) & 0x3F));
        }
    }
    return utf8;
}

// function strToUtf8(str) {
//     let utf8 = '';
//     for (let i = 0; i < str.length; i++) {
//       let charCode = str.charCodeAt(i);
      
//       if (charCode < 0x80) {
//         utf8 += str.charAt(i);
//       } else if (charCode < 0x800) {
//         utf8 += String.fromCharCode(0xc0 | (charCode >> 6));
//         utf8 += String.fromCharCode(0x80 | (charCode & 0x3f));
//       } else if (charCode < 0x10000) {
//         utf8 += String.fromCharCode(0xe0 | (charCode >> 12));
//         utf8 += String.fromCharCode(0x80 | ((charCode >> 6) & 0x3f));
//         utf8 += String.fromCharCode(0x80 | (charCode & 0x3f));
//       } else {
//         utf8 += String.fromCharCode(0xf0 | (charCode >> 18));
//         utf8 += String.fromCharCode(0x80 | ((charCode >> 12) & 0x3f));
//         utf8 += String.fromCharCode(0x80 | ((charCode >> 6) & 0x3f));
//         utf8 += String.fromCharCode(0x80 | (charCode & 0x3f));
//       }
//     }
//     return utf8;
// }

function dataURLToBlob(dataURL) {
    const base64Data = dataURL.split(',')[1];
    const byteString = atob(base64Data);
    const mimeType = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
    }
    return new Blob([uint8Array], { type: mimeType });
}

function dataURLToBytes(dataURL) {
    const separator = dataURL.indexOf(',');
    const binary = atob(dataURL.slice(separator + 1));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
}

function formatFileSize(bytes) {
    if (!bytes && bytes !== 0) {
        return '-';
    }
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size = size / 1024;
        unitIndex++;
    }
    return `${unitIndex === 0 ? size : size.toFixed(2)} ${units[unitIndex]}`;
}

export { getUrlParam, mergeDeep, appendSuffix, getPosRotation, splitText, measureText, getBrowserLangCode, strToUtf8, dataURLToBlob, dataURLToBytes, formatFileSize};