import { ResponseOptions, Response, Request, RequestOptions } from '@angular/http'
import { MockConnection } from '@angular/http/testing'

let mockJSON = (data: Object) => new Response(new ResponseOptions({body: JSON.stringify(data)}))
let makeRequest = (data: Object) => new Request(new RequestOptions(data))

let expectConnections = (connections: any, expectations: Array<any>) => {
  let connectionCount = 0

  connections.subscribe((connection: MockConnection) => {
    let expected = expectations[connectionCount]

    if (expected.method != null) {
      expect(connection.request.method).toEqual(expected.method)
    }

    if (expected.url != null) {
      expect(connection.request.url).toEqual(expected.url)
    }

    if (expected.body != null) {
      expect(JSON.parse(connection.request.getBody())).toEqual(expected.body)
    }

    if (expected.headers != null) {
      Object.keys(expected.headers).forEach((key: string) => {
        expect(connection.request.headers.get(key)).toEqual(expected.headers[key])
      })
    }

    connectionCount++

    return connection.mockRespond(mockJSON(expectations[connectionCount - 1].respond))
  })
}

export { mockJSON, makeRequest, expectConnections }
