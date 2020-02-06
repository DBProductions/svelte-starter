<script>
  import { createEventDispatcher } from 'svelte'

  export let data = ''
  export let selected = ''

  const dispatch = createEventDispatcher()

  const handleClick = entry => dispatch('clickedRow', entry)
</script>

<style>
  table {
    border-collapse: collapse;
    border-spacing: 0;
    margin-bottom: 5px;
    width: 100%;
  }

  tr:hover td {
    background: #ddd;
    cursor: pointer;
  }

  th {
    background: #999;
    color: white;
    font-weight: bold;
  }

  th,
  td {
    padding: 10px;
    text-align: left;
  }

  tr.active td {
    color: green;
  }

  tr:first-child {
    border-top: 1px solid #bbb;
  }

  tr:last-child {
    border-bottom: 1px solid #bbb;
  }

  th:first-child {
    border-left: 1px solid #bbb;
  }

  th:last-child {
    border-right: 1px solid #bbb;
  }

  tbody tr:nth-child(odd) {
    background: #eee;
  }

  td:first-child {
    border-left: 1px solid #bbb;
  }

  td:last-child {
    border-right: 1px solid #bbb;
  }
</style>

<table>
  <thead>
    <tr>
      {#each data.header as header}
        <th>{header}</th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each data.entries as entry}
      <tr class:active={selected === entry.name} on:click={handleClick(entry)}>
        <td>{entry.name}</td>
        <td>{entry.url}</td>
      </tr>
    {/each}
  </tbody>
</table>
