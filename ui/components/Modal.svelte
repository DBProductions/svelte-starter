<div class="modal-background" on:click="close()"></div>
<div class="modal">
	{{yield}}
</div>

<style>
div.modal-background {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0,0,0,0.3);
}
div.modal {
	position: absolute;
	left: 50%;
	top: 30%;
	width: calc(100% - 4em);
	max-width: 32em;
	transform: translate(-50%, -50%);
	padding: 1em;
	border-radius: 0.2em;
	background: white;
	text-align: center;
}
</style>

<script type="text/javascript">
export default {
	methods: {
        close () {
            this.fire('close');
        }
    }
};
</script>
