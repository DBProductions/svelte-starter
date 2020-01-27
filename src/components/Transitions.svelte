<script>
import { fade, fly, slide } from 'svelte/transition';
let visible = true;
</script>

<div class="cbContainer">
  Transitions
  <input class="trigger" type="checkbox" bind:checked={visible}>
  {#if visible}
    <span in:fade out:fade>Fade Transition</span>
    <span transition:fly>Fly Transition</span>
    <span transition:slide="{{ duration: 2000 }}">Slide Transition</span>
  {/if}
</div>

<style>
.cbContainer {
  margin-top: 10px;
  font-size: 14pt;
}
.cbContainer > span {
  margin-left: 20px;
  margin-right: 20px;
}
input.trigger {
  font-size: 24pt;
}
</style>