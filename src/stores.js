import { readable, writable, derived } from 'svelte/store'

export const time = readable(new Date(), (set) => {
  const interval = setInterval(() => {
    set(new Date())
  }, 1000)

  return () => {
    clearInterval(interval)
  }
})

let start = new Date()

export const userActivity = () => {
  start = new Date()
}

export const elapsed = derived(time, ($time) =>
  Math.round(($time - start) / 1000)
)

// simple counter
export const count = writable(0);
