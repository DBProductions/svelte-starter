export const appProps = {
  message: 'Svelte-Starter',
  itemId: '',
  currentItem: 0,
  userInput: '',
  list: [
    { id: 1, name: 'Svelte', url: 'https://svelte.technology/' },
    { id: 2, name: 'Rollup', url: 'https://rollupjs.org/' },
    { id: 3, name: 'Sapper', url: 'https://sapper.svelte.dev/' },
    { id: 4, name: 'Cypress', url: 'https://cypress.io/' },
  ],
  table: {
    header: ['Name', 'URL'],
    entries: [
      { id: 1, name: 'Svelte', url: 'https://svelte.technology/' },
      { id: 2, name: 'Rollup', url: 'https://rollupjs.org/' },
      { id: 3, name: 'Sapper', url: 'https://sapper.svelte.dev/' },
      { id: 4, name: 'Cypress', url: 'https://cypress.io/' },
    ],
  },
  showFormModal: false,
  modalDialog: {
    showModal: false,
    headline: 'Modal',
    body: 'Modal body text.<br>Plus this.',
  },
  selections: [
    {
      selector: 'A',
      label: 'A',
      text:
        '<p>This is the selection <strong>A</strong>.<br>It shows the information for A.</p>',
    },
    {
      selector: 'B',
      label: 'B',
      text:
        '<p>This is the selection <strong>B</strong>.<br>It shows the information for B.</p>',
    },
    {
      selector: 'C',
      label: 'C',
      text:
        '<p>This is the selection <strong>C</strong>.<br>It shows the information for C.</p>',
    },
  ],
}
