<script>
import { createEventDispatcher, onDestroy } from 'svelte';
import Modal from './Modal.svelte';

export let showModal = false;
export let modalForm = true;
export let headline = 'Modal';
export let valueEmail = '';
export let valuePW = '';
export let placeholderEmail = 'Email';
export let placeholderPW = 'Password';

const dispatch = createEventDispatcher();

const sendForm = () => {
  dispatch('sendForm', {email: valueEmail, password: valuePW});
  showModal = false;
};
</script>

<button on:click="{() => showModal = true}">Modal Form</button>

{#if showModal}
  <Modal modalForm="{modalForm}" on:close="{() => showModal = false}" on:sendForm="{sendForm}">
    <h2 slot="header">{headline}</h2>
    <div>
	    <input type="text" bind:value={valueEmail} value="{valueEmail}" placeholder="{placeholderEmail}">
    </div>
    <div>
      <input type="password" bind:value={valuePW} value="{valuePW}" placeholder="{placeholderPW}">
    </div>
  </Modal>
{/if}
