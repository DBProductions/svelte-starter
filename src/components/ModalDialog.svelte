<script>
import Modal from './Modal.svelte';

export let showModal = false;
export let headline = 'Modal';
export let body = '';
</script>

<button on:click="{() => showModal = true}">Modal</button>

{#if showModal}
  <Modal on:close="{() => showModal = false}">
    <h2 slot="header">{headline}</h2>
	  <p>{@html body}</p>
  </Modal>
{/if}
