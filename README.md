# @faigle/node-red-runtime-utils

Runtime helpers for building Node-RED nodes.

This package extends a Node-RED node instance with small convenience methods for common runtime tasks:

- reading typed input properties
- writing to configurable output targets
- showing consistent node status states

It is intended to be used by Node-RED node packages, not installed as a Node-RED palette node itself.

## Installation

```bash
npm install @faigle/node-red-runtime-utils
```

## Usage

```js
module.exports = function (RED) {
    const { extendNode } = require('@faigle/node-red-runtime-utils')(RED);

    function MyNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;

        extendNode(node);

        node.on('input', async function (msg, send, done) {
            try {
                node.status.processing('working');

                const value = await node.getTypedProperty(
                    config.source,
                    config.sourceType || 'str',
                    msg,
                );

                await node.setTypedProperty(
                    config.target || 'payload',
                    config.targetType || 'msg',
                    msg,
                    value,
                );

                node.status.succeeded('done');

                send(msg);
                if (done) done();
            } catch (err) {
                node.status.failed(err.message || 'failed');

                if (done) done(err);
                else node.error(err, msg);
            }
        });
    }

    RED.nodes.registerType('my-node', MyNode);
};
```

## Property helpers

### `extendProperties(node)`

Adds typed property helper methods to a Node-RED node instance.

```js
extendProperties(node);
```

After extension, the node has:

```js
node.getTypedProperty(value, type, msg);
node.setTypedProperty(target, targetType, msg, value);
```

### `node.getTypedProperty(value, type, msg)`

Reads a value from a Node-RED typed input configuration.

```js
const value = await node.getTypedProperty(config.source, config.sourceType || 'str', msg);
```

Example editor setup:

```js
$('#node-input-source').typedInput({
    default: 'str',
    types: ['msg', 'flow', 'global', 'str', 'jsonata', 'env'],
    typeField: $('#node-input-sourceType'),
});
```

Example node defaults:

```js
defaults: {
    source: { value: '' },
    sourceType: { value: 'str' },
}
```

### `node.setTypedProperty(target, targetType, msg, value)`

Writes a value to a configurable output target.

Supported target types:

- `msg`
- `flow`
- `global`

```js
await node.setTypedProperty(config.target || 'payload', config.targetType || 'msg', msg, value);
```

Example editor setup:

```js
$('#node-input-target').typedInput({
    default: 'msg',
    types: ['msg', 'flow', 'global'],
    typeField: $('#node-input-targetType'),
});
```

Example node defaults:

```js
defaults: {
    target: { value: 'payload' },
    targetType: { value: 'msg' },
}
```

Example `msg` targets:

```txt
payload
file.data
result.value
```

For `msg` targets, do not include the `msg.` prefix.

Correct:

```txt
payload
file.data
```

Incorrect:

```txt
msg.payload
msg.file.data
```

## Status helpers

### `extendStatus(node)`

Adds helper methods to the existing `node.status` function.

```js
extendStatus(node);
```

Raw Node-RED status calls still work:

```js
node.status({ fill: 'green', shape: 'dot', text: 'ready' });
```

After extension, the node also supports:

```js
node.status.processing('working');
node.status.succeeded('done');
node.status.failed('failed');
node.status.warning('warning');
node.status.info('info');
node.status.waiting('waiting');
node.status.idle('idle');
node.status.disabled('disabled');
node.status.paused('paused');
node.status.clear();
```

Default status behavior:

| Method         | Status                             |
| -------------- | ---------------------------------- |
| `processing()` | blue ring                          |
| `succeeded()`  | green dot, clears after 10 seconds |
| `failed()`     | red dot                            |
| `warning()`    | yellow dot                         |
| `info()`       | grey dot                           |
| `waiting()`    | grey ring                          |
| `idle()`       | grey ring                          |
| `disabled()`   | grey dot                           |
| `paused()`     | yellow ring                        |
| `clear()`      | clears the node status             |

### Success with custom duration

```js
node.status.succeeded('done', {
    durationMs: 3000,
});
```

### Success followed by another status

```js
node.status.succeeded('done', {
    next: () => node.status.waiting('waiting for input'),
});
```

## all helpers

For simplification, the `extendNode(node)` funciton extends the node with all helpers.

## Example with typed input and typed output

```js
module.exports = function (RED) {
    const { extendNode } = require('@faigle/node-red-runtime-utils')(RED);

    function ExampleNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;

        extendNode(node);

        node.source = config.source;
        node.sourceType = config.sourceType || 'str';
        node.target = config.target || 'payload';
        node.targetType = config.targetType || 'msg';

        node.on('input', async function (msg, send, done) {
            try {
                node.status.processing('processing');

                const value = await node.getTypedProperty(node.source, node.sourceType, msg);

                await node.setTypedProperty(node.target, node.targetType, msg, value);

                node.status.succeeded('done');

                send(msg);
                if (done) done();
            } catch (err) {
                node.status.failed(err.message || 'failed');

                if (done) done(err);
                else node.error(err, msg);
            }
        });
    }

    RED.nodes.registerType('example-node', ExampleNode);
};
```
