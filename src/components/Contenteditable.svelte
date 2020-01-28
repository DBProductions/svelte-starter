<script>
import { createEventDispatcher } from 'svelte';

let content = 'This content is editable.';

const dispatch = createEventDispatcher();

const keypress = () => {
  dispatch('edited', {'input': content});
}
</script>

<div contenteditable="true" bind:textContent={content} on:keyup="{keypress}"></div>
