'use strict';

function createPropertyUtils(RED) {
    if (!RED || !RED.util) {
        throw new Error('createPropertyUtils requires the Node-RED runtime object');
    }

    function getTypedProperty(value, type, node, msg) {
        return new Promise((resolve, reject) => {
            RED.util.evaluateNodeProperty(value, type, node, msg, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    function setTypedProperty(node, msg, target, targetType, value) {
        if (!target || typeof target !== 'string') {
            throw new Error('Target property is missing');
        }

        switch (targetType || 'msg') {
            case 'msg':
                RED.util.setMessageProperty(msg, target, value, true);
                return Promise.resolve();

            case 'flow':
                return setContextValue(node.context().flow, target, value);

            case 'global':
                return setContextValue(node.context().global, target, value);

            default:
                throw new Error(`Unsupported target property type: ${targetType}`);
        }
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

    return {
        getTypedProperty,
        setTypedProperty,
    };
}

module.exports = createPropertyUtils;
