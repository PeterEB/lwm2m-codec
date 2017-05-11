# lwm2m-codec
A codec for lightweight M2M (LWM2M) data formats.

<br />

## Documentation  

Please visit the [Wiki](https://github.com/PeterEB/lwm2m-codec/wiki).

<br />

## Overview



<br />

## Installation

> $ npm install lwm2m-codec --save  

<br />

## Usage

```js
var lwCodec = require(lwm2m-codec);

lwCodec.encode('tlv', '/3303/0', {5700: 31, 5701: 'c'});
lwCodec.encode('temperature', '/3303/0', {5700: 31, 5701: 'c'});
// Buffer [0x08, 0x00, 0x0b, 0xe4, 0x16, 0x44, 0x41, 0xf8, 0x00, 0x00, 0xe1, 0x16, 0x45, 0x63];

```

<br />

## License

Licensed under [MIT](https://github.com/PeterEB/lwm2m-codec/blob/master/LICENSE).





encode will transforn path into ipso numerical id