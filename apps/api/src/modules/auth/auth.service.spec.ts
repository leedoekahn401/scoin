describe('AuthService', () => {
  it.todo('login with email (parents, staff) or username (cashiers)');
  it.todo('INVALID_CREDENTIALS on a wrong password, increments failedLogins');
  it.todo('ACCOUNT_LOCKED for 15 minutes after 5 failed attempts (FR-AUTH-06)');
  it.todo('refresh rotates the token and revokes the old one');
  it.todo('register-parent consumes the invite code and links the student (FR-AUTH-02)');
  it.todo('PARENT_LIMIT_REACHED when the student already has two parents (FR-FAM-03)');
});
