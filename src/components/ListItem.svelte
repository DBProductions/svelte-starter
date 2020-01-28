<script>
import { createEventDispatcher } from 'svelte';

export let item = {id: 0, name: ''};
export let currentItem = 0;

const dispatch = createEventDispatcher();

const select = () => {
  dispatch('select', {item: item});
};
</script>

<li class:active="{currentItem === item.id}" on:click="{select(item)}">
  {item.name} - <small>{item.url}</small>
</li>

<style>
li {
  border: 1px solid #ddd;
  border-radius: 3px 3px 3px 3px;
  margin-bottom: 3px;
  padding: 7px;
  width: 60%;
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
