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
      // 执行watch处的onStop，清除副作用
      if (this.onStop) {
        this.onStop()
      }
      this.active = false
    }
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep) => dep.delete(effect))
  effect.deps.length = 0
}

function effect(fn, options) {
  if(fn.effect) fn = fn.effect.fn
  const _effect = new ReactiveEffect(fn)
  // 存在添加属性，如若存在自定义scheduler，则添加scheduler
  if(options) extend(_effect, options)
  // 初始化执行
  _effect.run()
  // 返回run，使用者在合适时机可以自行调用，并将当前effct绑定在runner上
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
    // 存储，呼应上述的判断
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}
// ---------------------- get收集依赖 ------------------------------

// ---------------------- set触发依赖 ------------------------------
function trigger(
  target,
  key
) {
  // 获取缓存
  const depsMap = targetMap.get(target)
  // 无缓存表示从来没有触发过track，直接return
  if (!depsMap) return
  
  let deps = [];
  // void 0代替undefined能够减少3个字节，占用空间更小，另一个原因是防止被重写
  if (key !== void 0) deps.push(depsMap.get(key))
  const effects = []
  // 取出set数据
  for (const dep of deps) {
    if (dep) {
      effects.push(...dep)
    }
  }
  // 为了triggerEffects方法的通用性
  triggerEffects(createDep(effects))
}

function triggerEffects(dep) {
  for (const effect of isArray(dep) ? dep : [...dep]) {
    // 存在自定义scheduler则执行，否则执行默认fn
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
