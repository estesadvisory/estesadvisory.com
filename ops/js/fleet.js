/* Read-only renderer for the shared fleet_view projection (artifactum#807). */
(function () {
  'use strict';
  function evidence(field, suffix = '') {
    const f = field || {};
    const value = f.availability === 'available' && f.value !== null && f.value !== undefined
      ? String(f.value) + suffix : (f.availability || 'unknown');
    return `${value} [${f.availability || 'unknown'}; ${f.freshness || 'unknown'}; ${f.provenance || 'unavailable'}]${f.reason ? ' — ' + f.reason : ''}`;
  }
  function rows(projection) {
    return {
      providers: (projection.usage?.providers || []).map(p => ({
        label: p.label,
        fields: [
          ['State', p.state], ['Source', p.source], ['Captured at (epoch)', p.captured_at],
          ['Age at projection (seconds)', p.age_seconds], ['Error', p.error], ['Timezone', p.timezone],
          ['Window used', p.window?.used_percent, '%'], ['Window reset', p.window?.reset_label],
          ['Weekly used', p.weekly?.used_percent, '%'], ['Weekly reset', p.weekly?.reset_label],
        ].map(([label, value, suffix]) => `${label}: ${evidence(value, suffix)}`),
      })),
      seats: (projection.seats?.value || []).map(s => `${s.id}: ${evidence(s.activity)}`),
    };
  }
  function render(projection, doc) {
    const data = rows(projection);
    const usage = doc.getElementById('fleet-usage');
    const seats = doc.getElementById('fleet-seats');
    usage.replaceChildren();
    seats.replaceChildren();
    for (const provider of data.providers) {
      const section = doc.createElement('article');
      const title = doc.createElement('h3');
      title.textContent = provider.label;
      section.append(title);
      for (const line of provider.fields) {
        const p = doc.createElement('p');
        p.textContent = line;
        section.append(p);
      }
      usage.append(section);
    }
    if (!data.providers.length) usage.textContent = 'Usage unavailable: fleet snapshot missing.';
    for (const line of data.seats) {
      const p = doc.createElement('p');
      p.textContent = line;
      seats.append(p);
    }
    if (!data.seats.length) seats.textContent = `Seat activity: ${evidence(projection.seats)}`;
    const epoch = projection.meta?.generated_at?.value;
    const time = typeof epoch === 'number' ? new Date(epoch * 1000).toISOString() : 'unknown';
    doc.getElementById('fleet-freshness').textContent =
      `Fleet evidence collected: ${time}. Snapshot, not live activity. Freshness labels are as of projection generation. ` +
      `Evidence: ${evidence(projection.meta?.snapshot_error)}. Refresh the data path to update.`;
  }
  if (typeof module !== 'undefined') module.exports = { evidence, rows, render };
  if (typeof document !== 'undefined') {
    fetch('data/fleet-view.json', { cache: 'no-store' })
      .then(response => { if (!response.ok) throw new Error('unavailable'); return response.json(); })
      .then(projection => render(projection, document))
      .catch(() => render({}, document));
  }
}());
