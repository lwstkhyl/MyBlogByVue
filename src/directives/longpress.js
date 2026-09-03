export const longpress = {
    bind: function (el, binding) {
        if (typeof binding.value !== 'function') {
            throw 'callback must be a function'
        }
        el.$longpressValue = binding.value
        let pressTimer = null
        const start = (e) => {
            if (e.type === 'click' && e.button !== 0) {
                return
            }
            if (pressTimer === null) {
                pressTimer = setTimeout(() => {
                    handler()
                }, 200)
            }
        }
        const cancel = () => {
            if (pressTimer !== null) {
                clearTimeout(pressTimer)
                pressTimer = null
            }
        }
        const handler = (e) => {
            el.$longpressValue(e)
        }
        el.$longpressHandlers = { start, cancel }
        el.addEventListener('mousedown', start)
        el.addEventListener('touchstart', start)
        el.addEventListener('click', cancel)
        el.addEventListener('mouseout', cancel)
        el.addEventListener('touchend', cancel)
        el.addEventListener('touchcancel', cancel)
    },
    update(el, binding) {
        if (typeof binding.value !== 'function') {
            throw 'callback must be a function'
        }
        el.$longpressValue = binding.value
    },
    unbind(el) {
        const { start, cancel } = el.$longpressHandlers
        cancel()
        el.removeEventListener('mousedown', start)
        el.removeEventListener('touchstart', start)
        el.removeEventListener('click', cancel)
        el.removeEventListener('mouseout', cancel)
        el.removeEventListener('touchend', cancel)
        el.removeEventListener('touchcancel', cancel)
        delete el.$longpressHandlers
        delete el.$longpressValue
    },
}
