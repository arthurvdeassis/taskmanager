describe('Login Flow', () => {
  it('permite login com credenciais válidas', () => {
    cy.visit('http://localhost:5173');

    cy.get('input[type="text"]').type('usuarioTeste');
    cy.get('input[type="password"]').type('senhaTeste');

    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { token: "fake-jwt-token" }
    }).as('loginRequest');

    cy.intercept('GET', '/api/tasks', {
      statusCode: 200,
      body: []
    }).as('getTasksAfterLogin');

    cy.get('.auth-btn').click();

    cy.wait('@loginRequest');
    cy.wait('@getTasksAfterLogin');

    cy.contains('Nova Tarefa').should('exist');
  });
});
