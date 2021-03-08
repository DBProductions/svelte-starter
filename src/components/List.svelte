<script>
  import { createEventDispatcher } from 'svelte'
  import ListItem from './ListItem.svelte'

  export let list = []
  export let currentItem = 0

  const dispatch = createEventDispatcher()

  const select = (event) => {
    currentItem = event.detail.item.id
    dispatch('select', event.detail)
  }
</script>

<div class="list-container">
  <ul>
    {#each list as item}
      <ListItem {currentItem} {item} on:select={select} on:edit />
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
