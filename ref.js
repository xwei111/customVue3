// 若为对象走reactive
const convert = val => isObject(val) ? reactive(val) : val

function trackRefValue(ref) {
  if(isTracking()) {
    ref = toRaw(ref)
    if(!ref.dep) {
      ref.dep = createDep()
    }
    trackEffects(ref.dep)
  }
}

function triggerRefValue(ref) {
  ref = toRaw(ref)
  if(ref.dep) triggerEffects(ref.dep)
}

class RefImpl {
  constructor(value, shallow) {
    this.__v_isRef = true
    this._rawValue = shallow ? value : toRaw(value)
    this._value = shallow ? value : convert(value)
    this._shallow = shallow
  }

  get value() {
    trackRefValue(this)
    return this._value
  }

  set value(newValue) {
    newValue = this._shallow ? newValue : toRaw(newValue)
    if(hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue;
      this._value = this._shallow ? newValue : convert(newValue)
      triggerRefValue(this)
    }
  }
}

class ObjectRefImpl {
  constructor(_object, _key) {
    this.__v_isRef = true
    this._object = _object
    this._key = _key
  }
  get value() {
    // 获取reactive值
    return this._object[this._key]
  }
  set value(newVal) {
    // 设置reactive值
    this._object[this._key] = newVal
  }
}

class CustomRefImpl {
  constructor(factory) {
    const { get, set } = factory(
      () => trackRefValue(this),
      () => triggerRefValue(this)
    )
    this._get = get
    this._set = set
  }

  get value() {
    return this._get()
  }
  
  set value(newValue) {
    this._set(newValue)
  }
}

function createRef(value, shallow) {
  if(isRef(value)) return value
  return new RefImpl(value, shallow);
}

function ref(value) {
  return createRef(value, false)
}

function isRef(r) {
  return r && r.__v_isRef === true
}

function unref(ref) {
  return isRef(ref) ? ref.value : ref
}

function toRef(target, key) {
  const value = target[key]
  return isRef(value) ? value : new ObjectRefImpl(target, key)
}

function toRefs(object) {
  if (!isProxy(object)) {
    console.warn(`toRefs() expects a reactive object but received a plain one.`)
  }
  const ret = isArray(object) ? new Array(object.length) : {}
  for (const key in object) {
    ret[key] = toRef(object, key)
  }
  return ret
}

function customRef(factory) {
  return new CustomRefImpl(factory)
}

function shallowRef(value) {
  return createRef(value, true)
}

