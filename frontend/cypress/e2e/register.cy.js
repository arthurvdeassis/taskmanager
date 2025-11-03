describe('Register Flow', () => {
  it('permite criar nova conta', () => {
    cy.visit('http://localhost:5173');
    cy.contains('Registre-se aqui').click();
    cy.get('input[type="text"]').type('novoUsuarioTeste');
    cy.get('input[type="password"]').type('novaSenhaTeste');
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 200,
      body: {}
    }).as('registerRequest');
    cy.get('.auth-btn').click();

    cy.contains('Registro bem-sucedido').should('exist');
    cy.contains('Login').should('exist');
  });
});
