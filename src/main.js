import App from './App.svelte'
import { appProps } from './data.js'
import { userActivity } from './stores.js'

const app = new App({
  target: document.body,
  props: appProps,
})

const logEvent = (event) => {
  app.$set({
    logs: app.logs
      ? app.logs + '\n' + JSON.stringify(event)
      : JSON.stringify(event),
  })
  document.querySelector('#eventLog').scrollTop =
    document.querySelector('#eventLog').scrollHeight
}

app.$on('listSelection', (event) => {
  app.$set({
    message: `Clicked item ${event.detail.name}`,
    itemId: `Id: ${event.detail.id}`,
    selected: event.detail.name,
  })
  logEvent(event.detail)
})

app.$on('handleClickedRow', (event) => {
  app.$set({
    message: `Clicked item ${event.detail.name}`,
    itemId: `Id: ${event.detail.id}`,
    selected: event.detail.name,
    currentItem: event.detail.id,
  })
  logEvent(event.detail)
})

app.$on('edit', (event) => {
  app.$set({
    valueName: event.detail.item.name,
    valueUrl: event.detail.item.url,
    showFormModal: true,
  })
  logEvent(event.detail)
})

app.$on('close', (event) => {
  app.$set({ showFormModal: false })
  logEvent(event.detail)
})

app.$on('handleEvent', (event) => {
  logEvent(event.detail)
})

app.$on('input', (event) => {
  logEvent(event.detail)
})

app.$on('handleUserEvent', (event) => {
  userActivity(event)
})

app.$on('sendForm', (event) => {
  app.$set({ showFormModal: false })
  logEvent(event.detail)
})

export default app
