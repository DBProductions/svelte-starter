import App from './App.svelte'
import { appProps } from './data.js'
import { userActivity } from './stores.js'

const app = new App({
  target: document.body,
  props: appProps,
})

app.$on('listSelection', event => {
  app.$set({ message: `Clicked item ${event.detail.name}` })
  app.$set({ itemId: `Id: ${event.detail.id}` })
  app.$set({ selected: event.detail.name })
})

app.$on('handleClickedRow', event => {
  app.$set({ message: `Clicked item ${event.detail.name}` })
  app.$set({ itemId: `Id: ${event.detail.id}` })
  app.$set({ selected: event.detail.name })
  app.$set({ currentItem: event.detail.id })
})

app.$on('edit', event => {
  app.$set({ valueName: event.detail.item.name })
  app.$set({ valueUrl: event.detail.item.url })
  app.$set({ showFormModal: true })
  console.log(event.detail.item)
})

app.$on('closeModal', event => {
  app.$set({ showFormModal: false })
})

app.$on('handleEvent', event => {
  console.log(event.detail)
})

app.$on('handleInput', event => {
  console.log(event.detail)
})

app.$on('handleUserEvent', event => {
  userActivity(event)
})

app.$on('sendForm', event => {
  app.$set({ showFormModal: false })
  console.log(event.detail)
})

export default app
