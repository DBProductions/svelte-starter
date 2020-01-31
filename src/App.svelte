<script>
  import { userActivity, elapsed } from './stores.js'

  import Headline from './components/Headline.svelte'
  import List from './components/List.svelte'
  import Transitions from './components/Transitions.svelte'
  import ModalDialog from './components/ModalDialog.svelte'
  import ModalForm from './components/ModalForm.svelte'
  import UserInput from './components/UserInput.svelte'
  import RadioBoxes from './components/RadioBoxes.svelte'
  import Contenteditable from './components/Contenteditable.svelte'

  export let message = 'Svelte-Starter'
  export let itemId = ''
  export let list = []
  export let userInput = ''
  export let result = ''
  export let modalDialog = {}
  export let selections = {}

  const listSelection = event => {
    message = `Clicked item ${event.detail.item.name}`
    itemId = `Id: ${event.detail.item.id}`
  }

  const handleInput = event => {
    // console.log(event.detail.input);
  }

  const sendForm = event => {
    // console.log(event.detail)
  }

  const handleEvent = event => {
    userActivity(event)
  }
</script>

<style>
  #container {
    height: 90%;
    width: 94%;
    padding: 2% 2% 3% 3%;
    border: 1px solid #eee;
  }
  .columns {
    display: flex;
    padding: 3px;
  }
  .columns .left-column {
    width: 60%;
    height: inherit;
    padding: 2% 2% 3% 3%;
  }
  .columns .right-column {
    width: 30%;
    height: inherit;
    padding: 2% 2% 3% 3%;
    display: block;
  }
  .footer {
    margin: 7px;
    font-size: 10px;
  }
</style>

<div id="container">
  <div>
    <Headline {message} {itemId} />
  </div>
  <div class="columns">
    <div class="left-column">
      <List {list} on:select={listSelection} />
      <Transitions />
      <UserInput {userInput} {result} on:input={handleInput} />
      <Contenteditable on:edited={handleInput} />
    </div>
    <div class="right-column">
      <RadioBoxes {selections} />

      <ModalDialog {...modalDialog} />
      <ModalForm on:sendForm={sendForm} />
      <ModalForm valueEmail="svelte@example.com" on:sendForm={sendForm} />
    </div>
  </div>
  <div class="footer">
    <div>
      The user is inactive for {$elapsed} {$elapsed === 1 ? 'second' : 'seconds'}
    </div>
  </div>
</div>

<svelte:window
  on:mousemove={handleEvent}
  on:click={handleEvent}
  on:keydown={handleEvent} />
