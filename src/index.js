'use strict';

module.exports = function createRuntimeUtils(RED) {
    return {
        ...require('./lib/properties')(RED),
        ...require('./lib/status'),
    };
};
