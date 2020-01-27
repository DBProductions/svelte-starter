<script>
export let message = '';
export let itemId = '';
</script>

<h1>
    {message} <small>{itemId}</small>
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