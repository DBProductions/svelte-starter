<script>
  export let send = false
  export let id = 'btn'
</script>

<button {id} class:sendBtn={send === true} on:click>
  <slot />
</button>

<style>
  button {
    font-size: 0.9em;
    margin-top: 0.3em;
    padding: 0.5em 0.8em;
    color: black;
    background: white;
    border-radius: 0.3em;
    box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
  }
  .sendBtn {
    background: blue;
    color: white;
  }
</style>
