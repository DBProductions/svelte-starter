<script>
import { createEventDispatcher } from 'svelte';

export let item = {id: 0, name: ''};

const dispatch = createEventDispatcher();

const select = () => {
  dispatch('select', {item: item});
};
</script>

<li on:click="{select(item)}">
  {item.name} - <small>{item.url}</small>
</li>

<style>
li {
  border: 1px solid #ccc;
  border-radius: 3px 3px 3px 3px;
  margin-bottom: 3px;
  padding: 7px;
  width: 70%;
  font-size: 14pt;
  cursor: pointer;
}
li:hover {
  background-color: #eee;
}
</style>
