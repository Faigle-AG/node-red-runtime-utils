const assert = require('assert/strict');
const { extendStatus } = require('../src/lib/status');

describe('status utils', function () {
    let node, lastStatus;

    beforeEach(function () {
        lastStatus = null;
        node = {
            status: (s) => {
                lastStatus = s;
            },
        };
    });

    it('extends node.status without replacing the original status function', function () {
        const originalStatus = node.status;

        const returned = extendStatus(node);

        assert.equal(returned, node);
        assert.equal(node.status, originalStatus);
        assert.equal(typeof node.status.processing, 'function');
        assert.equal(typeof node.status.succeeded, 'function');
        assert.equal(typeof node.status.failed, 'function');
    });

    it('keeps raw node.status calls working', function () {
        extendStatus(node);

        node.status({ fill: 'green', shape: 'dot', text: 'raw' });

        assert.deepEqual(lastStatus, { fill: 'green', shape: 'dot', text: 'raw' });
    });

    it('sets processing status', function () {
        extendStatus(node);
        node.status.processing('working');
        assert.deepEqual(lastStatus, { fill: 'blue', shape: 'ring', text: 'working' });
    });

    it('sets failed status', function () {
        extendStatus(node);
        node.status.failed('error');
        assert.deepEqual(lastStatus, { fill: 'red', shape: 'dot', text: 'error' });
    });

    it('sets warning status', function () {
        extendStatus(node);
        node.status.warning('warn');
        assert.deepEqual(lastStatus, { fill: 'yellow', shape: 'dot', text: 'warn' });
    });

    it('sets info status', function () {
        extendStatus(node);
        node.status.info('info');
        assert.deepEqual(lastStatus, { fill: 'grey', shape: 'dot', text: 'info' });
    });

    it('sets waiting status', function () {
        extendStatus(node);
        node.status.waiting('wait');
        assert.deepEqual(lastStatus, { fill: 'grey', shape: 'ring', text: 'wait' });
    });

    it('sets idle status', function () {
        extendStatus(node);
        node.status.idle();
        assert.deepEqual(lastStatus, { fill: 'grey', shape: 'ring', text: 'idle' });
    });

    it('sets disabled status', function () {
        extendStatus(node);
        node.status.disabled();
        assert.deepEqual(lastStatus, { fill: 'grey', shape: 'dot', text: 'disabled' });
    });

    it('sets paused status', function () {
        extendStatus(node);
        node.status.paused();
        assert.deepEqual(lastStatus, { fill: 'yellow', shape: 'ring', text: 'paused' });
    });

    it('sets succeeded status and clears after timeout', function (done) {
        extendStatus(node);

        node.status.succeeded('done', { durationMs: 10 });
        assert.deepEqual(lastStatus, { fill: 'green', shape: 'dot', text: 'done' });

        setTimeout(() => {
            assert.deepEqual(lastStatus, {});
            done();
        }, 15);
    });

    it('calls next after succeeded timeout', function (done) {
        extendStatus(node);

        node.status.succeeded('done', {
            durationMs: 10,
            next: () => {
                node.status.waiting('waiting');
                assert.deepEqual(lastStatus, {
                    fill: 'grey',
                    shape: 'ring',
                    text: 'waiting',
                });
                done();
            },
        });
    });

    it('cancels pending timeouts when calling another status', function (done) {
        extendStatus(node);

        node.status.succeeded('done', { durationMs: 15 });
        node.status.failed('error');

        setTimeout(() => {
            assert.deepEqual(lastStatus, { fill: 'red', shape: 'dot', text: 'error' });
            done();
        }, 20);
    });

    it('clears status and timers', function () {
        extendStatus(node);

        node.status.processing('working');
        node.status.clear();

        assert.deepEqual(lastStatus, {});
    });

    it('does not extend the same node twice', function () {
        extendStatus(node);

        const processing = node.status.processing;
        const succeeded = node.status.succeeded;

        extendStatus(node);

        assert.equal(node.status.processing, processing);
        assert.equal(node.status.succeeded, succeeded);
    });

    it('throws when extending an invalid node', function () {
        assert.throws(() => extendStatus({}), /requires a Node-RED node instance/);
    });
});
