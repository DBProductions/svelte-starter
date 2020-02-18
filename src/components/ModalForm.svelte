<script>
  import { createEventDispatcher, onDestroy } from 'svelte'
  import Modal from './Modal.svelte'

  export let showModal = false
  export let modalForm = true
  export let headline = 'Modal'
  export let valueName = ''
  export let valueUrl = ''
  export let placeholderName = 'Name'
  export let placeholderUrl = 'URL'

  const dispatch = createEventDispatcher()

  const sendForm = () => {
    dispatch('sendForm', { name: valueName, url: valueUrl })
    showModal = false
  }

  const close = () => {
    dispatch('close', {})
    showModal = false
  }
</script>

<style>
  input[type='text'] {
    width: 90%;
  }
</style>

{#if showModal}
  <Modal
    modalId="modalForm"
    {modalForm}
    on:close={close}
    on:sendForm={sendForm}>
    <h2 slot="header">{headline}</h2>
    <div>
      <input type="text" bind:value={valueName} placeholder={placeholderName} />
    </div>
    <div>
      <input type="text" bind:value={valueUrl} placeholder={placeholderUrl} />
    </div>
  </Modal>
{/if}
