import Sortable from 'sortablejs';

function initFileSortable(fileUpload, container, sortableOptions = {}) {
    const { onEnd, ...options } = sortableOptions;

    return Sortable.create(container, {
        ...options,
        onEnd(event) {
            const oldIndex = event.oldDraggableIndex;
            const newIndex = event.newDraggableIndex;
            const files = fileUpload.handle.files;

            if (Number.isInteger(oldIndex) && Number.isInteger(newIndex)
                && oldIndex !== newIndex
                && oldIndex >= 0 && oldIndex < files.length
                && newIndex >= 0 && newIndex < files.length) {
                const [file] = files.splice(oldIndex, 1);
                files.splice(newIndex, 0, file);
            }

            if (typeof onEnd === 'function') {
                onEnd(event);
            }
        }
    });
}

export {
    initFileSortable
};
