'use strict';

const DEFAULT_SUCCESS_DURATION_MS = 10_000;

function extendStatus(node) {
    if (!node || typeof node.status !== 'function') {
        throw new Error('extendStatus requires a Node-RED node instance');
    }

    if (node.status.succeeded) {
        return node;
    }

    let timer = null;

    function cancelTimer() {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    }

    function show(fill, shape, text) {
        cancelTimer();
        node.status({ fill, shape, text });
    }

    node.status.clear = function () {
        cancelTimer();
        node.status({});
    };

    if (typeof node.on === 'function') {
        node.on('close', function () {
            cancelTimer();
        });
    }

    node.status.succeeded = function (text, options = {}) {
        cancelTimer();

        node.status({
            fill: 'green',
            shape: 'dot',
            text: text || 'succeeded',
        });

        timer = setTimeout(() => {
            timer = null;

            if (options.next && typeof options.next === 'function') options.next();
            else node.status({});
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

    return node;
}

module.exports = {
    extendStatus,
};
