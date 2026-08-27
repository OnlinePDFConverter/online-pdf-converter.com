/**
 * 通用 Worker 管理模块
 * 封装 Worker 创建、消息监听、数据收集、启动处理等通用逻辑
 */

/**
 * 初始化一个 Web Worker
 * @param {Object} options 配置项
 * @param {string} options.worker - Worker 对象
 * @param {Object} options.fileUpload - fileUpload 实例
 * @param {string|Function} options.outputFileName - 输出文件名或根据完成消息生成文件名的函数
 * @param {Function} [options.onStartProcess] - 发送消息前的钩子，可自定义发送内容
 * @param {Function} [options.onMessage] - 自定义消息处理钩子，返回 true 表示已处理，不再走默认逻辑
 * @returns {Object} worker 管理对象
 */
function initWorker({ worker, fileUpload, outputFileName, onStartProcess, onMessage }) {
    // 监听 Worker 消息
    worker.addEventListener('message', e => {
        const data = e.data;
        const { type, fileId, progress, progressText, error, extra, blob } = data;

        // 自定义消息处理钩子，返回 true 表示已处理
        if (onMessage) {
            onMessage(data);
            return;
        }

        switch (type) {
            case 'progress': {
                fileUpload.setProgress(progress, progressText ?? $L.get('upload.processing'));
                break;
            }
            case 'file-progress': {
                // const percent = Math.max(0, Math.min(100, Math.round(progress * 100)));
                fileUpload.fileProgress(fileId, progress, progressText ?? $L.get('upload.processing'));
                break;
            }
            case 'file-complete':
                fileUpload.fileComplete(fileId);
                break;
            case 'file-error':
                fileUpload.fileError(fileId, error);
                break;
            case 'complete':
                setTimeout(() => {
                    fileUpload.complete(
                        typeof outputFileName === 'function' ? outputFileName(data) : outputFileName,
                        blob,
                        extra,
                        PAGE_NAME
                    );
                }, 600)
                break;
            case 'error':
                fileUpload.error(error);
                break;
        }
    });

    /**
     * 获取文件列表数据
     * @returns {Array<{fileId: string, file: File}>}
     */
    function getFiles() {
        return fileUpload.getAcceptedFiles().map(file => ({
            fileId: file.upload.uuid,
            file
        }));
    }

    /**
     * 启动处理流程
     * 默认行为：将所有文件的进度设为 0，然后向 Worker 发送 { type: 'process', files } 消息
     * 可通过 onStartProcess 钩子自定义发送的消息内容
     * @param {Object} [extraData] - 额外数据，会合并到发送给 Worker 的消息中（如设置参数）
     * @param {Function} [customGetFiles] - 自定义获取文件列表的函数，返回 {fileId: string, file: File} 数组
     */
    function startProcess(extraData = {}, customGetFiles) {
        const files = typeof customGetFiles === 'function' ? customGetFiles() : getFiles();
        if (onStartProcess) {
            // 钩子返回自定义消息则使用自定义消息，否则使用默认消息
            const customMessage = onStartProcess(files, extraData);
            if (customMessage) {
                worker.postMessage(customMessage);
                return;
            }
        }
        // 重置所有文件进度
        fileUpload.getAcceptedFiles().forEach(file => {
            file.extend?.setProgress(0, $L.get('upload.processing'));
        });

        worker.postMessage({
            type: 'process',
            files,
            ...extraData
        });
    }

    return {
        worker,
        startProcess
    };
}

export {
    initWorker
}
