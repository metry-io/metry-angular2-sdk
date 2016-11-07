import { Observable } from 'rxjs'
import { Inject, Injectable } from '@angular/core'
import { Http, Request } from '@angular/http'
import { MetryResource } from './metry-resource'
import { makeUrl } from './util/make-url'
import { MetryAuth } from './auth'

@Injectable()
export class Metry {
  apiPath: string = 'api/v2'

  constructor (
    private http: Http,
    private auth: MetryAuth,
    @Inject('MetryBaseUrl') private baseUrl: string
  ) {}

  resource (resource: string): MetryResource {
    return new MetryResource(this, resource)
  }

  request (req: Request): Promise<any> {
    req.url = makeUrl([this.baseUrl, this.apiPath, req.url])

    return this.auth
      .authorize(req)
      .then((authorizedRequest: Request) => {
        return this.http
          .request(authorizedRequest)
          .toPromise()
          .then((res) => {
            return this.parseResponse(res.json())
          },
          (res) => {
            return this.handleError(res.json(), res.status)
          })
      })
  }

  parseResponse (res: any): any {
    if (!(res.data && 'count' in res && 'limit' in res && 'skip' in res)) {
      return res.data
    } else {
      return {
        data: res.data,
        pagination: {
          skip: res.skip,
          limit: res.limit,
          count: res.count,
          page: 1 + (res.skip / res.limit),
          from: (res.count === 0) ? 0 : res.skip + 1,
          to: (res.skip + res.limit > res.count) ? res.count : res.skip + res.limit
        }
      }
    }
  }

  handleError (res: any, status: number): Promise<any> {
    if (typeof res === 'object' && status === 401) {
      this.auth.privateToken = null
    }

    return (!res || status === 401)
      ? Promise.reject(res)
      : Promise.reject((res && res.data && res.data.errors) ? res.data.errors : res)
  }
}
