/* globals it, describe, expect, beforeEach, afterEach, inject, angular */

import { Metry } from '../src/metry'
import { MetrySDKModule } from '../src/index'
import { URLSearchParams } from '@angular/http'
import { MockBackend } from '@angular/http/testing'
import { MetryAuth } from '../src/auth'
import { TestBed, inject, async } from '@angular/core/testing'
import { makeRequest, mockJSON, expectConnections } from './test-util'
import { Http, BaseRequestOptions, RequestMethod, RequestOptions, Headers } from '@angular/http'

const BASE_URL = 'http://dummy.local'
const API_VERSION = '/api/v2'

describe('Metry Resource', () => {
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
          useValue: {disabled: true}
        }
      ]
    })
  })

  it(
    'should create services with the all request methods',
    inject([Metry], (metry: Metry) => {
      let resource = metry.resource('test')

      expect(resource.get).toBeDefined()
      expect(resource.save).toBeDefined()
      expect(resource.query).toBeDefined()
      expect(resource.delete).toBeDefined()
      expect(resource.batch).toBeDefined()
      expect(resource.of).toBeDefined()
      expect(resource.action).toBeDefined()
    })
  )

  it(
    'should GET a resource with id from the api',
    async(
      inject([Metry, MockBackend], (metry: Metry, mockBackend: MockBackend) => {
        let testId = '67890'

        let expectedConnections = [
          {
            url: `${BASE_URL}${API_VERSION}/tests/${testId}`,
            method: RequestMethod.Get,
            respond: {data: {_id: testId}}
          }
        ]

        expectConnections(mockBackend.connections, expectedConnections)

        metry
          .resource('tests')
          .get(testId)
      })
    )
  )

  it(
    'should query the api with the endpoint of a given collection',
    async(
      inject([Metry, MockBackend], (metry: Metry, mockBackend: MockBackend) => {
        let expectedConnections = [
          {
            url: `${BASE_URL}${API_VERSION}/tests`,
            method: RequestMethod.Get,
            respond: {data: [{_id: 'abc123'}], count: 1, skip: 0, limit: 50}
          }
        ]

        expectConnections(mockBackend.connections, expectedConnections)

        metry
          .resource('tests')
          .query()
      })
    )
  )

  it(
    'should query the api with the provided parameters',
    async(
      inject([Metry, MockBackend], (metry: Metry, mockBackend: MockBackend) => {
        let expectedConnections = [
          {
            url: `${BASE_URL}${API_VERSION}/tests?holder=me&running=true`,
            method: RequestMethod.Get,
            respond: {data: [{_id: 'abc123'}], count: 1, skip: 0, limit: 50}
          }
        ]

        expectConnections(mockBackend.connections, expectedConnections)

        metry
          .resource('tests')
          .query({
            holder: 'me',
            running: 'true'
          })
      })
    )
  )

  it(
    'should POST a new resource to the api when saving',
    async(
      inject([Metry, MockBackend], (metry: Metry, mockBackend: MockBackend) => {
        let test = {
          name: 'Passing test'
        }

        let expectedConnections = [
          {
            url: `${BASE_URL}${API_VERSION}/tests`,
            method: RequestMethod.Post,
            body: test,
            respond: {data: Object.assign({_id: 'abc123'}, test)}
          }
        ]

        expectConnections(mockBackend.connections, expectedConnections)

        metry
          .resource('tests')
          .save(test)
      })
    )
  )

  it(
    'should PUT a resource with id to the api when saving',
    async(
      inject([Metry, MockBackend], (metry: Metry, mockBackend: MockBackend) => {
        let test = {
          _id: 'abc123',
          name: 'It\'s passing again!'
        }

        let expectedConnections = [
          {
            url: `${BASE_URL}${API_VERSION}/tests/${test._id}`,
            method: RequestMethod.Put,
            body: {name: 'It\'s passing again!'},
            respond: {data: test}
          }
        ]

        expectConnections(mockBackend.connections, expectedConnections)

        metry
          .resource('tests')
          .save(test)
      })
    )
  )

  it(
    'should not alter the PUT object when saving',
    async(
      inject([Metry, MockBackend], (metry: Metry, mockBackend: MockBackend) => {
        let test = {
          _id: 'abc123',
          name: 'Always passing'
        }

        let expectedConnections = [
          {
            url: `${BASE_URL}${API_VERSION}/tests/${test._id}`,
            method: RequestMethod.Put,
            body: {name: 'Always passing'},
            respond: {data: test}
          }
        ]

        expectConnections(mockBackend.connections, expectedConnections)

        metry
          .resource('tests')
          .save(test)
          .then(() => {
            expect(test._id).toEqual('abc123')
            expect(test.name).toEqual('Always passing')
          })
      })
    )
  )

  it(
    'should DELETE a resource with id from the api',
    async(
      inject([Metry, MockBackend], (metry: Metry, mockBackend: MockBackend) => {
        let testId = 'abc123'

        let expectedConnections = [
          {
            url: `${BASE_URL}${API_VERSION}/tests/${testId}`,
            method: RequestMethod.Delete,
            respond: {success: true}
          }
        ]

        expectConnections(mockBackend.connections, expectedConnections)

        metry
          .resource('tests')
          .delete(testId)
      })
    )
  )

  it(
    'should run an action for a resource with PUT as default',
    async(
      inject([Metry, MockBackend], (metry: Metry, mockBackend: MockBackend) => {
        let testId = 'abc123'
        let action = 'postpone'

        let expectedConnections = [
          {
            url: `${BASE_URL}${API_VERSION}/tests/${testId}/${action}`,
            method: RequestMethod.Put,
            respond: {success: true}
          }
        ]

        expectConnections(mockBackend.connections, expectedConnections)

        metry
          .resource('tests')
          .action(action, testId)
      })
    )
  )

  it(
    'should run batch update for a resource with PUT as default',
    async(
      inject([Metry, MockBackend], (metry: Metry, mockBackend: MockBackend) => {
        let testIds = ['abc123', 'def456']
        let batchData = {postponed: true}
        let batchAction = 'groupupdate'

        let expectedConnections = [
          {
            url: `${BASE_URL}${API_VERSION}/tests/${batchAction}`,
            method: RequestMethod.Put,
            body: testIds.map((id) => Object.assign({_id: id}, batchData)),
            respond: {success: true}
          }
        ]

        expectConnections(mockBackend.connections, expectedConnections)

        metry
          .resource('tests')
          .batch(batchAction, testIds, batchData)
      })
    )
  )

  it(
    'should create a child collection for a collection using of method',
    async(
      inject([Metry, MockBackend], (metry: Metry, mockBackend: MockBackend) => {
        let testId = '67890'

        let expectedConnections = [
          {
            url: `${BASE_URL}${API_VERSION}/testers/tests/${testId}`,
            method: RequestMethod.Get,
            respond: {data: {_id: testId, passed: true}}
          }
        ]

        expectConnections(mockBackend.connections, expectedConnections)

        metry
          .resource('tests')
          .of('testers')
          .get(testId)
      })
    )
  )

  it(
    'should use override config options',
    async(
      inject([Metry, MockBackend], (metry: Metry, mockBackend: MockBackend) => {
        let testId = '67890'

        let expectedConnections = [
          {
            url: `${BASE_URL}${API_VERSION}/tests/${testId}`,
            method: RequestMethod.Post,
            respond: {success: true}
          }
        ]

        expectConnections(mockBackend.connections, expectedConnections)

        metry.resource('tests')
          .get(testId, new RequestOptions({method: 'POST'}))
      })
    )
  )

  it(
    'should assume electricity metric unless specified',
    async(
      inject([Metry, MockBackend], (metry: Metry, mockBackend: MockBackend) => {
        let testId = '67890'
        let granularity = 'day'
        let range = '20150101'

        let expectedConnections = [
          {
            url: `${BASE_URL}${API_VERSION}/consumptions/${testId}/${granularity}/${range}?metrics=energy`,
            method: RequestMethod.Get,
            respond: {success: true}
          }
        ]

        expectConnections(mockBackend.connections, expectedConnections)

        metry.resource('consumptions')
          .getData(testId, granularity, range)
      })
    )
  )

  it(
    'should respect the provided metrics',
    async(
      inject([Metry, MockBackend], (metry: Metry, mockBackend: MockBackend) => {
        let testId = '67890'
        let granularity = 'day'
        let range = '20150101'
        let metric = 'flow'

        let expectedConnections = [
          {
            url: `${BASE_URL}${API_VERSION}/consumptions/${testId}/${granularity}/${range}?metrics=${metric}`,
            method: RequestMethod.Get,
            respond: {success: true}
          }
        ]

        expectConnections(mockBackend.connections, expectedConnections)

        metry.resource('consumptions')
          .getData(testId, granularity, range, metric)
      })
    )
  )

  it(
    'should allow fetching multiple metrics',
    async(
      inject([Metry, MockBackend], (metry: Metry, mockBackend: MockBackend) => {
        let testId = '67890'
        let granularity = 'day'
        let range = '20150101'
        let metrics = ['flow', 'energy']

        let expectedConnections = [
          {
            url: `${BASE_URL}${API_VERSION}/consumptions/${testId}/${granularity}/${range}?metrics=${metrics.join(',')}`,
            method: RequestMethod.Get,
            respond: {success: true}
          }
        ]

        expectConnections(mockBackend.connections, expectedConnections)

        metry.resource('consumptions')
          .getData(testId, granularity, range, metrics)
      })
    )
  )

  it(
    'should allow extra params along with metrics',
    async(
      inject([Metry, MockBackend], (metry: Metry, mockBackend: MockBackend) => {
        let meterIds = '67890,12345,abcde,fghij'
        let granularity = 'day'
        let range = '20150101'
        let metric = 'energy'
        let extraParams = new URLSearchParams()

        extraParams.set('meters', meterIds)

        let expectedConnections = [
          {
            url: `${BASE_URL}${API_VERSION}/consumptions/sum/${granularity}/${range}?metrics=${metric}&meters=${meterIds}`,
            method: RequestMethod.Get,
            respond: {success: true}
          }
        ]

        expectConnections(mockBackend.connections, expectedConnections)

        metry.resource('consumptions')
          .getData('sum', granularity, range, metric, extraParams)
      })
    )
  )

  it(
    'should allow fetching of readings (no granularity needed)',
    async(
      inject([Metry, MockBackend], (metry: Metry, mockBackend: MockBackend) => {
        let meterId = '12345'
        let range = '201501'
        let metrics = 'flow'

        let expectedConnections = [
          {
            url: `${BASE_URL}${API_VERSION}/readings/${meterId}/${range}?metrics=${metrics}`,
            method: RequestMethod.Get,
            respond: {success: true}
          }
        ]

        expectConnections(mockBackend.connections, expectedConnections)

        metry.resource('readings')
          .getData(meterId, null, range, metrics)
      })
    )
  )
})
