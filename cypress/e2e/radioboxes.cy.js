describe('Radio Boxes Component', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('Click radio boxes', () => {
    cy.get('#A').click()

    cy.get('div.selection-container > div:nth-child(2)').should(
      'have.text',
      'The user selected A.\n    This is the selection A.It shows the information for A.'
    )

    cy.get('#B').click()

    cy.get('div.selection-container > div:nth-child(2)').should(
      'have.text',
      'The user selected B.\n    This is the selection B.It shows the information for B.'
    )

    cy.get('#C').click()

    cy.get('div.selection-container > div:nth-child(2)').should(
      'have.text',
      'The user selected C.\n    This is the selection C.It shows the information for C.'
    )
  })
})
