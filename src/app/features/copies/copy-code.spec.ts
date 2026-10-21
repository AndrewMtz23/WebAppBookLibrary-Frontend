import { parseCopyInput, copyUrl } from './copy-code';
describe('copy codes', () => {
  const origin = 'https://library.example'; const id = '0123456789abcdef01234567';
  it('accepts only canonical local copy routes and normalized inventory codes', () => {
    expect(parseCopyInput(' ab-001 ', origin)).toEqual({ kind: 'code', value: 'AB-001' });
    expect(parseCopyInput(copyUrl(id, origin), origin)).toEqual({ kind: 'id', value: id });
    for (const input of ['javascript:alert(1)', 'https://other.example/librarian/copies/' + id,
      origin + '/librarian/copies/' + id + '?token=secret', origin + '/librarian/copies/' + id + '/delete',
      'https://user@library.example/librarian/copies/' + id, 'ábc', 'a b', '//other.example/path']) {
      expect(parseCopyInput(input, origin)).withContext(input).toBeNull();
    }
  });
});
