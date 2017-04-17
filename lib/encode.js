'use strict';

var _ = require('busyman'),
    Concentrate = require('concentrate');

var cutils = require('./cutils');

function encode(type, path, value, attrs) {
    switch (type) {
        case 'link':
            return encodeLink(path, value, attrs);

        case 'tlv':
            return;

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
                    encodeTlvBuf('multiResource', riid, r);
                });
            } else {
                if (value instanceof Date) value = Number(value);
                data = encodeJsonValue('resource', pathArray[2], value);
            }
            break;

        default:
            break;
    }

    return data;
}

function encodeTlvBuf(type, id, value) {
    var dataBuf = Concentrate();

    switch (type) {
        case 'instance':         // inst

            break;
       
        case 'resource':         // resrc
            encodeTlvValue(dataBuf);
            break;
            
        case 'multiResrc':        // inst

            break; 

        case 'resrcInst':         // resrc

            encodeTlvValue(dataBuf);
            break;

        default:
            break;
    }

    return dataBuf.result();
}

function encodeTlvHeader(type, id, valBuf) {
    var dataBuf = Concentrate(),
        len = valBuf.length,
        valueType,
        valueIdLen,
        valueLenType,
        valueLenLen = 0x00,
        idType,
        lenType;

    switch (type) {
        case 'instance':         // inst
            valueType = 0x00;
            break;
        case 'resource':         // resrc
            valueType = 0xC0;
            break;
        case 'multiResrc':        // inst
            valueType = 0x80;
            break;
        case 'resrcInst':         // resrc
            valueType = 0x40;        
            break;
    }

    if (id > 255) {
        valueIdLen = 0x20;
        idType = 'uint16';
    } else {
        valueIdLen = 0x00;
        idType = 'uint8';
    }

    switch (len) {
        case 1:
            valueLenType = 0x08;
            lenType = 'uint8';
            break;
        case 2:
            valueLenType = 0x10;
            lenType = 'uint16';
            break;
        case 3:
            // [TODO] not uint24
            valueLenType = 0x18;
            lenType = 'uint24';
            break;
        default:
            valueLenType = 0x00;
            valueLenLen = len;
            break;
    }

    dataBuf.uint8(valueType | valueIdLen | valueLenType | valueLenLen);
    dataBuf[idType](id);

    return dataBuf.result();
}

function encodeTlvValue(type, value) {
    var dataBuf = Concentrate();

    switch (type) {
        case '':
            break;

        case '':
            break;

        case '':
            break;

        case '':
            break;

        case '':
            break;

        default:
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
