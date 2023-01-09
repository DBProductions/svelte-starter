<script>
  import { fade, scale } from 'svelte/transition'
  
  let animate = false
</script>
  
<div class="animation-container">
  <input type="checkbox" bind:checked={animate} /> Show  
  {#if animate}
    <span transition:fade>This text use transition:fade.</span>
    <span transition:scale>This text use transition:scale.</span>
  {/if}
</div>
  
<style>
.animation-container span {
  margin-left: 5px;
}
</style>