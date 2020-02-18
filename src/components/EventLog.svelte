<script>
  export let showLogs = false
  export let logs = ''
</script>

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

<svelte:options accessors={true} />

{#if showLogs}
  <textarea id="eventLog">{logs}</textarea>
{/if}
