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

        await node.setTypedProperty(msg, 'payload', 'msg', 'data');

        assert.equal(msg.payload, 'data');
    });

    it('sets a flow property', async function () {
        extendProperties(node, RED);

        await node.setTypedProperty(msg, 'testKey', 'flow', 'data');

        assert.equal(flowStore.data.testKey, 'data');
    });

    it('sets a global property', async function () {
        extendProperties(node, RED);

        await node.setTypedProperty(msg, 'testKey', 'global', 'data');

        assert.equal(globalStore.data.testKey, 'data');
    });

    it('throws if target property is missing', function () {
        extendProperties(node, RED);

        assert.throws(
            () => node.setTypedProperty(msg, '', 'msg', 'data'),
            /Target property is missing/,
        );
    });

    it('throws if target type is unsupported', function () {
        extendProperties(node, RED);

        assert.throws(
            () => node.setTypedProperty(msg, 'test', 'invalid', 'data'),
            /Unsupported target property type/,
        );
    });
});
