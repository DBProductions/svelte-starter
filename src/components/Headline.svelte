<script>
  export let message = ''
  export let itemId = ''
</script>

<style>
  h1 {
    font-size: 24pt;
  }
  h1 > small {
    font-size: 12pt;
    color: #bbb;
  }
</style>

<h1>
  {message}
  <small>{itemId}</small>
</h1>
