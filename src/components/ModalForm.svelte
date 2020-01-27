<script>
import Modal from './Modal.svelte';

export let showModal = false;
export let headline = 'Modal';
export let inputValue = '';
export let placeholder = 'Name';
</script>

<button on:click="{() => showModal = true}">Modal Form</button>

{#if showModal}
  <Modal on:close="{() => showModal = false}">
    <h2 slot="header">{headline}</h2>
	<input type="text" value="{inputValue}" placeholder="{placeholder}">
  </Modal>
{/if}
