'use strict';

const DEFAULT_SUCCESS_DURATION_MS = 10_000;

function createStatus(node) {
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

    function clear() {
        cancelTimer();
        node.status({});
    }

    function succeeded(text, options = {}) {
        cancelTimer();

        node.status({
            fill: 'green',
            shape: 'dot',
            text: text || 'succeeded',
        });

        timer = setTimeout(() => {
            timer = null;

            if (options.next) {
                options.next();
            } else {
                node.status({});
            }
        }, options.durationMs || DEFAULT_SUCCESS_DURATION_MS);
    }

    return {
        succeeded,

        failed(text) {
            show('red', 'dot', text || 'failed');
        },

        warning(text) {
            show('yellow', 'dot', text || 'warning');
        },

        info(text) {
            show('grey', 'dot', text || 'info');
        },

        processing(text) {
            show('blue', 'ring', text || 'processing');
        },

        waiting(text) {
            show('grey', 'ring', text || 'waiting');
        },

        idle(text) {
            show('grey', 'ring', text || 'idle');
        },

        disabled(text) {
            show('grey', 'dot', text || 'disabled');
        },

        paused(text) {
            show('yellow', 'ring', text || 'paused');
        },

        clear,
    };
}

module.exports = {
    createStatus,
};
