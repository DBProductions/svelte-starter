<script>
  import Button from './Button.svelte'
  import { fly } from 'svelte/transition'
  import { quintOut } from 'svelte/easing'
  import { createEventDispatcher, onDestroy } from 'svelte'

  export let modalForm = false

  const dispatch = createEventDispatcher()

  const send = () => dispatch('sendForm')
  const close = () => dispatch('close')

  let modal

  const handleKeydown = e => {
    if (e.key === 'Escape') {
      close()
      return
    }
    if (e.key === 'Tab') {
      const nodes = modal.querySelectorAll('*')
      const tabbable = Array.from(nodes).filter(n => n.tabIndex >= 0)
      let index = tabbable.indexOf(document.activeElement)
      if (index === -1 && e.shiftKey) index = 0
      index += tabbable.length + (e.shiftKey ? -1 : 1)
      index %= tabbable.length
      tabbable[index].focus()
      e.preventDefault()
    }
  }

  const previously_focused =
    typeof document !== 'undefined' && document.activeElement

  if (previously_focused) {
    onDestroy(() => {
      previously_focused.focus()
    })
  }
</script>

<style>
  .modal-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
  }
  .modal {
    position: absolute;
    left: 50%;
    top: 50%;
    width: calc(100vw - 4em);
    max-width: 32em;
    max-height: calc(100vh - 4em);
    overflow: auto;
    transform: translate(-50%, -50%);
    padding: 1em;
    border-radius: 0.2em;
    background: white;
    text-align: center;
  }
</style>

<svelte:window on:keydown={handleKeydown} />

<div class="modal-background" on:click={close} />

<div
  class="modal"
  role="dialog"
  aria-modal="true"
  bind:this={modal}
  transition:fly={{ delay: 0, duration: 1000, y: -500, opacity: 0.2, easing: quintOut }}>
  <slot name="header" />
  <slot />
  <!-- svelte-ignore a11y-autofocus -->
  {#if modalForm}
    <Button send on:click={send}>Send</Button>
  {/if}
  <Button on:click={close}>Close</Button>
</div>
