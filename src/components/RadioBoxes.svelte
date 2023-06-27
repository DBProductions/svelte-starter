<script>
  import { createEventDispatcher } from 'svelte'

  export let selections = {}

  const dispatch = createEventDispatcher()
  let current = ''
  let information = '<p>Nothing to display.</p>'

  const setSelection = (selector) => {
    current = selector
    const item = selections.find((o) => o.selector === selector)
    information = item.text
    dispatch('select', { current })
  }
</script>

<div class="selection-container">
  <div>
    <fieldset>
      {#each selections as { selector, label }, i}
        <span
          on:keydown={setSelection(selector)}
          on:click={setSelection(selector)}
          role="button"
          tabindex="0"
        >
          <label class:active={current === selector}>
            {label}
            <input
              type="radio"
              name="selection"
              id={selector}
              title={selector}
              value={selector}
            />
          </label>
        </span>
      {/each}
    </fieldset>
  </div>
  <div>
    The user selected {current ? current : 'nothing'}.
    {@html information}
  </div>
</div>

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
