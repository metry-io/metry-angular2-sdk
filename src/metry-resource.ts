import { Observable } from 'rxjs'
import { Request, RequestOptions, RequestMethod, URLSearchParams } from '@angular/http'
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
    ranges: Array<string>,
    metrics: Array<string>,
    extraParams?: URLSearchParams
  ): Promise<any> {
    const search = new URLSearchParams()
    search.set('metrics', metricsParam(metrics))

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

  action (action: string, id: string, data: any, options?: RequestOptions): Promise<any> {
    return this.metry.request(makeRequest(this, id, 'PUT', data, options))
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
  id: string,
  method: string,
  data: any,
  extraConfig?: RequestOptions,
  action?: string
): Request {
  const meth = mergedMethod(method, extraConfig)

  return new Request(
    new RequestOptions(
      Object.assign(
        {
          method: meth,
          url: resourceUrl(resource, id, action),
          data: useData(meth) ? data : null,
          params: !useData(meth) ? filterEmptyValues(data) : null
        },
        extraConfig || {}
      )
    )
  )
}

function useData (method: string|RequestMethod) {
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
