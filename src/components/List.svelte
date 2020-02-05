<script>
  import { createEventDispatcher } from 'svelte'
  import ListItem from './ListItem.svelte'

  export let list = []
  export let currentItem = 0

  const dispatch = createEventDispatcher()

  const select = event => {
    currentItem = event.detail.item.id
    dispatch('select', event.detail)
  }
  const edit = event => dispatch('edit', event.detail)
</script>

<style>
  ul {
    list-style: none;
    margin: 0px;
    padding: 0px;
  }
</style>

<div>
  <ul>
    {#each list as item}
      <ListItem {currentItem} {item} on:select={select} on:edit={edit} />
    {/each}
  </ul>
</div>
