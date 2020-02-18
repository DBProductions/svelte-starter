<script>
  import { createEventDispatcher } from 'svelte'

  export let userInput = ''

  const dispatch = createEventDispatcher()

  const keypress = () => {
    dispatch('input', { input: userInput })
  }
</script>

<style>
  input[type='text'] {
    border-radius: 3px 3px 3px 3px;
    margin-left: 5px;
    margin-right: 20px;
    font-size: 12pt;
  }
  .user-input {
    margin-top: 10px;
    font-size: 12pt;
  }
</style>

<div class="user-input">
  Two-way binding
  <input type="text" bind:value={userInput} on:keyup={keypress} />
  <span>{userInput}</span>
</div>
