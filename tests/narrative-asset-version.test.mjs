import test from 'node:test';
import assert from 'node:assert/strict';
import { versionedNarrativeURL } from '../src/narrative/catalog.mjs';

// The narrative tree is copied verbatim into dist, so the only thing that can
// tell one build's dialogue from the next is the hash the build bakes in.
test('the build hash rides on every narrative URL', () => {
  const url = new URL('http://host/repo/assets/narrative/manifest.json');
  const stamped = versionedNarrativeURL(url, 'abc1234567');
  assert.equal(stamped.href, 'http://host/repo/assets/narrative/manifest.json?v=abc1234567');
  assert.equal(url.search, '', 'the URL it was given is not mutated');
});

test('a different tree is a different URL, and the same tree repeats it', () => {
  const url = new URL('http://host/assets/narrative/acts/act-03/manifest.json');
  assert.equal(versionedNarrativeURL(url, 'aaaa').searchParams.get('v'), 'aaaa');
  assert.equal(versionedNarrativeURL(url, 'bbbb').searchParams.get('v'), 'bbbb');
  assert.equal(versionedNarrativeURL(url, 'aaaa').href, versionedNarrativeURL(url, 'aaaa').href);
});

test('development and the tests keep the plain URL, which the dev server serves no-store', () => {
  const url = new URL('http://host/assets/narrative/manifest.json');
  assert.equal(versionedNarrativeURL(url).href, 'http://host/assets/narrative/manifest.json');
});
