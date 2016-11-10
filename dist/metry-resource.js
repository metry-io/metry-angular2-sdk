import { Headers, Request, RequestOptions, RequestMethod, URLSearchParams } from '@angular/http';
import { makeUrl } from './util/make-url';
const METRIC_DEFAULT = 'energy';
export class MetryResource {
    constructor(metry, resource, parent, parentId) {
        this.metry = metry;
        this.resource = resource;
        this.parent = parent;
        this.parentId = parentId;
    }
    get(id, options) {
        return this.metry.request(makeRequest(this, id, 'GET', {}, options));
    }
    getData(id, granularity, ranges, metrics, extraParams) {
        const search = new URLSearchParams();
        search.set('metrics', metricsParam(metrics));
        if (!Array.isArray(ranges)) {
            ranges = [ranges];
        }
        if (extraParams != null) {
            search.appendAll(extraParams);
        }
        return this.metry.request(new Request({
            method: RequestMethod.Get,
            search: search,
            url: makeUrl([resourceUrl(this), id, granularity, ranges.join('+')])
        }));
    }
    query(params, options) {
        return this.metry.request(makeRequest(this, null, 'GET', params, options));
    }
    save(object, options) {
        var method = ('_id' in object) ? 'PUT' : 'POST';
        var id = object._id;
        if ('_id' in object) {
            object = Object.assign({}, object);
            delete object._id;
        }
        return this.metry.request(makeRequest(this, id, method, object, options));
    }
    delete(id, options) {
        return this.metry.request(makeRequest(this, id, 'DELETE', {}, options));
    }
    batch(path, ids, data, options) {
        return this.metry.request(makeRequest(this, null, 'PUT', batchData(ids, data), options, path));
    }
    action(action, id, data, options) {
        return this.metry.request(makeRequest(this, id, 'PUT', data, options, action));
    }
    of(parent, parentId) {
        return new MetryResource(this.metry, this.resource, parent, parentId);
    }
}
function metricsParam(metrics) {
    return metrics == null
        ? METRIC_DEFAULT
        : Array.isArray(metrics)
            ? metrics.join(',')
            : metrics;
}
function makeRequest(resource, id, method, data, extraConfig, action) {
    const meth = mergedMethod(method, extraConfig);
    const inBody = dataInBody(meth);
    let options = new RequestOptions({
        method: meth,
        url: resourceUrl(resource, id, action),
        body: inBody ? requestBody(data) : '',
        search: !inBody ? requestSearch(data) : null,
        headers: inBody
            ? new Headers({ 'Content-type': 'application/json' })
            : null
    });
    if (extraConfig)
        options.merge(extraConfig);
    return new Request(options);
}
function requestBody(data) {
    return JSON.stringify(data);
}
function requestSearch(data) {
    if (data == null)
        return null;
    let searchParams = new URLSearchParams();
    Object.keys(data)
        .forEach((key) => {
        let value = data[key];
        searchParams.append(key, typeof value === 'string'
            ? value
            : value.toString());
    });
    return searchParams;
}
function dataInBody(method) {
    return (method === RequestMethod.Put || method === RequestMethod.Post) ||
        (typeof method === 'string' && ['PUT', 'POST'].indexOf(method) !== -1);
}
function mergedMethod(method, extraConfig) {
    return (typeof extraConfig !== 'object')
        ? method
        : (extraConfig.method != null)
            ? extraConfig.method
            : method;
}
function resourceUrl(resource, id, action) {
    return makeUrl([
        resource.parent,
        resource.parentId,
        resource.resource,
        id,
        action
    ]);
}
function batchData(ids, data) {
    return ids.map(function (id) { return Object.assign({ _id: id }, data); });
}
function filterEmptyValues(object) {
    var resource = {};
    for (var key in object) {
        if (!object.hasOwnProperty(key))
            continue;
        var value = object[key];
        if (value != null && (typeof value !== 'string' || value.length > 0)) {
            resource[key] = value;
        }
    }
    return resource;
}
