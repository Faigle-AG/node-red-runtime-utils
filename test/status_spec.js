const assert = require('assert/strict');
const { createStatus } = require('../src/lib/status');

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

    it('sets processing status', function () {
        const status = createStatus(node);
        status.processing('working');
        assert.deepEqual(lastStatus, { fill: 'blue', shape: 'ring', text: 'working' });
    });

    it('sets failed status', function () {
        const status = createStatus(node);
        status.failed('error');
        assert.deepEqual(lastStatus, { fill: 'red', shape: 'dot', text: 'error' });
    });

    it('sets warning status', function () {
        const status = createStatus(node);
        status.warning('warn');
        assert.deepEqual(lastStatus, { fill: 'yellow', shape: 'dot', text: 'warn' });
    });

    it('sets info status', function () {
        const status = createStatus(node);
        status.info('info');
        assert.deepEqual(lastStatus, { fill: 'grey', shape: 'dot', text: 'info' });
    });

    it('sets waiting status', function () {
        const status = createStatus(node);
        status.waiting('wait');
        assert.deepEqual(lastStatus, { fill: 'grey', shape: 'ring', text: 'wait' });
    });

    it('sets idle status', function () {
        const status = createStatus(node);
        status.idle();
        assert.deepEqual(lastStatus, { fill: 'grey', shape: 'ring', text: 'idle' });
    });

    it('sets disabled status', function () {
        const status = createStatus(node);
        status.disabled();
        assert.deepEqual(lastStatus, { fill: 'grey', shape: 'dot', text: 'disabled' });
    });

    it('sets paused status', function () {
        const status = createStatus(node);
        status.paused();
        assert.deepEqual(lastStatus, { fill: 'yellow', shape: 'ring', text: 'paused' });
    });

    it('sets succeeded status and clears after timeout', function (done) {
        const status = createStatus(node);
        status.succeeded('done', { durationMs: 10 });
        assert.deepEqual(lastStatus, { fill: 'green', shape: 'dot', text: 'done' });

        setTimeout(() => {
            assert.deepEqual(lastStatus, {});
            done();
        }, 15);
    });

    it('calls next after succeeded timeout', function (done) {
        const status = createStatus(node);
        status.succeeded('done', {
            durationMs: 10,
            next: () => {
                assert.deepEqual(lastStatus, { fill: 'green', shape: 'dot', text: 'done' });
                done();
            },
        });
    });

    it('cancels pending timeouts when calling another status', function (done) {
        const status = createStatus(node);
        status.succeeded('done', { durationMs: 15 });
        status.failed('error');

        setTimeout(() => {
            assert.deepEqual(lastStatus, { fill: 'red', shape: 'dot', text: 'error' });
            done();
        }, 20);
    });

    it('clears status and timers', function () {
        const status = createStatus(node);
        status.processing('working');
        status.clear();
        assert.deepEqual(lastStatus, {});
    });
});
