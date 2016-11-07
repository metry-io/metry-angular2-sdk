import { Metry } from '../src/metry'
import { MetrySDKModule } from '../src/index'
import { MockBackend } from '@angular/http/testing'
import { MetryAuth } from '../src/auth'
import { TestBed, inject, async } from '@angular/core/testing'
import { makeRequest, mockJSON, expectConnections } from './test-util'
import { Http, BaseRequestOptions, RequestMethod, Headers } from '@angular/http'

const BASE_URL = 'http://dummy.local'
const PRIVATE_TOKEN = 'dogmanstar'
const REFRESH_TOKEN = 'refresh1234567890'
const KEY_PRIVATE_TOKEN = 'mryPrivateToken'
const KEY_REFRESH_TOKEN = 'mryRefreshToken'
const KEY_ACCESS_TOKEN = 'mryAccessToken'
const API_VERSION = '/api/v2'
const HEADER_ORGANIZATION = 'X-Organization'
const HEADER_SUBACCOUNT= 'X-Subaccount'

const CLIENT_ID = 'testClientID'
const CLIENT_SECRET = 'testClientSecret'

const AUTH_CONFIG = {
  disabled: false,
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: 'http://dummier.local/path'
}

const DUMMY_DATA = {data: {_id: 'abc'}}

// As returned from API
const TOKEN_RESPONSE = {
  access_token: '130f6d30ef95d9c16a82d311fb32c852c8398cbb',
  expires_in: 3600,
  refresh_token: REFRESH_TOKEN,
  scope: 'basic',
  token_type: 'Bearer'
}

// As saved in localStorage
const ACCESS_TOKEN = JSON.stringify({
  access_token: '130f6d30ef95d9c16a82d311fb32c852c8398cbb',
  expires_at: 2146694400000,
  scope: 'basic',
  token_type: 'Bearer'
})

describe('Metry Auth', function () {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MetrySDKModule],
      providers: [
        MockBackend,
        BaseRequestOptions,
        {
          provide: Http,
          useFactory: (backend: MockBackend, options: BaseRequestOptions) => {
            return new Http(backend, options)
          },
          deps: [MockBackend, BaseRequestOptions]
        },
        MetryAuth,
        Metry,
        {
          provide: 'MetryBaseUrl',
          useValue: BASE_URL
        },
        {
          provide: 'MetryAuthConfig',
          useValue: AUTH_CONFIG
        }
      ]
    })

    window.localStorage.removeItem(KEY_PRIVATE_TOKEN)
    window.localStorage.removeItem(KEY_REFRESH_TOKEN)
    window.localStorage.removeItem(KEY_ACCESS_TOKEN)

    inject([MetryAuth], (auth: MetryAuth) => {
      auth.subaccount = null
      auth.organization = null
    })
  })


  it(
    'should accept a private api token',
    inject([MetryAuth], (auth: MetryAuth) => {
      auth.privateToken = PRIVATE_TOKEN
      expect(auth.privateToken).toEqual(PRIVATE_TOKEN)
    })
  )

  it(
    'should remove the private api token when set to null',
    inject([MetryAuth], (auth: MetryAuth) => {
      auth.privateToken = PRIVATE_TOKEN
      expect(auth.privateToken).toEqual(PRIVATE_TOKEN)
      auth.privateToken = null
      expect(auth.privateToken).toBe(null)
    })
  )

  it(
    'should accept a refresh token',
    inject([MetryAuth], (auth: MetryAuth) => {
      auth.refreshToken = REFRESH_TOKEN
      expect(auth.refreshToken).toEqual(REFRESH_TOKEN)
    })
  )

  it(
    'should remove a refresh token when set to null',
    inject([MetryAuth], (auth: MetryAuth) => {
      auth.refreshToken = REFRESH_TOKEN
      expect(auth.refreshToken).toEqual(REFRESH_TOKEN)
      auth.refreshToken = null
      expect(auth.refreshToken).toBe(null)
    })
  )

  it(
    'should store refresh tokens in localStorage',
    inject([MetryAuth], (auth: MetryAuth) => {
      auth.refreshToken = REFRESH_TOKEN
      expect(window.localStorage.getItem(KEY_REFRESH_TOKEN)).toEqual(REFRESH_TOKEN)
    })
  )

  it(
    'should use a refresh token stored in localStorage',
    inject([MetryAuth], (auth: MetryAuth) => {
      window.localStorage.setItem(KEY_REFRESH_TOKEN, REFRESH_TOKEN)
      expect(auth.refreshToken).toEqual(REFRESH_TOKEN)
    })
  )

  it(
    'should say it is not authenticated when it has no refresh or private token',
    inject([MetryAuth], (auth: MetryAuth) => {
      expect(auth.isAuthenticated()).toBe(false)
    })
  )

  it(
    'should say it is authenticated when it has a refresh token',
    inject([MetryAuth], (auth: MetryAuth) => {
      auth.refreshToken = REFRESH_TOKEN
      expect(auth.isAuthenticated()).toBe(true)
    })
  )

  it(
    'should say it is authenticated when it has a private token',
    inject([MetryAuth], (auth: MetryAuth) => {
      auth.privateToken = PRIVATE_TOKEN
      expect(auth.isAuthenticated()).toBe(true)
    })
  )

  it(
    'should request access tokens when perfoming an api request and no access token is available',
    async(
      inject([Metry, MetryAuth, MockBackend], (metry: Metry, auth: MetryAuth, mockBackend: MockBackend) => {
        const expectedConnections = [
          {
            method: RequestMethod.Post,
            url: `${BASE_URL}/oauth/token`,
            body: {
              client_id: CLIENT_ID,
              client_secret: CLIENT_SECRET,
              grant_type: 'refresh_token',
              scope: 'basic',
              refresh_token: REFRESH_TOKEN
            },
            respond: TOKEN_RESPONSE
          },
          {
            method: RequestMethod.Get,
            url: `${BASE_URL}${API_VERSION}/query`,
            respond: DUMMY_DATA
          }
        ]

        auth.refreshToken = REFRESH_TOKEN

        expectConnections(mockBackend.connections, expectedConnections)

        let request = makeRequest({url: '/query', method: 'GET'})
        metry.request(request)
      })
    )
  )

  it(
    'should queue multiple requests until token is fetched',
    async(
      inject([Metry, MetryAuth, MockBackend], (metry: Metry, auth: MetryAuth, mockBackend: MockBackend) => {
        auth.refreshToken = REFRESH_TOKEN

        const expectedConnections = [
          {
            method: RequestMethod.Post,
            url: `${BASE_URL}/oauth/token`,
            respond: TOKEN_RESPONSE
          },
          {
            method: RequestMethod.Get,
            url: `${BASE_URL}${API_VERSION}/collection1/abc`,
            respond: DUMMY_DATA
          },
          {
            method: RequestMethod.Get,
            url: `${BASE_URL}${API_VERSION}/collection2/abc`,
            respond: DUMMY_DATA
          }
        ]

        expectConnections(mockBackend.connections, expectedConnections)

        metry.resource('collection1').get('abc')
        metry.resource('collection2').get('abc')
      })
    )
  )

  it(
    'should reuse an existing valid access token',
    async(
      inject([Metry, MetryAuth, MockBackend], (metry: Metry, auth: MetryAuth, mockBackend: MockBackend) => {
        auth.refreshToken = REFRESH_TOKEN
        let accessToken = '130f6d30ef95d9c16a82d311fb32c852c8398cbb'

        setDefaultAccessToken()

        const expectedConnections = [
          {
            method: RequestMethod.Get,
            url: `${BASE_URL}${API_VERSION}/collection1/abc`,
            headers: {
              Authorization: `Bearer ${accessToken}`
            },
            respond: DUMMY_DATA
          }
        ]

        expectConnections(mockBackend.connections, expectedConnections)

        metry.resource('collection1').get('abc')
      })
    )
  )

  it(
    'should not use expired access tokens',
    async(
      inject([Metry, MetryAuth, MockBackend], (metry: Metry, auth: MetryAuth, mockBackend: MockBackend) => {
        auth.refreshToken = REFRESH_TOKEN

        let expiredToken = Object.assign(JSON.parse(ACCESS_TOKEN), {expires_at: 291443})
        window.localStorage.setItem(KEY_ACCESS_TOKEN, JSON.stringify(expiredToken))

        const expectedConnections = [
          {
            method: RequestMethod.Post,
            url: `${BASE_URL}/oauth/token`,
            respond: TOKEN_RESPONSE
          },
          {
            method: RequestMethod.Get,
            url: `${BASE_URL}${API_VERSION}/collection1/abc`,
            respond: DUMMY_DATA
          }
        ]

        expectConnections(mockBackend.connections, expectedConnections)

        metry.resource('collection1').get('abc')
      })
    )
  )

  it(
    'should remove access tokens when refresh token is set',
    inject([MetryAuth], (auth: MetryAuth) => {
      setDefaultAccessToken()

      auth.refreshToken = REFRESH_TOKEN

      expect(window.localStorage.getItem(KEY_ACCESS_TOKEN)).toBe(null)
    })
  )

  it(
    'should create an authorization url that contains redirect uri',
    inject([MetryAuth], (auth: MetryAuth) => {
      let authUrl = auth.authorizeUrl()
      expect(authUrl).toContain('redirect_uri=http%3A%2F%2Fdummier.local%2Fpath')
    })
  )

  it(
    'should create an authorization url that contains client id',
    inject([MetryAuth], (auth: MetryAuth) => {
      let authUrl = auth.authorizeUrl()
      expect(authUrl).toContain(`client_id=${CLIENT_ID}`)
    })
  )

  it(
    'should create an authorization url that contains client secret',
    inject([MetryAuth], (auth: MetryAuth) => {
      let authUrl = auth.authorizeUrl()
      expect(authUrl).toContain(`client_secret=${CLIENT_SECRET}`)
    })
  )

  it(
    'should fetch refresh token from authorization code',
    async(
      inject([Metry, MetryAuth, MockBackend], (metry: Metry, auth: MetryAuth, mockBackend: MockBackend) => {
        let code = 'auth_me_12345'
        let accessToken = 'access_12345'

        const expectedConnections = [
          {
            method: RequestMethod.Post,
            url: `${BASE_URL}/oauth/token`,
            body: {
              grant_type: 'authorization_code',
              code: code,
              client_id: CLIENT_ID,
              client_secret: CLIENT_SECRET,
              state: 'mryAuth',
              scope: 'basic',
              redirect_uri: AUTH_CONFIG.redirectUri
            },
            respond: {
              refresh_token: REFRESH_TOKEN,
              access_token: accessToken,
              expires_in: 3600,
              token_type: 'Bearer',
              scope: 'basic'
            }
          },
          {
            method: RequestMethod.Get,
            url: `${BASE_URL}${API_VERSION}/collection1/abc`,
            respond: DUMMY_DATA
          }
        ]

        expectConnections(mockBackend.connections, expectedConnections)

        auth
          .handleAuthCode(code)
          .then(() => {
            expect(auth.refreshToken).toBe(REFRESH_TOKEN)
          })
      })
    )
  )

  it(
    'should respect custom headers set',
    async(
      inject([Metry, MetryAuth, MockBackend], (metry: Metry, auth: MetryAuth, mockBackend: MockBackend) => {
        let request = makeRequest({headers: {CustomHeader: 'custom' }})

        auth.refreshToken = REFRESH_TOKEN
        setDefaultAccessToken()

        auth
          .authorize(request)
          .then((authorizedRequest) => {
            let header = authorizedRequest.headers.get('CustomHeader')
            expect(header).toBe('custom')
          })
      })
    )
  )

  it(
    'should add subaccount headers to requests',
    async(
      inject([Metry, MetryAuth, MockBackend], (metry: Metry, auth: MetryAuth, mockBackend: MockBackend) => {
        let subaccountId = 'abc123'
        let request = makeRequest({url: '/test'})

        auth.refreshToken = REFRESH_TOKEN
        auth.subaccount = subaccountId
        setDefaultAccessToken()

        auth
          .authorize(request)
          .then((authorizedRequest) => {
            let header = authorizedRequest.headers.get('X-Subaccount')
            expect(header).toBe(subaccountId)
          })
      })
    )
  )

  it(
    'should not use subaccounts when disableMetryHeaders flag is present',
    async(
      inject([Metry, MetryAuth, MockBackend], (metry: Metry, auth: MetryAuth, mockBackend: MockBackend) => {
        let subaccountId = 'abc123'
        let request = disabledHeadersRequest()

        auth.refreshToken = REFRESH_TOKEN
        auth.subaccount = subaccountId

        setDefaultAccessToken()

        auth
          .authorize(request)
          .then((authorizedRequest) => {
            let header = authorizedRequest.headers.get(HEADER_SUBACCOUNT)
            expect(header).toBe(null)
          })
      })
    )
  )

  it(
    'should not use organization when disableMetryHeaders flag is present',
    async(
      inject([Metry, MetryAuth, MockBackend], (metry: Metry, auth: MetryAuth, mockBackend: MockBackend) => {
        let subaccountId = 'abc123'
        let request = disabledHeadersRequest()

        auth.refreshToken = REFRESH_TOKEN
        auth.subaccount = subaccountId

        setDefaultAccessToken()

        auth
          .authorize(request)
          .then((authorizedRequest) => {
            let header = authorizedRequest.headers.get(HEADER_ORGANIZATION)
            expect(header).toBe(null)
          })
      })
    )
  )

  it(
    'should add organization headers to requests',
    async(
      inject([Metry, MetryAuth, MockBackend], (metry: Metry, auth: MetryAuth, mockBackend: MockBackend) => {
        let organizationId = 'abc123'
        let request = makeRequest({url: '/test'})

        auth.refreshToken = REFRESH_TOKEN
        auth.organization = organizationId

        setDefaultAccessToken()

        auth
          .authorize(request)
          .then((authorizedRequest) => {
            let header = authorizedRequest.headers.get(HEADER_ORGANIZATION)
            expect(header).toBe(organizationId)
          })
      })
    )
  )

  it(
    'should add both subaccount and organization headers to requests',
    async(
      inject([Metry, MetryAuth, MockBackend], (metry: Metry, auth: MetryAuth, mockBackend: MockBackend) => {
        let organizationId = 'abc123'
        let subaccountId = 'def456'
        let request = makeRequest({url: '/test'})

        auth.refreshToken = REFRESH_TOKEN
        auth.organization = organizationId
        auth.subaccount = subaccountId

        setDefaultAccessToken()

        auth
          .authorize(request)
          .then((authorizedRequest) => {
            let organizationHeader = authorizedRequest.headers.get(HEADER_ORGANIZATION)
            let subaccountHeader = authorizedRequest.headers.get(HEADER_SUBACCOUNT)
            expect(organizationHeader).toBe(organizationId)
            expect(subaccountHeader).toBe(subaccountId)
          })
      })
    )
  )
})

let disabledHeadersRequest = () => makeRequest({
  url: '/test',
  headers: new Headers({
    'X-Disable-Metry-Headers': 'true'
  })
})

let setDefaultAccessToken = () => {
  window.localStorage.setItem(KEY_ACCESS_TOKEN, ACCESS_TOKEN)
}
