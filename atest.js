var lwm2mCodec = require('../index');

var a, b;

a = lwm2mCodec.encode('tlv', '/3303', {0: {5700: 31, 5701: 'c'}, 1:{5700: 89, 5701: 'f'}});
console.log(a);
b = lwm2mCodec.decode('tlv', '/3303', a);
console.log(b);
