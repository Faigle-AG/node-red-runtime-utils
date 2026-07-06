# @faigle/node-red-runtime-utils

Runtime helpers for building Node-RED nodes.

This package provides small, reusable utilities for common Node-RED node tasks:

- reading typed input properties
- writing to configurable output targets
- showing consistent node status states

## Installation

```bash
npm install @faigle/node-red-runtime-utils
```

## Usage

Import the helpers inside your Node-RED node runtime file:

```js
module.exports = function (RED) {
    const { getTypedProperty, setTypedProperty, createStatus } =
        require('@faigle/node-red-runtime-utils')(RED);

    function MyNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        const status = createStatus(node);

        node.on('input', async function (msg, send, done) {
            try {
                status.processing('working');

                const value = await getTypedProperty(
                    config.source,
                    config.sourceType || 'str',
                    node,
                    msg,
                );

                await setTypedProperty(
                    node,
                    msg,
                    config.target || 'payload',
                    config.targetType || 'msg',
                    value,
                );

                status.succeeded('done');

                send(msg);
                if (done) done();
            } catch (err) {
                status.failed(err.message || 'failed');

                if (done) done(err);
                else node.error(err, msg);
            }
        });
    }

    RED.nodes.registerType('my-node', MyNode);
};
```

## Helpers

### `getTypedProperty(value, type, node, msg)`

Reads a value from a Node-RED typed input configuration.

```js
const value = await getTypedProperty(config.source, config.sourceType, node, msg);
```

Example editor setup:

```js
$('#node-input-source').typedInput({
    default: 'str',
    types: ['msg', 'flow', 'global', 'str', 'jsonata', 'env'],
    typeField: $('#node-input-sourceType'),
});
```

Example defaults:

```js
defaults: {
    source: { value: '' },
    sourceType: { value: 'str' },
}
```

---

### `setTypedProperty(node, msg, target, targetType, value)`

Writes a value to a configurable output target.

Supported target types:

- `msg`
- `flow`
- `global`

```js
await setTypedProperty(node, msg, config.target || 'payload', config.targetType || 'msg', value);
```

Example editor setup:

```js
$('#node-input-target').typedInput({
    default: 'msg',
    types: ['msg', 'flow', 'global'],
    typeField: $('#node-input-targetType'),
});
```

Example defaults:

```js
defaults: {
    target: { value: 'payload' },
    targetType: { value: 'msg' },
}
```

Example targets:

```txt
payload
file.data
result.value
```

For `msg` targets, do not include the `msg.` prefix.

---

### `createStatus(node)`

Creates a small status helper for a Node-RED node instance.

```js
const status = createStatus(node);
```

Available methods:

```js
status.processing('working');
status.succeeded('done');
status.failed('failed');
status.warning('warning');
status.waiting('waiting');
status.idle('idle');
status.disabled('disabled');
status.paused('paused');
status.clear();
```

Default status behavior:

| Method         | Status                             |
| -------------- | ---------------------------------- |
| `processing()` | blue ring                          |
| `succeeded()`  | green dot, clears after 10 seconds |
| `failed()`     | red dot                            |
| `warning()`    | yellow dot                         |
| `waiting()`    | grey ring                          |
| `idle()`       | grey dot                           |
| `disabled()`   | grey dot                           |
| `paused()`     | yellow ring                        |

#### Success with custom duration

```js
status.succeeded('done', {
    durationMs: 3000,
});
```

#### Success followed by another status

```js
status.succeeded('done', {
    next: () => status.waiting('waiting for input'),
});
```
