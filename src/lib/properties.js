'use strict';

function extendProperties(node, RED) {
    if (!node || typeof node.context !== 'function') {
        throw new Error('extendProperties requires a Node-RED node instance');
    }

    if (!RED || !RED.util) {
        throw new Error('extendProperties requires the Node-RED runtime object');
    }

    if (node.getTypedProperty && node.setTypedProperty) {
        return node;
    }

    node.getTypedProperty = function (value, type, msg) {
        return new Promise((resolve, reject) => {
            RED.util.evaluateNodeProperty(value, type, node, msg, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    };

    node.setTypedProperty = function (msg, target, targetType, value) {
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
