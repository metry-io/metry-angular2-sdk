/* globals it, describe, expect, beforeEach, afterEach, inject, angular */
import { Metry } from '../src/metry'
import { MetrySDKModule } from '../src/index'
import { MockBackend, MockConnection } from '@angular/http/testing'
import { MetryAuth } from '../src/auth'
import { TestBed, inject, async } from '@angular/core/testing'
import { makeRequest, mockJSON } from './test-util'

import {
  Http,
  BaseRequestOptions,
  Response,
  ResponseOptions
} from '@angular/http'

const BASE_URL = 'http://dummy.local'
const PRIVATE_TOKEN = 'dogmanstar'

describe('Metry SDK', function () {
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
          useValue: {disabled: false}
        }
      ]
    })

    window.localStorage.removeItem('mryPrivateToken')
    window.localStorage.removeItem('mryRefreshToken')
    window.localStorage.removeItem('mryAccessToken')
  })

  it(
    'should paginate list results',
    async(
      inject([Metry, MetryAuth, MockBackend], (metry: Metry, auth: MetryAuth, mockBackend: MockBackend) => {
        const MOCK_RESPONSE = {
          data: [{_id: '1234'}, {_id: '5678'}],
          count: 200,
          skip: 0,
          limit: 50
        }

        auth.config.disabled = true

        mockBackend.connections.subscribe((connection: MockConnection) => {
          return connection.mockRespond(mockJSON(MOCK_RESPONSE))
        })

        let request = makeRequest({url: '/query', method: 'GET'})
        let requestPromise = metry.request(request)

        requestPromise.then((res: any) => {
          expect(res.data).toBeDefined()
          expect(res.data.length).toBe(2)
          expect(res.pagination.page).toBe(1)
          expect(res.pagination.from).toBe(1)
          expect(res.pagination.to).toBe(50)
        }, (err) => {
          throw new Error(err)
        })
      })
    )
  )

  it(
    'should not paginate single items',
    async(
      inject([Metry, MetryAuth, MockBackend], (metry: Metry, auth: MetryAuth, mockBackend: MockBackend) => {
        const MOCK_RESPONSE = {
          data: {
            _id: 'abcde',
            redundant_field: {
              _id: 'abd325',
              unsynced_value: 'Fortum'
            }
          }
        }

        auth.config.disabled = true

        mockBackend.connections.subscribe((connection: MockConnection) => {
          return connection.mockRespond(mockJSON(MOCK_RESPONSE))
        })

        let request = makeRequest({url: '/item', method: 'GET'})
        let requestPromise = metry.request(request)

        requestPromise
          .then((item) => {
            expect(item._id).toBe('abcde')
            expect(item.redundant_field._id).toBe('abd325')
            expect(item.pagination).toBeUndefined()
          }, (err) => {
            throw new Error(err)
          })
      })
    )
  )

  it(
    'should attach private token',
    async(
      inject([Metry, MetryAuth, MockBackend], (metry: Metry, auth: MetryAuth, mockBackend: MockBackend) => {

        auth.privateToken = PRIVATE_TOKEN

        mockBackend.connections.subscribe((connection: MockConnection) => {
          let headers = connection.request.headers

          if (!(headers.get('Authorization') === `OAuth ${PRIVATE_TOKEN}`)) {
            throw new Error('No authorization header set')
          } else {
            connection.mockRespond(mockJSON({success: true}))
          }
        })

        let request = makeRequest({url: '/item', method: 'GET'})
        let requestPromise = metry.request(request)
      })
    )
  )

  it(
    'should remove private token on auth error',
    async(
      inject([Metry, MetryAuth, MockBackend], (metry: Metry, auth: MetryAuth, mockBackend: MockBackend) => {
        auth.privateToken = PRIVATE_TOKEN

        class MockError extends Response implements Error {
          name: any
          message: any
        }

        mockBackend.connections.subscribe((connection: MockConnection) => {
          connection.mockError(new MockError(new ResponseOptions({
            status: 401,
            body: JSON.stringify({error: true})
          })))
        })

        let request = makeRequest({url: '/item', method: 'GET'})
        let requestPromise = metry.request(request)

        requestPromise
          .then((res) => {
            throw new Error('Request should fail. Test is not working as intended')
          }, (err) => {
            expect(auth.privateToken).toBe(null)
          })
      })
    )
  )
})

