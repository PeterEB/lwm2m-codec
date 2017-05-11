var expect = require('chai').expect,
    decode = require('../lib/decode.js'),
    cutils = require('../lib/cutils.js');

describe('decode - Functional Check', function () {
    it('#.decode(link)', function () {
        expect(decode('link', '</1/2>;pmin=10;pmax=60,</1/2/1>,</1/2/2>')).to.be.eql({ path: '/1/2', attrs: { pmin: 10, pmax: 60 }, resrcList: ['/1/2/1', '/1/2/2'] });
    });

    it('#.decode(tlv)', function () {
        expect(decode('tlv', '/3303', cutils.bufferFrom([0x08, 0x00, 0x0b, 0xe4, 0x16, 0x44, 0x41, 0xf8, 0x00, 0x00, 0xe1, 0x16, 0x45, 0x63, 0x08, 0x01, 0x0b, 0xe4, 0x16, 0x44, 0x42, 0xb2, 0x00, 0x00, 0xe1, 0x16, 0x45, 0x66]))).to.be.eql({ '0': { '5700': 31, '5701': 'c' }, '1': { '5700': 89, '5701': 'f' } });
        expect(decode('tlv', '/3303/0', cutils.bufferFrom([0x08, 0x00, 0x0b, 0xe4, 0x16, 0x44, 0x41, 0xf8, 0x00, 0x00, 0xe1, 0x16, 0x45, 0x63]))).to.be.eql({ '5700': 31, '5701': 'c' });
        expect(decode('tlv', '/3303/0/5700', cutils.bufferFrom([0xe4, 0x16, 0x44, 0x41, 0xf8, 0x00, 0x00]))).to.be.eql(31);
        expect(decode('tlv', '/temperature', cutils.bufferFrom([0x08, 0x00, 0x0b, 0xe4, 0x16, 0x44, 0x41, 0xf8, 0x00, 0x00, 0xe1, 0x16, 0x45, 0x63, 0x08, 0x01, 0x0b, 0xe4, 0x16, 0x44, 0x42, 0xb2, 0x00, 0x00, 0xe1, 0x16, 0x45, 0x66]))).to.be.eql({ '0': { '5700': 31, '5701': 'c' }, '1': { '5700': 89, '5701': 'f' } });
        expect(decode('tlv', '/temperature/0', cutils.bufferFrom([0x08, 0x00, 0x0b, 0xe4, 0x16, 0x44, 0x41, 0xf8, 0x00, 0x00, 0xe1, 0x16, 0x45, 0x63]))).to.be.eql({ '5700': 31, '5701': 'c' });
        expect(decode('tlv', '/3303/0/sensorValue', cutils.bufferFrom([0xe4, 0x16, 0x44, 0x41, 0xf8, 0x00, 0x00]))).to.be.eql(31);
        expect(decode('tlv', '/temperature/0/sensorValue', cutils.bufferFrom([0xe4, 0x16, 0x44, 0x41, 0xf8, 0x00, 0x00]))).to.be.eql(31);
    });

    it('#.decode(json)', function () {
        expect(decode('json', 'x', { e: [{ n: '1/0', sv: 'x' }, { n: '1/1', v: 5 }, { n: '2/0', bv: true }] })).to.be.eql({ 1: {  0: 'x', 1: 5 }, 2: {  0: true }});
        expect(decode('json', 'x/y', { e: [{ n: '0', sv: 'x' }, { n: '1', v: 5 }] })).to.be.eql({ 0: 'x', 1: 5 });
        expect(decode('json', 'x/y/z', { e: [{ n: '', v: 5}]})).to.be.eql(5);
    });
});