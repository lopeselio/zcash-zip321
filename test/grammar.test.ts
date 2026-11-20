// Grammar edge cases where implementations of the ZIP 321 ABNF have diverged. Each case names the
// upstream discussion it comes from, so a regression here can be compared with the reference crate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePaymentRequest } from '../src/uri.ts';
import { ZIP321Error } from '../src/errors.ts';

const T = 'tmEZhbWHTpdKMw5it8YDspUXSMGQyFwovpU';
const Z = 'ztestsapling10yy2ex5dcqkclhc7z7yrnjq2z6feyjad56ptwlfgmy77dmaqqrl9gyhprdx59qgmsnyfska2kez';

const RUST_3164 = 'zcash/librustzcash#3164';
const RUST_3277 = 'zcash/librustzcash#3277';
const RUST_3278 = 'zcash/librustzcash#3278';
const BINDINGS_40 = 'jp4g/zakura-wasm-bindings#40';

const valid: [string, string, string][] = [
  ['the scheme in upper case', `ZCASH:${T}?amount=1`, RUST_3164],
  ['the scheme in mixed case', `Zcash:${T}?amount=1`, RUST_3164],
  ['a parameter without a value', `zcash:${T}?amount=1&myflag`, RUST_3277],
  ['an indexed parameter without a value', `zcash:?address=${T}&amount=1&address.1=${Z}&amount.1=1&myflag.1`, RUST_3277],
  ['a parameter with an empty value', `zcash:${T}?amount=1&myflag=`, RUST_3277],
  ['an empty segment', `zcash:${T}?amount=1&&label=x`, RUST_3164],
  ['a trailing separator', `zcash:${T}?amount=1&`, RUST_3164],
  ['a separator straight after the query mark', `zcash:${T}?&amount=1`, RUST_3164],
  ['valid percent escapes', `zcash:${T}?amount=1&label=Thank%20you%21`, RUST_3278],
  ['parameter names in any case', `zcash:?ADDRESS=${T}&Amount=1&LABEL=x`, BINDINGS_40],
  ['extra parameters that differ only in case', `zcash:${T}?amount=1&Foo=1&foo=2`, BINDINGS_40],
];

const invalid: [string, string, string][] = [
  ['an address parameter without a value', 'zcash:?address&amount=1', RUST_3277],
  ['a req- parameter without a value', `zcash:${T}?amount=1&req-flag`, RUST_3277],
  ['a repeated parameter without a value', `zcash:${T}?amount=1&myflag&myflag`, RUST_3277],
  ['a bare % in a label', `zcash:${T}?amount=1&label=50%`, RUST_3278],
  ['a lone %', `zcash:${T}?amount=1&label=%`, RUST_3278],
  ['a truncated escape', `zcash:${T}?amount=1&label=a%2`, RUST_3278],
  ['a non-hex escape', `zcash:${T}?amount=1&label=%zz`, RUST_3278],
  ['a half-hex escape', `zcash:${T}?amount=1&label=a%2G`, RUST_3278],
  ['a bare % in an extra parameter', `zcash:${T}?amount=1&ref=50%`, RUST_3278],
  ['an upper-case REQ- parameter', `zcash:${T}?amount=1&REQ-x=1`, BINDINGS_40],
];

for (const [name, uri, source] of valid) {
  test(`accepts ${name} (${source})`, () => {
    assert.ok(parsePaymentRequest(uri).payments.length > 0);
  });
}

for (const [name, uri, source] of invalid) {
  test(`rejects ${name} (${source})`, () => {
    assert.throws(() => parsePaymentRequest(uri), ZIP321Error);
  });
}
