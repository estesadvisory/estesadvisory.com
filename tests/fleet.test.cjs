const test = require('node:test');
const assert = require('node:assert/strict');
const { evidence, render } = require('../ops/js/fleet.js');
const field = (value, availability = 'available') => ({value, availability, freshness: 'stale', provenance: 'fixture'});
class Element {
  constructor() { this.children = []; this.textContent = ''; }
  append(child) { this.children.push(child); }
  replaceChildren() { this.children = []; }
}
function documentFixture() {
  const ids = Object.fromEntries(['fleet-usage', 'fleet-seats', 'fleet-freshness'].map(id => [id, new Element()]));
  return {getElementById: id => ids[id], createElement: () => new Element(), ids};
}
test('renders independent provider evidence and seat states as text', () => {
  const doc = documentFixture();
  render({usage: {providers: ['codex','wonder','grok','hermes','ember'].map((id, i) => ({
    label: id, state: field(i ? null : '<img src=x>', i ? 'unavailable' : 'available'),
    window: {used_percent: field(i ? null : 0, i ? 'unavailable' : 'available')},
  }))}, seats: field(['active','inactive','unknown'].map(activity => ({id: activity, activity: field(activity)})))}, doc);
  const providers = doc.ids['fleet-usage'].children;
  assert.deepEqual(providers.map(p => p.children[0].textContent), ['codex','wonder','grok','hermes','ember']);
  assert.match(providers[0].children[1].textContent, /<img src=x>/);
  assert.match(providers[0].children[7].textContent, /0%/);
  assert.match(providers[1].children[7].textContent, /unavailable/);
  assert.doesNotMatch(providers[1].children[7].textContent, /0%/);
  assert.equal(doc.ids['fleet-seats'].children.length, 3);
  assert.match(doc.ids['fleet-seats'].children[2].textContent, /unknown/);
  assert.match(doc.ids['fleet-freshness'].textContent, /Snapshot, not live/);
});
test('missing snapshot and evidence remain honest', () => {
  const doc = documentFixture();
  render({}, doc);
  assert.match(doc.ids['fleet-usage'].textContent, /unavailable/);
  assert.match(doc.ids['fleet-seats'].textContent, /unknown/);
  assert.match(evidence(field(null, 'unavailable')), /unavailable; stale; fixture/);
});
