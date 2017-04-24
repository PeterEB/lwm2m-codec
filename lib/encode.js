'use strict';

var _ = require('busyman'),
    Concentrate = require('concentrate');

var cutils = require('./cutils');

function encode(type, path, value, attrs) {
    switch (type) {
        case 'link':
            return encodeLink(path, value, attrs);

        case 'tlv':
            return encodeTlv(path, value);

        case 'json':
            return encodeJson(path, value);

        default:
            break;
    }
}

/*********************************************************
 * Link-format                                           *
 *********************************************************/
function encodeLink(path, value, attrs) {
    var allowedAttrs = [ 'pmin', 'pmax', 'gt', 'lt', 'st' ],
        pathType = cutils.getPathDateType(path),
        pathArray = cutils.getPathArray(path),
        oid = pathArray[0],
        attrsPayload = '',
        linkFormat = '';

    _.forEach(attrs, function (val, key) {
        if (_.includes(allowedAttrs, key) && _.isNumber(val))
            attrsPayload = attrsPayload + ';' + key + '=' + val;   // ';pmin=0;pmax=60'
    });

    path = cutils.getNumPath(path);
    linkFormat = '<' + path + '>' + attrsPayload + ',';

    switch (pathType) {
        case 'object':         // obj
            _.forEach(value, function (iobj, iid) {
                _.forEach(iobj, function (val, rid) {
                    linkFormat = linkFormat + '<' + path + '/' + iid + '/' + cutils.ridNumber(oid, rid) + '>' + ',';
                });
            });
            break;

        case 'instance':         // inst
            _.forEach(value, function (val, rid) {
                linkFormat = linkFormat + '<' + path + '/' + cutils.ridNumber(oid, rid) + '>' + ',';
            });
            break;

        case 'resource':         // resrc
            break;

        default:
            break;
    }

    if (linkFormat[linkFormat.length-1] === ',')           
        linkFormat = linkFormat.slice(0, linkFormat.length - 1);

    return linkFormat;
}

/*********************************************************
 * Tlv                                                   *
 *********************************************************/
function encodeTlv(path, value) {
    var pathType = cutils.getPathDateType(path),
        pathArray = cutils.getPathArray(path),
        data;

    switch (pathType) {
        case 'object': 
            data = encodeTlvPacket('object', pathArray[0], value);
            break;

        case 'instance': 
            data = encodeTlvPacket('instance', pathArray[1], value);
            break;

        case 'resource': 
            if (_.isPlainObject(value)) {
                data = encodeTlvPacket('multiResrc', pathArray[2], value);
            } else {
                data = encodeTlvPacket('resource', pathArray[2], value);
            }
            break;

        default:
            break;
    }

    return data;
}

function encodeTlvPacket(type, id, value) {
    var dataBuf,
        valBuf;

    switch (type) {
        case 'object':
            valBuf = [];

            _.forEach(value, function (iObj, iid) {
                valBuf.push(encodeTlvPacket('instance', iid, iObj));
            });

            dataBuf = Buffer.concat(valBuf);
            break;
        case 'instance':
            valBuf = [];

            _.forEach(value, function (resrc, rid) {
                if (_.isPlainObject(resrc)) {
                    valBuf.push(encodeTlvPacket('multiResrc', rid, resrc));
                } else {
                    valBuf.push(encodeTlvPacket('resource', rid, resrc));
                }
            });

            dataBuf = encodeTlvBuf(type, id, Buffer.concat(valBuf));
            break;
       
        case 'resource':
            valBuf = encodeTlvResrc(value);
            dataBuf = encodeTlvBuf(type, id, valBuf);
            break;
            
        case 'multiResrc':
            valBuf = [];

            _.forEach(value, function (r, riid) {
                valBuf.push(encodeTlvPacket('resrcInst', riid, r));
            });

            dataBuf = encodeTlvBuf(type, id, Buffer.concat(valBuf));
            break; 

        case 'resrcInst':
            valBuf = encodeTlvResrc(value);
            dataBuf = encodeTlvBuf(type, id, valBuf);
            break;

        default:
            break;
    }

    return dataBuf;
}

function encodeTlvBuf(type, id, valBuf) {
    var dataBuf = Concentrate(),
        len = valBuf.length,    // Bytes
        byte = 0x00,
        idType;

/***************************
 *  TYPE                   * 
 ***************************/
    switch (type) {
        case 'instance':         
            byte = byte | 0x00;
            break;
        case 'resource':         
            byte = byte | 0xC0;
            break;
        case 'multiResrc':        
            byte = byte | 0x80;
            break;
        case 'resrcInst':         
            byte = byte | 0x40;        
            break;
    }

    // [TODO] id should be number
    if (id >= 256) {
        byte = byte | 0x20;
        idType = 'uint16be';
    } else {
        byte = byte | 0x00;
        idType = 'uint8';
    }

    // [TODO] else Error
    if (len < 8)
        byte = byte | len;
    else if (len < 256) 
        byte = byte | 0x08;
    else if (len < 65536)
        byte = byte | 0x10;
    else if (len < 16777215)
        byte = byte | 0x18;

    dataBuf.uint8(byte);

/***************************
 *  ID                     * 
 ***************************/
    dataBuf[idType](id);

/***************************
 *  LENGTH                 * 
 ***************************/
    if (8 <= len < 256) 
        dataBuf.uint8(len);
    else if (len < 65536)       // [TODO] value is out of bounds
        dataBuf.uint16be(len);
    else if (len < 16777216) {  // [TODO] value is out of bounds
        dataBuf.uint8((len >> 16) & 0xFF);
        dataBuf.uint16be(len & 0xFF);
    }

/***************************
 *  VALUE                  * 
 ***************************/
    dataBuf.buffer(valBuf);

    return dataBuf.result();
}

function encodeTlvResrc(value) {
    var dataBuf = Concentrate(),
        type = Object.prototype.toString.call(value).slice(8, -1),  // [TODO] use lwm2m-id.rDef?
        len, zLen;

    switch (type) {
        case 'String':
            dataBuf.string(value, 'utf8');
            break;

        case 'Date':
            value = value.getTime();
        case 'Number':
            if (Number.isInteger(value)) {
                len = cutils.length(value);

                if (len == 1) {
                    dataBuf.int8(value);
                } else if (len == 2) {
                    dataBuf.int16be(value);
                } else if (len <= 4) {
                    dataBuf.int32be(value);
                } else if (len <= 8) {
                    value = value.toString(16);
                    zLen = 16 - value.length;

                    for (var i = 0; i < zLen; i++) {
                        value = '0' + value;
                    }

                    dataBuf.buffer(new Buffer(value, 'hex'));
                } else {
                    // [TODO] Error?
                }
            } else {
                // [TODO] double
                dataBuf.floatbe(value);
            }
            break;

        case 'Boolean':
            dataBuf.uint8(value ? 1 : 0);
            break;

        // [TODO] Objlnk?
        default:
            // [TODO] Array Buffer Error?
            break;
    }

    return dataBuf.result();
}

/*********************************************************
 * Json                                                  *
 *********************************************************/
function encodeJson(path, value) {
    var objInJson = { 
            bn: cutils.checkPathBegin(path), 
            e: [] 
        },
        pathType = cutils.getPathDateType(path),
        pathArray = cutils.getPathArray(path),
        oid = pathArray[0];

    if (pathType !== 'resource' && !_.isPlainObject(value)) 
        throw new TypeError('value should be a object.');

    switch (pathType) {
        case 'object':         // obj
            _.forEach(value, function (iObj, iid) {
                _.forEach(iObj, function (resrc, rid) {
                    if (_.isPlainObject(resrc)) {
                        _.forEach(resrc, function (r, riid) {
                            var data = encodeJsonValue(iid + '/' + rid + '/' + riid, r);
                            objInJson.e.push(data);
                        });
                    } else {
                        var data = encodeJsonValue(iid + '/' + cutils.ridNumber(oid, rid), resrc);
                        objInJson.e.push(data);
                    }
                });
            });
            break;

        case 'instance':         // inst
            _.forEach(value, function (resrc, rid) {
                if (_.isPlainObject(resrc)) {
                    _.forEach(resrc, function (r, riid) {
                        var data = encodeJsonValue(cutils.ridNumber(oid, rid) + '/' + riid, r);
                        objInJson.e.push(data);
                    });
                } else {
                    var data = encodeJsonValue(cutils.ridNumber(oid, rid), resrc);
                    objInJson.e.push(data);
                }
            });
            break;

        case 'resource':         // resrc
            if (_.isPlainObject(value)) {
                _.forEach(value, function (r, riid) {
                    var data = encodeJsonValue(riid, r);
                    objInJson.e.push(data);
                });
            } else {
                if (value instanceof Date) value = Number(value);
                var data = encodeJsonValue('', value);
                objInJson.e.push(data);
            }
            break;

        default:
            break;
     }

    return objInJson;
}

function encodeJsonValue(path, value) {
    var val = {};

    if (_.isNil(value)) {
        value = path;
        path = undefined;
    } else {
        val.n = path.toString();
    }

    if (_.isNumber(value)) {
        val.v = Number(value);
    } else if (_.isString(value)) {
        val.sv = String(value);
    } else if (value instanceof Date) {
        val.v = Number(value);       
    } else if (_.isBoolean(value)) {
        val.bv = Boolean(value);
    } else if (_.isPlainObject(value)) {
        val.ov = value;     // [TODO] objlnk
    }

    return val;
}

/*********************************************************
 * Module Exports                                        *
 *********************************************************/
module.exports = encode;
