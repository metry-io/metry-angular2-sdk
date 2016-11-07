let _data = {};
let _tempStorage;
const hasLocalStorage = (function () {
    try {
        if ('localStorage' in window) {
            window.localStorage.setItem('test', '1');
            window.localStorage.removeItem('test');
            return true;
        }
    }
    catch (exception) { }
    _tempStorage = {
        setItem: function (key, value) { _data[key] = value; },
        removeItem: function (key) { _data[key] = undefined; },
        getItem: function (key) { return _data[key]; }
    };
    return false;
})();
export function storage() {
    return hasLocalStorage ? window.localStorage : _tempStorage;
}
