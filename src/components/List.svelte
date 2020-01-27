<script>
import { createEventDispatcher } from 'svelte';
import ListItem from './ListItem.svelte';

export let list = [];

const dispatch = createEventDispatcher();

const select = (event) => {
  dispatch('select', event.detail);
};
</script>

<div>
  <ul>
    {#each list as item}
      <ListItem item="{item}" on:select="{select}" />
    {/each}
  </ul>
</div>

<style>
ul {
  list-style: none;
  margin: 0px;
  padding: 0px;
}
</style>