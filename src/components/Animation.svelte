<script>
  import { fade, blur, fly, slide, scale } from 'svelte/transition'

  let animate = false
</script>

<div class="animation-container">
  <input type="checkbox" bind:checked={animate} /> Show Transitions
  {#if animate}
    <div transition:fade>This text use transition:fade.</div>
    <div transition:blur>This text use transition:blur.</div>
    <div transition:fly={{ x: 10 }}>This text use transition:fly.</div>
    <div transition:slide>This text use transition:slide.</div>
    <div transition:scale={{ start: 5 }}>This text use transition:scale.</div>
  {/if}
</div>

<style>
  .animation-container {
    margin: 10px;
  }
</style>
