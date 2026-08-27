import { button, escapeHtml } from '../utils';

export default class ToolbarManager {
    constructor(viewer, plugins) {
        if (!Array.isArray(plugins)) {
            throw new TypeError('PdfViewer toolbar must be an array.');
        }

        this.viewer = viewer;
        this.plugins = plugins;
        this.pluginMap = new Map();
        this.renderedPlugins = [];
        this.mounted = false;

        plugins.forEach(plugin => {
            if (!plugin || typeof plugin.id !== 'string' || !plugin.id.trim()) {
                throw new TypeError('Each PdfViewer toolbar plugin must have a non-empty id.');
            }
            if (typeof plugin.render !== 'function') {
                throw new TypeError(`PdfViewer toolbar plugin "${plugin.id}" must implement render().`);
            }
            if (this.pluginMap.has(plugin.id)) {
                throw new Error(`Duplicate PdfViewer toolbar plugin id: "${plugin.id}".`);
            }
            this.pluginMap.set(plugin.id, plugin);
        });
    }

    createContext(extra = {}) {
        return {
            viewer: this.viewer,
            options: this.viewer.options,
            pageOverlay: this.viewer.pageOverlay,
            button,
            escapeHtml,
            ...extra
        };
    }

    createPluginContext(plugin, extra = {}) {
        return this.createContext({
            ...extra,
            icon: plugin.icon
        });
    }

    render(internalItems = []) {
        const items = internalItems.map(item => ({
            group: item.group || 'internal',
            groupClass: item.groupClass || '',
            html: item.html || ''
        }));

        this.renderedPlugins = [];
        this.plugins.forEach(plugin => {
            const context = this.createPluginContext(plugin);
            const html = plugin.render(context);
            if (typeof html !== 'string') {
                throw new TypeError(`PdfViewer toolbar plugin "${plugin.id}" render() must return a string.`);
            }
            if (!html.trim()) return;
            this.renderedPlugins.push(plugin);
            items.push({
                group: plugin.group || plugin.id,
                groupClass: typeof plugin.groupClass === 'function'
                    ? plugin.groupClass(context)
                    : (plugin.groupClass || ''),
                html
            });
        });

        const groups = [];
        items.forEach(item => {
            if (!item.html) return;
            const previous = groups[groups.length - 1];
            if (previous && previous.group === item.group) {
                previous.html += item.html;
                previous.classes.add(item.groupClass);
                return;
            }
            groups.push({
                group: item.group,
                classes: new Set([item.groupClass]),
                html: item.html
            });
        });

        return groups.map(group => {
            const className = Array.from(group.classes).filter(Boolean).join(' ');
            return `<div class="pv-toolbar-group${className ? ` ${className}` : ''}">${group.html}</div>`;
        }).join('');
    }

    mount(toolbar) {
        this.renderedPlugins.forEach(plugin => {
            if (typeof plugin.mount === 'function') {
                plugin.mount(this.createPluginContext(plugin, { toolbar }));
            }
        });
        this.mounted = true;
    }

    update() {
        if (!this.mounted) return;
        this.renderedPlugins.forEach(plugin => {
            if (typeof plugin.update === 'function') {
                plugin.update(this.createPluginContext(plugin, {
                    toolbar: this.viewer.toolbarEl
                }));
            }
        });
    }

    notify(method, payload) {
        this.plugins.forEach(plugin => {
            if (typeof plugin[method] === 'function') {
                plugin[method](payload, this.createPluginContext(plugin, {
                    toolbar: this.viewer.toolbarEl
                }));
            }
        });
    }

    get(id) {
        return this.pluginMap.get(id) || null;
    }

    has(id) {
        return this.pluginMap.has(id);
    }

    destroy() {
        [...this.renderedPlugins].reverse().forEach(plugin => {
            if (typeof plugin.destroy === 'function') {
                plugin.destroy();
            }
        });
        this.renderedPlugins = [];
        this.mounted = false;
    }
}
