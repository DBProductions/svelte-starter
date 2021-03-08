<svelte:options accessors={true} />

<script>
  export let showLogs = false
  export let logs = ''
</script>

{#if showLogs}
  <textarea id="eventLog">{logs}</textarea>
{/if}

<style>
  textarea {
    background-color: black;
    color: lightgray;
    font-size: 0.7em;
    width: 100%;
    height: 100px;
    padding-bottom: 20px;
    overflow-y: scroll;
  }
</style>
