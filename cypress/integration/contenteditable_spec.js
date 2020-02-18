describe('Content Editable Component', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('Content editable', () => {
    cy.get(
      '#container > div.columns.svelte-1amdsmp > div.left-column.svelte-1amdsmp > div.contentBox.svelte-1yv2dil'
    )
      .click()
      .type(' Content Edit')
      .should('have.text', 'This content is editable. Content Edit')
  })

  it('Content selectable', () => {
    cy.get(
      '#container > div.columns.svelte-1amdsmp > div.left-column.svelte-1amdsmp > div.contentBox.svelte-1yv2dil'
    )
      .click()
      .type('{selectall}{backspace}')
      .type('Cypress')
      .should('have.text', 'Cypress')
  })
})
