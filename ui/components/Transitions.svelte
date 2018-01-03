<div class="cbContainer">
  Transitions
  <input class="trigger" type="checkbox" bind:checked="visible">
  {{#if visible}}
    <span transition:fade>Fade Transition</span>
    <span transition:fly>Fly Transition</span>
    <span transition:slide>Slide Transition</span>
  {{/if}}
</div>

<style>
.cbContainer {
    margin-left: 40px;
    margin-top: 10px;
    font-size: 14pt;
}
.cbContainer > span {
    margin-right: 40px;
}
input.trigger {
    font-size: 24pt;
}
</style>

<script type="text/javascript">
import { fade, fly, slide } from 'svelte-transitions';

export default {
  transitions: { fade, fly, slide }
};
</script>
