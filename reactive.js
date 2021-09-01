const IS_REACTIVE = "__v_isReactive"
const IS_READONLY = "__v_isReadonly"
const RAW = '__v_raw'
const SKIP = '__v_skip'

const TargetType = {
  INVALID: 0,
  COMMON: 1,
  COLLECTION: 2
}

const reactiveMap = new WeakMap()
const readonlyMap = new WeakMap()
const shallowReadonlyMap = new WeakMap()
const shallowReactiveMap = new WeakMap()

function targetTypeMap(rawType) {
  switch (rawType) {
    case 'Object':
    case 'Map':
    case 'Set':
    case 'WeakMap':
    default:
      return TargetType.INVALID
  }
}

function getTargetType(value) {
  return value[SKIP] || !Object.isExtensible(value)
    ? TargetType.INVALID
    : targetTypeMap(toRawType(value))
}

function createGetter(isReadOnly = false, shallow = false) {
  return function get(target, key, receiver) {
    // 判断是否为reactive
    if(key === IS_REACTIVE) return !isReadOnly
    // 判断是否为readonly
    else if(key === IS_READONLY) return isReadOnly
    // toRaw操作判断
    else if(
      key === RAW &&
      receiver === 
        (
          isReadOnly
            ? shallow
              ? shallowReadonlyMap
              : readonlyMap
            : shallow
              ? shallowReactiveMap
              : reactiveMap
        ).get(target)
    ) return target

    const result = Reflect.get(target, key, receiver)
    // shallow是否为true，若为true不在进行深度处理
    if (shallow) return result
    // 若为对象，深度处理
    if(isObject(result)) return isReadOnly ? readonly(result) : reactive(result)
    
    return result
  }
}

function createSetter() {
  return function set(target, key, value, receiver) {
    console.log(`${key}发生了改变`)
    const result = Reflect.set(target, key, value, receiver)
    return result
  }
}

function deleteProperty(target, key) {
  const result = Reflect.deleteProperty(target, key)
  return result
}

const get = createGetter();
const set = createSetter();

const mutableHandlers = {
  get,
  set,
  deleteProperty
}

const readonlyHandlers = {
  get: createGetter(true),
  set: (target, key) => {
    console.warn(
      `Set operation on key "${String(key)}" failed: target is readonly.`,
      target
    );
    return true
  },
  deleteProperty(target, key) {
    if (__DEV__) {
      console.warn(
        `Delete operation on key "${String(key)}" failed: target is readonly.`,
        target
      )
    }
    return true
  }
}

const shallowReadonlyHandlers = {
  get: createGetter(true, true),
  set(target, key) {
    // readonly 的响应式对象不可以修改值
    console.warn(
      `Set operation on key "${String(key)}" failed: target is readonly.`,
      target
    );
    return true;
  },
};

const shallowReactiveHandlers = {
  get: createGetter(false, true),
  set
}

function reactive(target) {
  return createReactiveObject(target, reactiveMap, mutableHandlers)
}

function readonly(target) {
  return createReactiveObject(target, readonlyMap, readonlyHandlers)
}

function shallowReadonly(target) {
  return createReactiveObject(target, shallowReadonlyMap, shallowReadonlyHandlers)
}

function shallowReactive(target) {
  return createReactiveObject(target, shallowReactiveMap, shallowReactiveHandlers)
}

function isReactive(value) {
  return !!value[IS_REACTIVE]
}

function isReadonly(value) {
  return !!value[IS_READONLY]
}

function isProxy(value) {
  return isReactive(value) || isReadonly(value)
}

function toRaw(value) {
  const raw = value[RAW]
  return raw ? toRaw(raw) : value
}

function markRaw(value) {
  def(value, SKIP, true)
  return value
}

function createReactiveObject(target, proxyMap, baseHandlers) {
  // 非对象return
  if (!isObject(target)) {
    return target
  }
  // 是否已存在
  const existingProxy = proxyMap.get(target)
  // 存在返回
  if(existingProxy) return existingProxy
  // 判断类型
  const targetType = getTargetType(target)
  if (targetType === TargetType.INVALID) return target
  // 通过proxy生成新对象
  const proxy = new Proxy(target, baseHandlers)
  // 缓存数据
  proxyMap.set(target, proxy)

  return proxy
}



