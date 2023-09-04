<script>
  export let message = ''
  export let itemId = ''
</script>

<h1>
  {message}
  {#if itemId}
    <small>{itemId}</small>
  {/if}
</h1>

<style>
  h1 {
    font-size: 24pt;
  }
  h1 > small {
    font-size: 12pt;
    color: #bbb;
  }
</style>
