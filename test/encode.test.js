var expect = require('chai').expect,
    encode = require('../lib/encode.js');
    
describe('encode - Functional Check', function () {
    it('#.encode(link)', function () {
        expect(encode('link', 'x', { 1: {  0: 'x', 1: 5 }, 2: {  0: true, 1: 0 }}, { pmin: 10, pmax: 60 })).to.be.eql('</x>;pmin=10;pmax=60,</x/1/0>,</x/1/1>,</x/2/0>,</x/2/1>');
		expect(encode('link', 'x/y', {  0: 'x', 1: 5 }, { pmin: 10, pmax: 60 })).to.be.eql('</x/y>;pmin=10;pmax=60,</x/y/0>,</x/y/1>');
		expect(encode('link', 'x/y/z', 10, { pmin: 10, pmax: 60 })).to.be.eql('</x/y/z>;pmin=10;pmax=60');
    });

    it('#.encode(json)', function () {
        expect(encode('json', 'x', { 1: {  0: 'x', 1: 5 }, 2: {  0: true, 1: 0 }})).to.be.eql({ bn: '/x', e: [{ n: '1/0', sv: 'x' }, { n: '1/1', v: 5 }, { n: '2/0', bv: true }, { n:'2/1', v: 0}] });
        expect(encode('json', 'x/y', { 0: 'x', 1: 5, 2: new Date(100000) })).to.be.eql({ bn: '/x/y', e: [{ n: '0', sv: 'x' }, { n: '1', v: 5 }, { n: '2', v: 100000 }] });
        expect(encode('json', 'x/y/z', 5)).to.be.eql({ bn: '/x/y/z', e: [{ n: '', v: 5}]});
        expect(encode('json', 'x/y/z', new Date(100000))).to.be.eql({ bn: '/x/y/z', e: [{ n: '', v: 100000}]});
    });
});