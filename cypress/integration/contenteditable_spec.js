describe('Content Editable Component', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('Content editable', () => {
    cy.get('div.contentBox')
      .click()
      .type(' Content Edit')
      .should('have.text', 'This content is editable. Content Edit')
  })

  it('Content selectable', () => {
    cy.get('div.contentBox')
      .click()
      .type('{selectall}{backspace}')
      .type('Cypress')
      .should('have.text', 'Cypress')
  })
})
