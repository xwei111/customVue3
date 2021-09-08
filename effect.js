const targetMap = new WeakMap()

let activeEffect

const createDep = (effects) => {
  const dep = new Set(effects)
  return dep
}
// ---------------------- effect ----------------------
class ReactiveEffect {
  active = true
  deps = []

  constructor(fn, scheduler) {
    this.fn = fn
    this.scheduler = scheduler
  }

  run() {
    activeEffect = this
    return this.fn()
  }

  stop() {
    if(this.active) {
      cleanupEffect(this)
      this.active = false
    }
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep) => dep.delete(effect))
  effect.deps.length = 0
}

function effect(fn, options = {}) {
  const _effect = new ReactiveEffect(fn)
  if(options) extend(_effect, options)
  _effect.run()

  const runner = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}

function stop(runner) {
  runner.effect.stop();
}
// ---------------------- effect ----------------------

// ---------------------- get收集依赖 ------------------------------
function track(target, type, key) {
  if (!isTracking()) return
  // 是否有缓存
  let depsMap = targetMap.get(target)
  // 无缓存存储，初始化为map
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  // 获取当前属性是否有缓存
  let dep = depsMap.get(key)
  // 无缓存存储，初始化为set
  if(!dep) {
    depsMap.set(key, (dep = createDep()))
  }
  trackEffects(dep);
}

function trackEffects(dep) {
  // 是否存在
  let shouldTrack = !dep.has(activeEffect)
  // 不存在收集依赖
  if(shouldTrack) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}
// ---------------------- get收集依赖 ------------------------------

// ---------------------- set触发依赖 ------------------------------
function trigger(
  target,
  type,
  key,
  newValue,
  oldValue
) {
  // 获取缓存
  const depsMap = targetMap.get(target)
  // 无缓存表示从来没有触发过track，直接return
  if (!depsMap) return

  let deps = [];
  
  if (key !== void 0) deps.push(depsMap.get(key))
  const effects = []
  // 取出set数据
  for (const dep of deps) {
    if (dep) {
      effects.push(...dep)
    }
  }
  triggerEffects(createDep(effects))
}

function triggerEffects(dep) {
  for (const effect of isArray(dep) ? dep : [...dep]) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}
// ---------------------- set触发依赖 ------------------------------

// ---------------------- isTracking ----------------------
function isTracking() {
  return activeEffect !== undefined
}
// ---------------------- isTracking ----------------------
