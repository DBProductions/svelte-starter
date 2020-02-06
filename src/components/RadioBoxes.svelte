<script>
  import { createEventDispatcher } from 'svelte'

  export let selections = {}

  const dispatch = createEventDispatcher()
  let current = ''
  let information = '<p>Nothing to display.</p>'

  const setSelection = selector => {
    current = selector
    const item = selections.find(o => o.selector === selector)
    information = item.text
    dispatch('select', { current })
  }
</script>

<style>
  .selection-container {
    display: flex;
    padding: 3px;
    border-radius: 0 0 5px 0;
    box-shadow: 2px 2px 3px #eee;
  }
  .selection-container > div:not(:first-child) {
    margin-left: 5px;
    margin-top: 5px;
  }
  fieldset {
    border: 1px solid #eee;
    border-radius: 5px 5px 5px 5px;
  }
  .active {
    color: #00f;
  }
</style>

<div class="selection-container">
  <div>
    <fieldset id="group1">
      {#each selections as { selector, label }, i}
        <label
          class:active={current === selector}
          on:click={setSelection(selector)}>
          <input type="radio" name="selection" value={selector} />
          {label}
        </label>
      {/each}
    </fieldset>
  </div>
  <div>
    The user selected {current ? current : 'nothing'}.
    {@html information}
  </div>
</div>
