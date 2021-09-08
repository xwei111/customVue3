const isObject = (val) => {
  return val !== null && typeof val === "object";
};

const def = (obj, key, value) => {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    value
  })
}

const objectToString = Object.prototype.toString

const toTypeString = (value) => objectToString.call(value)

const toRawType = (value) => toTypeString(value).slice(8, -1)

const hasChanged = (value, oldValue) => !Object.is(value, oldValue)

const isArray = Array.isArray

const hasOwnProperty = Object.prototype.hasOwnProperty

const hasOwn = (val, key) => hasOwnProperty.call(val, key)

const extend = Object.assign

const isFunction = val => typeof val === 'function'

const NOOP = () => {}
