const EMPTY_OBJ = {}
const INITIAL_WATCHER_VALUE = {}

function callWithErrorHandling(fn, args) {
  const res = args ? fn(...args) : fn()
  return res
}

function callWithAsyncErrorHandling(fn, args) {
  const res = callWithErrorHandling(fn, args)
  return res
}

function watchEffect(effect, options) {
  return doWatch(effect, null, options)
}

function watch(source, cb, options) {
  if (!isFunction(cb)) {
    warn(
      `\`watch(fn, options?)\` signature has been moved to a separate API. ` +
        `Use \`watchEffect(fn, options?)\` instead. \`watch\` now only ` +
        `supports \`watch(source, cb, options?) signature.`
    )
  }
  return doWatch(source, cb, options)
}

function doWatch(
  source,
  cb,
  { immediate, deep, flush, onTrack, onTrigger } = EMPTY_OBJ
) {
  let getter

  if(isRef(source)) {
    getter = () => source.value
  } else if (isReactive(source)) {
    getter = () => source
  } else if (isFunction(source)) {
    if(cb) {
      // watch
      getter = () => callWithErrorHandling(source)
    } else {
      // 非watch
      getter = () => {
        // cleanup存在执行清除副作用函数
        cleanup && cleanup()
        // 注册onInvalidate
        return callWithAsyncErrorHandling(source, [onInvalidate])
      }
    }
  } else {
    getter = NOOP
    warn(
      `Invalid watch source: `,
      source,
      `A watch source can only be a getter/effect function, a ref, ` +
        `a reactive object, or an array of these types.`
    )
  }

  let cleanup
  let onInvalidate = (fn) => {
    // 指定cleanup
    // 侦听器被停止时清除副作用
    cleanup = effect.onStop = () => callWithErrorHandling(fn)
  }

  let oldValue = INITIAL_WATCHER_VALUE

  const job = () => {
    if (!effect.active) {
      return
    }
    if(cb) {
      const newValue = effect.run()
      // 副作用即将重新执行时清除副作用
      cleanup && cleanup()
      callWithAsyncErrorHandling(cb, [
        newValue,
        oldValue,
        onInvalidate
      ])
      oldValue = newValue
    } else {
      effect.run()
    }
  }

  let scheduler = () => job()

  const effect = new ReactiveEffect(getter, scheduler)

  if(cb) {
    oldValue = effect.run()
  } else {
    effect.run()
  }

  return () => {
    // 手动清除时同时会触发副作用的清除 => effect.onStop
    effect.stop()
  }
}