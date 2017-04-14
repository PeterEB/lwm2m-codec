var expect = require('chai').expect,
    decode = require('../lib/decode.js');
    
describe('decode - Functional Check', function () {
    it('#.decode(link)', function () {
        expect(decode('link', '</1/2>;pmin=10;pmax=60,</1/2/1>,</1/2/2>')).to.be.eql({ path: '/1/2', attrs: { pmin: 10, pmax: 60 }, resrcList: ['/1/2/1', '/1/2/2'] });
    });

    it('#.decode(json)', function () {
        expect(decode('json', 'x', { e: [{ n: '1/0', sv: 'x' }, { n: '1/1', v: 5 }, { n: '2/0', bv: true }] })).to.be.eql({ 1: {  0: 'x', 1: 5 }, 2: {  0: true }});
        expect(decode('json', 'x/y', { e: [{ n: '0', sv: 'x' }, { n: '1', v: 5 }] })).to.be.eql({ 0: 'x', 1: 5 });
        expect(decode('json', 'x/y/z', { e: [{ n: '', v: 5}]})).to.be.eql(5);
    });
});