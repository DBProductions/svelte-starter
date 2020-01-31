<script>
  export let selections = {}

  let current = ''
  let information = '<p>Nothing to display.</p>'

  const setSelection = selector => {
    current = selector
    const item = selections.find(o => o.selector === selector)
    information = item.text
  }
</script>

<style>
  .selection-container {
    display: flex;
    margin: 3px;
    margin-bottom: 10px;
    padding: 3px;
    border-radius: 0 0 5px 0;
    box-shadow: 2px 2px 2px #eee;
  }
  .selection-container > div:not(:first-child) {
    margin-left: 10px;
    margin-top: 10px;
  }
  fieldset {
    border: 1px solid #eee;
    border-radius: 5px 5px 5px 5px;
    padding: 10px;
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
