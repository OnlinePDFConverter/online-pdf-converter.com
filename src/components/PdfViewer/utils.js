export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export async function loadSource(source) {
    if (source instanceof File || source instanceof Blob) {
        const data = await source.arrayBuffer();
        return ({ data });
    }
    if (source instanceof ArrayBuffer || ArrayBuffer.isView(source)) {
        return Promise.resolve({ data: source });
    }
    if (typeof source === 'string') {
        return Promise.resolve({ url: source });
    }
    if (source && typeof source === 'object') {
        return Promise.resolve(source);
    }
    return Promise.reject(new Error('Unsupported PDF source.'));
}

export function button(icon, title, action, extraCss = '') {
    return `<button class="pv-btn ${extraCss}" type="button" data-action="${action}" title="${title}">${icon}</button>`;
}

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function createId(prefix = '') {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }
    return `${prefix}${Date.now()}-${Math.random().toString(16).slice(2)}`;
}