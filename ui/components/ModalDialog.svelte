{{#if showModal}}
	<Modal on:destroy='set({ showModal: false })'>
		<h2>{{headline}}</h2>
		<p>This is a simple text to fill the dialog.</p>
		<p>A form with different headlines or button text or a map to select your location.</p>
	</Modal>
{{/if}}

<div>
    <button class="btn" on:click="set({ showModal: true, headline: 'ModalDialog 1'})">Show ModalDialog 1</button>
	<button class="btn" on:click="set({ showModal: true, headline: 'ModalDialog 2'})">Show ModalDialog 2</button>
</div>

<style>
div {
    margin-left: 40px;
}
</style>

<script type="text/javascript">
import Modal from './Modal.svelte';

export default {
	data () {
        return {
			headline: "",
            showModal: false
        }
    },
	components: { Modal }
};
</script>
