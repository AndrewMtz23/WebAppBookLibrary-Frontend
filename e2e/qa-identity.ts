// Identity mapping for the isolated QaHost and accounts created by browser suites.
export function qaEmail(username: string): string {
  return /^qa_(admin|librarian|user)$/.test(username)
    ? `${username.slice(3)}@booklibrary.invalid`
    : `${username}@example.invalid`;
}
