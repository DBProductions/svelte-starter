<script>
  import Modal from './Modal.svelte'
  import Button from './Button.svelte'
  import { createEventDispatcher } from 'svelte'

  export let showModal = false
  export let headline = 'Modal'
  export let body = ''
  export let btnText = 'Modal Dialog'

  const dispatch = createEventDispatcher()

  const open = () => {
    showModal = true
  }

  const close = () => {
    dispatch('close', {})
    showModal = false
  }
</script>

<Button {btnText} on:click={open} />

{#if showModal}
  <Modal on:close={close}>
    <h2 slot="header">{headline}</h2>
    <p>
      {@html body}
    </p>
  </Modal>
{/if}
