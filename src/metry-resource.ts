import { Observable } from 'rxjs'
import { Headers, Request, RequestOptions, RequestMethod, URLSearchParams } from '@angular/http'
import { makeUrl } from './util/make-url'
import { Metry } from './metry'

const METRIC_DEFAULT = 'energy'

export class MetryResource {
  constructor (
    private metry: Metry,
    public resource: string,
    public parent?: string,
    public parentId?: string
  ) {}

  get (id: string, options?: RequestOptions): Promise<any> {
    return this.metry.request(
      makeRequest(this, id, 'GET', {}, options)
    )
  }

  getData (
    id: string,
    granularity: string,
    ranges: Array<string>|string,
    metrics?: Array<string>|string,
    extraParams?: URLSearchParams
  ): Promise<any> {
    const search = new URLSearchParams()
    search.set('metrics', metricsParam(metrics))

    if (!Array.isArray(ranges)) {
      ranges = [ranges]
    }

    if (extraParams != null) {
      search.appendAll(extraParams)
    }

    return this.metry.request(
      new Request({
        method: RequestMethod.Get,
        search: search,
        url: makeUrl([resourceUrl(this), id, granularity, ranges.join('+')])
      })
    )
  }

  query (params?: Object, options?: RequestOptions): Promise<any> {
    return this.metry.request(makeRequest(this, null, 'GET', params, options))
  }

  save (object: any, options?: RequestOptions): Promise<any> {
    var method = ('_id' in object) ? 'PUT' : 'POST'
    var id: string = object._id

    if ('_id' in object) {
      object = Object.assign({}, object)
      delete object._id
    }

    return this.metry.request(makeRequest(this, id, method, object, options))
  }

  delete (id: string, options?: RequestOptions): Promise<any> {
    return this.metry.request(makeRequest(this, id, 'DELETE', {}, options))
  }

  batch (path: string, ids: Array<string>, data: any, options?: RequestOptions): Promise<any> {
    return this.metry.request(
      makeRequest(this, null, 'PUT', batchData(ids, data), options, path)
    )
  }

  action (action: string, id?: string, data?: any, options?: RequestOptions): Promise<any> {
    return this.metry.request(makeRequest(this, id, 'PUT', data, options, action))
  }

  of (parent: string, parentId?: string): MetryResource {
    return new MetryResource(this.metry, this.resource, parent, parentId)
  }
}

function metricsParam (metrics?: Array<string>|string): string {
  return metrics == null
    ? METRIC_DEFAULT
    : Array.isArray(metrics)
      ? metrics.join(',')
      : metrics
}

function makeRequest (
  resource: MetryResource,
  id: string|null,
  method: string,
  data?: any,
  extraConfig?: RequestOptions,
  action?: string
): Request {
  const meth = mergedMethod(method, extraConfig)
  const inBody = dataInBody(meth)

  let options = new RequestOptions({
    method: meth,
    url: resourceUrl(resource, id, action),
    body: inBody? requestBody(data) : '',
    search: !inBody ? requestSearch(data) : null,
    headers: inBody
      ? new Headers({'Content-type': 'application/json;charset=UTF-8'})
      : null
  })

  if (extraConfig) options.merge(extraConfig)

  return new Request(options)
}

function requestBody (data?: Object) {
  return JSON.stringify(data)
}

function requestSearch (data?: Object) {
  if (data == null) return null

  let searchParams = new URLSearchParams()

  Object.keys(data)
    .forEach((key) => {
      let value = data[key]
      searchParams.append(
        key,
        typeof value === 'string'
          ? value
          : value.toString()
      )
    })

  return searchParams
}

function dataInBody (method: string|RequestMethod) {
  return (method === RequestMethod.Put || method === RequestMethod.Post) ||
    (typeof method === 'string' && ['PUT', 'POST'].indexOf(method) !== -1)
}

function mergedMethod (
  method: string,
  extraConfig?: RequestOptions
): RequestMethod|string {
  return (typeof extraConfig !== 'object')
    ? method
    : (extraConfig.method != null)
      ? extraConfig.method
      : method
}

function resourceUrl (
  resource: MetryResource,
  id?: string, action?: string
): string {
  return makeUrl([
    resource.parent,
    resource.parentId,
    resource.resource,
    id,
    action
  ])
}

function batchData (ids: Array<string>, data: Object): Object {
  return ids.map(function (id) { return Object.assign({_id: id}, data) })
}

function filterEmptyValues (object: Object): Object {
  var resource = {}

  for (var key in object) {
    if (!object.hasOwnProperty(key)) continue

    var value = object[key]

    if (value != null && (typeof value !== 'string' || value.length > 0)) {
      resource[key] = value
    }
  }

  return resource
}
