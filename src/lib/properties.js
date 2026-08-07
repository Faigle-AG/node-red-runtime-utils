'use strict';

function extendProperties(node, RED) {
    if (!node || typeof node.context !== 'function') {
        throw new Error('extendProperties requires a Node-RED node instance');
    }

    if (!RED || !RED.util) {
        throw new Error('extendProperties requires the Node-RED runtime object');
    }

    if (typeof node.getTypedProperty !== 'function')
        node.getTypedProperty = function (value, type, msg) {
            return new Promise((resolve, reject) => {
                if (!value) return resolve('');
                try {
                    RED.util.evaluateNodeProperty(
                        value,
                        type || 'msg',
                        node,
                        msg,
                        (err, result) => {
                            if (err) return reject(err);
                            resolve(result !== undefined && result !== null ? result : '');
                        },
                    );
                } catch (err) {
                    reject(err);
                }
            });
        };

    if (typeof node.getValidatedProperty !== 'function')
        node.getValidatedProperty = async function (value, type, msg, label, options = {}) {
            const resolved = await node.getTypedProperty(value, type, msg);
            const normalized =
                options.trimString && typeof resolved === 'string' ? resolved.trim() : resolved;

            if (
                options.required &&
                (normalized === undefined || normalized === null || normalized === '')
            ) {
                const err = new Error(`${label} resolved to an empty value`);
                err.code = options.code || 'VALUE_MISSING';
                throw err;
            }

            return normalized;
        };

    if (typeof node.setTypedProperty !== 'function')
        node.setTypedProperty = function (value, type, msg, data) {
            return new Promise((resolve, reject) => {
                try {
                    if (!value || typeof value !== 'string') {
                        throw new Error('Target property is missing');
                    }

                    switch (type || 'msg') {
                        case 'msg':
                            RED.util.setMessageProperty(msg, value, data, true);
                            resolve();
                            break;

                        case 'flow':
                            setContextValue(node.context().flow, value, data)
                                .then(resolve)
                                .catch(reject);
                            break;

                        case 'global':
                            setContextValue(node.context().global, value, data)
                                .then(resolve)
                                .catch(reject);
                            break;

                        default:
                            throw new Error(`Unsupported target property type: ${type}`);
                    }
                } catch (err) {
                    reject(err);
                }
            });
        };

    return node;
}

function setContextValue(context, key, value) {
    return new Promise((resolve, reject) => {
        try {
            const result = context.set(key, value, (err) => {
                if (err) reject(err);
                else resolve();
            });

            if (result && typeof result.then === 'function') {
                result.then(resolve).catch(reject);
            }
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = {
    extendProperties,
};
