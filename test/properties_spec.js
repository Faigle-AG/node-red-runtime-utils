const assert = require('assert/strict');
const { extendProperties } = require('../src/lib/properties');

describe('properties utils', function () {
    let RED, node, msg, flowStore, globalStore;

    beforeEach(function () {
        flowStore = {
            data: {},
            set: function (k, v, cb) {
                this.data[k] = v;
                if (cb) cb();
                return Promise.resolve();
            },
        };

        globalStore = {
            data: {},
            set: function (k, v, cb) {
                this.data[k] = v;
                if (cb) cb();
                return Promise.resolve();
            },
        };

        RED = {
            util: {
                evaluateNodeProperty: (val, type, n, m, cb) => {
                    if (val === 'error') return cb(new Error('eval error'));
                    cb(null, `${val}-evaluated`);
                },
                setMessageProperty: (m, prop, val) => {
                    m[prop] = val;
                },
            },
        };

        node = {
            context: () => ({ flow: flowStore, global: globalStore }),
        };

        msg = {};
    });

    it('throws if RED is not provided', function () {
        assert.throws(() => extendProperties(node), /requires the Node-RED runtime object/);
    });

    it('throws when extending an invalid node', function () {
        assert.throws(() => extendProperties({}, RED), /requires a Node-RED node instance/);
    });

    it('extends a node with typed property helpers', function () {
        const returned = extendProperties(node, RED);

        assert.equal(returned, node);
        assert.equal(typeof node.getTypedProperty, 'function');
        assert.equal(typeof node.setTypedProperty, 'function');
    });

    it('does not replace existing extended property helpers', function () {
        node.getTypedProperty = function () {};
        node.setTypedProperty = function () {};

        const getTypedProperty = node.getTypedProperty;
        const setTypedProperty = node.setTypedProperty;

        extendProperties(node, RED);

        assert.equal(node.getTypedProperty, getTypedProperty);
        assert.equal(node.setTypedProperty, setTypedProperty);
    });

    it('gets a typed property successfully', async function () {
        extendProperties(node, RED);

        const res = await node.getTypedProperty('test', 'str', msg);

        assert.equal(res, 'test-evaluated');
    });

    it('rejects when property evaluation fails', async function () {
        extendProperties(node, RED);

        await assert.rejects(node.getTypedProperty('error', 'str', msg), /eval error/);
    });

    it('sets a msg property', async function () {
        extendProperties(node, RED);

        await node.setTypedProperty('payload', 'msg', msg, 'data');

        assert.equal(msg.payload, 'data');
    });

    it('sets a flow property', async function () {
        extendProperties(node, RED);

        await node.setTypedProperty('testKey', 'flow', msg, 'data');

        assert.equal(flowStore.data.testKey, 'data');
    });

    it('sets a global property', async function () {
        extendProperties(node, RED);

        await node.setTypedProperty('testKey', 'global', msg, 'data');

        assert.equal(globalStore.data.testKey, 'data');
    });

    it('rejects if target property is missing', async function () {
        extendProperties(node, RED);

        await assert.rejects(
            node.setTypedProperty('', 'msg', msg, 'data'),
            /Target property is missing/,
        );
    });

    it('rejects if target type is unsupported', async function () {
        extendProperties(node, RED);

        await assert.rejects(
            node.setTypedProperty('test', 'invalid', msg, 'data'),
            /Unsupported target property type/,
        );
    });

    it('resolves immediately to an empty string without stalling when value is empty or undefined', async function () {
        extendProperties(node, RED);
        let evalCalled = false;
        RED.util.evaluateNodeProperty = () => {
            evalCalled = true;
        };

        const res1 = await node.getTypedProperty('', 'str', msg);
        const res2 = await node.getTypedProperty(undefined, 'msg', msg);

        assert.equal(res1, '');
        assert.equal(res2, '');
        assert.equal(evalCalled, false);
    });

    it('defaults to msg type and resolves without stalling when type is undefined', async function () {
        extendProperties(node, RED);
        let passedType = null;
        RED.util.evaluateNodeProperty = (val, type, n, m, cb) => {
            passedType = type;
            cb(null, 'defaulted');
        };

        const res = await node.getTypedProperty('payload', undefined, msg);
        assert.equal(res, 'defaulted');
        assert.equal(passedType, 'msg');
    });

    it('rejects immediately without stalling when evaluateNodeProperty throws synchronously', async function () {
        extendProperties(node, RED);
        RED.util.evaluateNodeProperty = () => {
            throw new Error('synchronous evaluation failure');
        };

        await assert.rejects(
            node.getTypedProperty('explode', 'jsonata', msg),
            /synchronous evaluation failure/,
        );
    });
});
