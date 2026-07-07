'use strict';

const { extendProperties } = require('./lib/properties');
const { extendStatus } = require('./lib/status');

module.exports = function createRuntimeUtils(RED) {
    return {
        extendProperties(node) {
            return extendProperties(node, RED);
        },
        extendStatus,

        extendNode(node) {
            return extendStatus(extendProperties(node));
        },
    };
};
