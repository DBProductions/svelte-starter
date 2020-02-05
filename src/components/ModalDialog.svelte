<script>
  import Modal from './Modal.svelte'
  import { createEventDispatcher } from 'svelte'

  export let showModal = false
  export let headline = 'Modal'
  export let body = ''

  const dispatch = createEventDispatcher()

  const close = () => {
    showModal = false
    dispatch('close', {})
  }
</script>

<button on:click={() => (showModal = true)}>Modal</button>

{#if showModal}
  <Modal on:close={close}>
    <h2 slot="header">{headline}</h2>
    <p>
      {@html body}
    </p>
  </Modal>
{/if}
