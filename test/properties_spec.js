const assert = require('assert/strict');
const createPropertyUtils = require('../src/lib/properties');

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
        assert.throws(() => createPropertyUtils(), /requires the Node-RED runtime object/);
    });

    it('gets a typed property successfully', async function () {
        const utils = createPropertyUtils(RED);
        const res = await utils.getTypedProperty('test', 'str', node, msg);
        assert.equal(res, 'test-evaluated');
    });

    it('rejects when property evaluation fails', async function () {
        const utils = createPropertyUtils(RED);
        await assert.rejects(utils.getTypedProperty('error', 'str', node, msg), /eval error/);
    });

    it('sets a msg property', async function () {
        const utils = createPropertyUtils(RED);
        await utils.setTypedProperty(node, msg, 'payload', 'msg', 'data');
        assert.equal(msg.payload, 'data');
    });

    it('sets a flow property', async function () {
        const utils = createPropertyUtils(RED);
        await utils.setTypedProperty(node, msg, 'testKey', 'flow', 'data');
        assert.equal(flowStore.data['testKey'], 'data');
    });

    it('sets a global property', async function () {
        const utils = createPropertyUtils(RED);
        await utils.setTypedProperty(node, msg, 'testKey', 'global', 'data');
        assert.equal(globalStore.data['testKey'], 'data');
    });

    it('throws if target property is missing', function () {
        const utils = createPropertyUtils(RED);
        assert.throws(
            () => utils.setTypedProperty(node, msg, '', 'msg', 'data'),
            /Target property is missing/,
        );
    });

    it('throws if target type is unsupported', function () {
        const utils = createPropertyUtils(RED);
        assert.throws(
            () => utils.setTypedProperty(node, msg, 'test', 'invalid', 'data'),
            /Unsupported target property type/,
        );
    });
});
