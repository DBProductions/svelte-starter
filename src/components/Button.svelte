<script>
  export let btnText = 'Click Me'
  export let send = false
</script>

<style>
  button {
    font-size: 1em;
    margin-top: 0.3em;
    padding: 0.5em 1em;
    color: #000;
    background: #eee;
    border-radius: 0.3em;
    box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
  }
  .sendBtn {
    background: blue;
    color: white;
  }
</style>

<button class:sendBtn={send === true} on:click>{btnText}</button>
