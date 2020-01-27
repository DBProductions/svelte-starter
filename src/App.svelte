<script>
import Headline from './components/Headline.svelte';
import List from './components/List.svelte';
import Transitions from './components/Transitions.svelte';
import ModalDialog from './components/ModalDialog.svelte';
import ModalForm from './components/ModalForm.svelte';
import UserInput from './components/UserInput.svelte';

export let message = 'Svelte-Starter';
export let itemId = '';
export let list = [];
export let showModal = false;
export let userInput = '';
export let result = '';

function listSelection(event) {
  message = `Clicked item ${event.detail.item.name}`;
  itemId = `Id: ${event.detail.item.id}`;
}
function handleInput(event) {
  console.log(event.detail.input);
}
</script>

<div id="container">
  <div>
	<Headline message="{message}" itemId="{itemId}" />
  </div>
  <div id="left-column">
	<List list="{list}" on:select="{listSelection}" />
	<Transitions />
	<UserInput userInput="{userInput}" result="{result}" on:input={handleInput} />
  </div>
  <div id="right-column">
    <ModalDialog showModal="{showModal}" body="Modal body text." />
	  <ModalForm showModal="{showModal}" />
	  <ModalForm showModal="{showModal}" inputValue="Name" />
  </div>
</div>

<style>
#container {
  height: 90%;
  width: 100%;
}
#left-column {
  float: left;
  width: 70%;
  height: inherit;
}
#right-column {
  float: left;
  width: 30%;
  display: block;
  height: inherit;
}
</style>