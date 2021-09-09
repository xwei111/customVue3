
class ComputedRefImpl{

  dep = undefined
  _value = null
  _dirty = true
  effect = null
  __v_isRef = true
  __v_isReadonly = false

  constructor(getter, _setter, isReadonly = false) {
    this.effect = new ReactiveEffect(getter, () => {
      if(!this._dirty) {
        this._dirty = true
      }
    })
    this._setter = _setter
    this.__v_isReadonly = isReadonly
  }

  get value() {
    const self = toRaw(this)
    trackRefValue(self)
    if (self._dirty) {
      self._dirty = false
      self._value = self.effect.run()
    }
    return self._value
  }

  set value(newValue) {
    this._setter(newValue)
  }
}

// getterOrOptions: Function | { get: Function, set: Function }
function computed(getterOrOptions) {
  let getter
  let setter

  if(isFunction(getterOrOptions)) {
    getter = getterOrOptions
    setter = NOOP
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  const cRef = new ComputedRefImpl(
    getter,
    setter,
    isFunction(getterOrOptions) || !getterOrOptions.set
  )

  return cRef

}