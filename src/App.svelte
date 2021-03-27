<svelte:options accessors={true} />

<script>
  import { elapsed } from './stores.js'
  import { createEventDispatcher } from 'svelte'

  import Headline from './components/Headline.svelte'
  import List from './components/List.svelte'
  import Table from './components/Table.svelte'
  import ModalDialog from './components/ModalDialog.svelte'
  import ModalForm from './components/ModalForm.svelte'
  import UserInput from './components/UserInput.svelte'
  import RadioBoxes from './components/RadioBoxes.svelte'
  import Contenteditable from './components/Contenteditable.svelte'
  import Profile from './components/Profile.svelte'
  import EventLog from './components/EventLog.svelte'

  export let message
  export let itemId
  export let list
  export let table
  export let userInput
  export let selections
  export let currentItem
  export let modalDialog
  export let showFormModal
  export let selected = ''
  export let valueName = ''
  export let valueUrl = ''
  export let showLogs = true
  export let logs = ''

  // event handling
  const dispatch = createEventDispatcher()
  const listSelection = (event) => dispatch('listSelection', event.detail.item)
  const handleClickedRow = (event) => dispatch('handleClickedRow', event.detail)
  const sendForm = (event) => dispatch('sendForm', event.detail)
  const handleEvent = (event) => dispatch('handleEvent', event.detail)
  const handleUserEvent = (event) => dispatch('handleUserEvent', event.detail)
</script>

<div id="container">
  <div>
    <Headline {message} {itemId} />
  </div>
  <div class="columns">
    <div class="left-column">
      <List {list} {currentItem} on:select={listSelection} on:edit />

      <UserInput {userInput} on:input />

      <Contenteditable content="This content is editable." on:input />

      <ModalDialog {...modalDialog} on:close />

      <ModalForm
        showModal={showFormModal}
        {valueName}
        {valueUrl}
        on:sendForm={sendForm}
        on:close
      />
    </div>
    <div class="right-column">
      <Table {selected} data={table} on:clickedRow={handleClickedRow} />

      <RadioBoxes {selections} on:select={handleEvent} />

      <Profile />
    </div>
  </div>
  <div class="footer">
    <div>
      The user is inactive for {$elapsed}
      {$elapsed === 1 ? 'second' : 'seconds'}
    </div>
  </div>
  <EventLog {showLogs} {logs} />
</div>

<svelte:window
  on:mousemove={handleUserEvent}
  on:click={handleUserEvent}
  on:keydown={handleUserEvent}
/>

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
    flex-wrap: wrap;
    padding: 3px;
  }
  .columns > * {
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 300px;
  }
  .columns .left-column {
    padding: 1% 1% 2% 2%;
  }
  .columns .right-column {
    padding: 1% 1% 2% 2%;
  }
  .footer {
    margin: 7px;
    font-size: 10px;
  }
</style>
