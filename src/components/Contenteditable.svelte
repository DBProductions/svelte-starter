<script>
  import { createEventDispatcher } from 'svelte'

  export let content = ''

  const dispatch = createEventDispatcher()

  const keypress = () => dispatch('input', { input: content })
</script>

<div
  class="contentBox"
  contenteditable="true"
  bind:textContent={content}
  on:keyup={keypress}
  role="button"
  tabindex="0"
/>

<style>
  .contentBox {
    margin: 7px 0px 7px 0px;
    padding: 5px;
    border-radius: 5px 5px 5px 5px;
    box-shadow: 2px 2px 3px #eee;
  }
</style>
