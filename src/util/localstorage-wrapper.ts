export interface WrappedStorage {
  setItem: (key: string, value?: any) => void
  removeItem: (key: string) => void
  getItem: (key: string) => any
}

let _data = {}
let _tempStorage: WrappedStorage

const hasLocalStorage = (function () {
  try {
    if ('localStorage' in window) {
      window.localStorage.setItem('test', '1')
      window.localStorage.removeItem('test')
      return true
    }
  } catch (exception) {}

  _tempStorage = {
    setItem: function (key: string, value?: any) { _data[key] = value },
    removeItem: function (key: string) { _data[key] = undefined },
    getItem: function (key: string) { return _data[key] }
  }

  return false
})()

export function storage (): WrappedStorage {
  return hasLocalStorage ? <WrappedStorage>window.localStorage : _tempStorage
}
