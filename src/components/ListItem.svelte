<script>
  import { createEventDispatcher } from 'svelte'

  export let item = { id: 0, name: '' }
  export let currentItem = 0

  const dispatch = createEventDispatcher()

  const select = () => dispatch('select', { item: item })
  const edit = () => dispatch('edit', { item: item })
</script>

<li class:active={currentItem === item.id}>
  <div style="float:right;">
    <buttton
      on:keydown={edit(item)}
      on:click={edit(item)}
      role="button"
      tabindex="0">Edit</buttton
    >
  </div>
  <div
    on:keydown={select(item)}
    on:click={select(item)}
    role="button"
    tabindex="0"
  >
    {item.name} -
    <small>{item.url}</small>
  </div>
</li>

<style>
  li {
    border: 1px solid #ddd;
    border-radius: 3px 3px 3px 3px;
    margin-bottom: 3px;
    padding: 9px;
    font-size: 12pt;
    cursor: pointer;
  }
  .active {
    background-color: #bbb;
  }
  li:hover {
    border: 1px solid #aaa;
  }
</style>
