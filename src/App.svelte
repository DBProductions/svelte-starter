<script>
  import { userActivity, elapsed } from './stores.js'

  import Headline from './components/Headline.svelte'
  import List from './components/List.svelte'
  import Table from './components/Table.svelte'
  import ModalDialog from './components/ModalDialog.svelte'
  import ModalForm from './components/ModalForm.svelte'
  import UserInput from './components/UserInput.svelte'
  import RadioBoxes from './components/RadioBoxes.svelte'
  import Contenteditable from './components/Contenteditable.svelte'

  export let message = 'Svelte-Starter'
  export let itemId = ''

  export let list = []
  export let currentItem = 0

  export let table = {}

  export let userInput = ''

  export let result = ''
  export let modalDialog = {}
  export let selections = {}

  let selected = ''
  let showFormModal = false
  let valueName = ''
  let valueUrl = ''

  const listSelection = event => {
    message = `Clicked item ${event.detail.item.name}`
    itemId = `Id: ${event.detail.item.id}`
    selected = event.detail.item.name
  }

  const handleClickedRow = event => {
    message = `Clicked item ${event.detail.name}`
    itemId = `Id: ${event.detail.id}`
    selected = event.detail.name
    currentItem = event.detail.id
  }

  const edit = event => {
    valueName = event.detail.item.name
    valueUrl = event.detail.item.url
    showFormModal = true
    console.log(event.detail.item)
  }

  const closeModal = event => {
    showFormModal = false
  }

  const handleInput = event => {
    console.log(event.detail.input)
  }

  const sendForm = event => {
    showFormModal = false
    console.log(event.detail)
  }

  const handleEvent = event => {
    console.log(event.detail)
  }

  const handleUserEvent = event => {
    userActivity(event)
  }
</script>

<style>
  #container {
    height: 90%;
    width: 75%;
    padding: 2% 2% 3% 3%;
    margin: 0 auto;
    border: 1px solid #eee;
    border-radius: 5px 5px 5px 5px;
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
      <List {list} {currentItem} on:select={listSelection} on:edit={edit} />

      <UserInput {userInput} {result} on:input={handleInput} />

      <Contenteditable on:edited={handleInput} />

      <ModalDialog {...modalDialog} on:close={closeModal} />

      <ModalForm
        showModal={showFormModal}
        {valueName}
        {valueUrl}
        on:sendForm={sendForm}
        on:close={closeModal} />
    </div>
    <div class="right-column">
      <Table {selected} data={table} on:clickedRow={handleClickedRow} />

      <RadioBoxes {selections} on:select={handleEvent} />
    </div>
  </div>
  <div class="footer">
    <div>
      The user is inactive for {$elapsed} {$elapsed === 1 ? 'second' : 'seconds'}
    </div>
  </div>
</div>

<svelte:window
  on:mousemove={handleUserEvent}
  on:click={handleUserEvent}
  on:keydown={handleUserEvent} />
