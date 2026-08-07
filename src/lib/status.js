'use strict';

const DEFAULT_SUCCESS_DURATION_MS = 10_000;

function extendStatus(node) {
    if (!node || typeof node.status !== 'function') {
        throw new Error('extendStatus requires a Node-RED node instance');
    }

    if (Object.prototype.hasOwnProperty.call(node, '_statusExtended')) {
        return node;
    }

    node._statusExtended = true;

    let timer = null;

    const originalStatus = node.status.bind(node);

    function cancelTimer() {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    }

    function status(statusObj) {
        return originalStatus(statusObj);
    }

    node.status = status;

    function show(fill, shape, text) {
        cancelTimer();
        originalStatus({ fill, shape, text });
    }

    node.status.clear = function () {
        cancelTimer();
        originalStatus({});
    };

    node.status.succeeded = function (text, options = {}) {
        cancelTimer();

        originalStatus({
            fill: 'green',
            shape: 'dot',
            text: text || 'succeeded',
        });

        timer = setTimeout(() => {
            timer = null;

            if (typeof options.next === 'function') {
                options.next();
            } else {
                originalStatus({});
            }
        }, options.durationMs || DEFAULT_SUCCESS_DURATION_MS);
    };

    node.status.failed = function (text) {
        show('red', 'dot', text || 'failed');
    };

    node.status.warning = function (text) {
        show('yellow', 'dot', text || 'warning');
    };

    node.status.info = function (text) {
        show('grey', 'dot', text || 'info');
    };

    node.status.processing = function (text) {
        show('blue', 'ring', text || 'processing');
    };

    node.status.waiting = function (text) {
        show('grey', 'ring', text || 'waiting');
    };

    node.status.idle = function (text) {
        show('grey', 'ring', text || 'idle');
    };

    node.status.disabled = function (text) {
        show('grey', 'dot', text || 'disabled');
    };

    node.status.paused = function (text) {
        show('yellow', 'ring', text || 'paused');
    };

    if (typeof node.on === 'function') {
        node.on('close', cancelTimer);
    }

    return node;
}

module.exports = {
    extendStatus,
};
