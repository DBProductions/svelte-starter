describe('User Input Component', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('User input', () => {
    cy.get('div.user-input > input')
      .type('User input')
      .should('have.value', 'User input')

    cy.get('div.user-input > span').should('have.text', 'User input')
  })
})
