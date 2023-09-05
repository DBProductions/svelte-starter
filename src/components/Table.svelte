<script>
  import { createEventDispatcher } from 'svelte'

  export let data = {
    header: [],
    entries: [],
  }
  export let selected = ''

  const dispatch = createEventDispatcher()

  const handleClick = (entry) => dispatch('clickedRow', entry)

  const tblHeadClick = (e) => {
    if (e.target.tagName != 'TH') return
    let th = e.target
    sortTable(th.cellIndex, th.dataset.type, th.dataset.order)
    if (th.dataset.order === 'asc') {
      th.dataset.order = 'desc'
    } else {
      th.dataset.order = 'asc'
    }
  }

  const sortTable = (colNum, type, order) => {
    let tbody = document.querySelector('tbody')
    let rowsArray = Array.from(tbody.rows)
    let compare
    switch (type) {
      case 'date':
        compare = (rowA, rowB) => {
          const dateA = Date.parse(rowA.cells[colNum].innerHTML)
          const dateB = Date.parse(rowB.cells[colNum].innerHTML)
          return rowA.cells[colNum].innerHTML - rowB.cells[colNum].innerHTML
        }
        break
      case 'number':
        compare = (rowA, rowB) => {
          return rowA.cells[colNum].innerHTML - rowB.cells[colNum].innerHTML
        }
        break
      case 'string':
        compare = (rowA, rowB) => {
          return rowA.cells[colNum].innerHTML > rowB.cells[colNum].innerHTML
            ? 1
            : -1
        }
        break
    }
    rowsArray.sort(compare)
    if (order === 'desc') {
      rowsArray.reverse()
    }
    tbody.append(...rowsArray)
  }
</script>

<table class="tbl">
  <thead>
    <tr>
      {#each data.header as header}
        <th data-type={header.type} data-order="asc" on:click={tblHeadClick}
          >{header.value}</th
        >
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each data.entries as entry}
      <tr class:active={selected === entry.name} on:click={handleClick(entry)}>
        <td>{entry.id}</td>
        <td>{entry.name}</td>
        <td>{entry.url}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .tbl {
    border-collapse: collapse;
    border-spacing: 0;
    border-radius: 3px;
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
    cursor: pointer;
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
