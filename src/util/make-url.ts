 export function makeUrl (components: string|Array<string>, params?: Object) {
  components = !Array.isArray(components) ? [components] : components
  params = params || {}

  return [
    components
      .filter(function (c: any) {
        return c != null
      })
      .map(function (c: string) {
        return c.replace(/^\/|\/$/, '')
      })
      .join('/'),
      Object.keys(params).map(function (k) {
        return k + '=' + encodeURIComponent(params[k])
      })
      .join('&')
  ]
  .filter(function (c) {
    return c.length > 0
  })
  .join('?')
}
