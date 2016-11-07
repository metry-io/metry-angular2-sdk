import 'rxjs/add/operator/toPromise'
import { Inject, Injectable } from '@angular/core'
import { makeUrl } from './util/make-url'
import { Http, Request, Response } from '@angular/http'
import { storage } from './util/localstorage-wrapper'
import { isValidToken, subaccountHeader, organizationHeader } from './util/token-util'

const PATH_TOKEN = 'oauth/token'
const PATH_AUTHORIZE = 'oauth/authorize'
const KEY_PRIVATE_TOKEN = 'mryPrivateToken'
const KEY_REFRESH_TOKEN = 'mryRefreshToken'
const KEY_ACCESS_TOKEN = 'mryAccessToken'
const KEY_SUBACCOUNT = 'mrySubaccount'
const KEY_ORGANIZATION = 'mryOrganization'

export interface TokenRequestCallback {
  (token: string): void
}

export interface MetryAuthConfigOptions {
  disabled?: boolean
  clientId?: string
  clientSecret?: string
  redirectUri?: string,
  scope?: string
}

@Injectable()
export class MetryAuth {
  requestQueue: TokenRequestCallback[]
  fetchingAccessToken: boolean

  constructor (
    private http: Http,
    @Inject('MetryBaseUrl') private baseUrl: string,
    @Inject('MetryAuthConfig') private config: MetryAuthConfigOptions,
  ) {
    this.requestQueue = []
    this.fetchingAccessToken = false
  }

  // The URL the app should go to to get an auth code for a user
  authorizeUrl () {
    return makeUrl(
      [this.baseUrl, PATH_AUTHORIZE],
      {
        client_secret: this.config.clientSecret,
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code',
        response_type: 'code',
        state: 'mryAuth',
        scope: this.config.scope || 'basic'
      }
    )
  }

  // The app should call this method with the auth code recieved from Metry to
  // generate the refresh token
  handleAuthCode (code: string): Promise<void> {
    return this.http.post(
      makeUrl([this.baseUrl, PATH_TOKEN]),
      {
        grant_type: 'authorization_code',
        code: code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        state: 'mryAuth',
        scope: this.config.scope || 'basic',
        redirect_uri: this.config.redirectUri
      })
      .toPromise()
      .then((res: Response) => {
        const token = res.json()
        this.refreshToken = token ? token.refresh_token : null
        this.accessToken = token
      })
  }

  get privateToken (): string {
    return this.getToken(KEY_PRIVATE_TOKEN)
  }

  set privateToken (token: string|null) {
    this.setToken(token, KEY_PRIVATE_TOKEN)
  }

  get refreshToken (): string {
    return this.getToken(KEY_REFRESH_TOKEN)
  }

  get accessToken (): any {
    return this.getToken(KEY_ACCESS_TOKEN)
  }

  set accessToken (token: any) {
    if (token != null) {
      token.expires_at = Date.now() + token.expires_in * 1000
    }
    this.setToken(token, KEY_ACCESS_TOKEN)
  }

  get organization (): string {
    return this.getToken(KEY_ORGANIZATION)
  }

  set organization (org: string|null) {
    this.setToken(org, KEY_ORGANIZATION)
  }

  get subaccount (): string {
    return this.getToken(KEY_SUBACCOUNT)
  }

  set subaccount (account: string|null) {
    this.setToken(account, KEY_SUBACCOUNT)
  }

  set refreshToken (token: string|null) {
    this.setToken(token, KEY_REFRESH_TOKEN)
    this.accessToken = null
  }

  getToken (key: string) {
    var value = storage().getItem(key)
    if (value && (value.charAt(0) === '{' || value.charAt(0) === '[')) {
      return JSON.parse(value)
    }
    return value
  }

  setToken (token: any, key: string) {
    if (token) {
      var type = typeof token
      if (type !== 'string' && type !== 'number') {
        token = JSON.stringify(token)
      }
      storage().setItem(key, token)
    } else {
      storage().removeItem(key)
    }
  }

  isAuthenticated (): boolean {
    return (this.privateToken !== null || this.refreshToken !== null)
  }

  authorize (request: Request): Promise<Request> {
    return new Promise((resolve, reject) => {
      const headers = Object.assign(
        request.headers.toJSON(),
        this.accountHeaders(request)
      )

      Object.keys(headers)
        .forEach((key: string) => {
          if (headers.hasOwnProperty(key)) request.headers.append(key, headers[key])
        })

      // Check for private api token
      if (this.privateToken) {
        request.headers.append('Authorization', `OAuth ${this.privateToken}`)
        resolve(request)
        return
      }

      // Check if OAuth is disabled in config. In that case, browser needs to
      // manage the authentication using session cookies
      if (this.config.disabled) {
        resolve(request)
        return
      }

      // Check for OAuth refresh token
      if (!this.refreshToken) {
        reject('MetryAuth: Request authorization enabled, but no type of token was found')
        return
      }

      this.ensureAccessToken(this.refreshToken)
        .then(function (accessToken) {
          request.headers.append('Authorization', `Bearer ${accessToken.access_token}`)
          resolve(request)
        }, function () {
          reject('MetryAuth: Fetching access token failed')
        })
    })
  }

  ensureAccessToken (refreshToken: string): Promise<any> {
    return new Promise((resolve, reject) => {
      var accessToken = this.accessToken

      if (isValidToken(accessToken)) {
        resolve(accessToken)
      } else {
        this.requestQueue.push((newAccessToken) => {
          if (newAccessToken) {
            resolve(newAccessToken)
          } else {
            reject()
          }
        })

        this.fetchAccessTokenIfNeeded(refreshToken)
      }
    })
  }

  fetchAccessTokenIfNeeded (refreshToken: string): void {
    if (this.fetchingAccessToken) return

    this.fetchingAccessToken = true

    this.fetchAccessToken(refreshToken)
      .then(() => {
        this.fetchingAccessToken = false
        this.processRequestQueue()
      })
  }

  processRequestQueue (): void {
    this.requestQueue
      .forEach((queueFunc: TokenRequestCallback) => {
        queueFunc(this.accessToken)
      })

    // Clear queue
    this.requestQueue = []
  }

  fetchAccessToken (refreshToken: string): Promise<void> {
    return this.http.post(
      makeUrl([this.baseUrl, PATH_TOKEN]),
      {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
        scope: this.config.scope || 'basic',
        refresh_token: refreshToken
      }
    )
    .toPromise()
    .then((res: Response) => {
      return res.json()
    }, () => {
      return Promise.resolve(null)
    })
    .then((token: any) => {
      this.accessToken = token
    })
  }

  accountHeaders (request: Request): Object {
    return request.headers.get('X-Disable-Metry-Headers')
      ? {}
      : Object.assign(
        subaccountHeader(this.subaccount),
        organizationHeader(this.organization)
      )
  }
}
