describe('Modal Component', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('Open and close modal dialog', () => {
    // open modal
    cy.get('#modalDialogBtn').click()

    // close modal with click on button
    cy.get('#modalCloseBtn').click()

    // open modal again
    cy.get('#modalDialogBtn').click()

    // close modal with click on background
    cy.get('div.modal-background').click()
  })
})
