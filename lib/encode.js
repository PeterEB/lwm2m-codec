'use strict';

var _ = require('busyman');

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
function encodeJson(path, value) {

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
