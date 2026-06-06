import { useState } from 'react';
import mockEnlistmentInfo, { enlistmentSections } from '../data/mockEnlistmentInfo';
import Panel from '../components/ui/Panel';

export default function WhatToExpectPage() {
  const [active, setActive] = useState(enlistmentSections[0]);
  const items = mockEnlistmentInfo.filter((i) => i.section === active);

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '28px 36px' }}>
      <div className="label" style={{ color: 'var(--accent-text)', marginBottom: 8 }}>▲ ENLIST · FIELD BRIEF</div>
      <h1 className="h-display" style={{ fontSize: 52, marginBottom: 6 }}>WHAT TO EXPECT</h1>
      <p style={{ color: 'var(--text-dim)', marginBottom: 24 }}>
        A structured first-day guide covering everything a pre-enlistee needs before stepping through the gates.
      </p>

      <div className="expect-tabs">
        {enlistmentSections.map((s) => (
          <button key={s} className={`expect-tab${active === s ? ' active' : ''}`} onClick={() => setActive(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="label" style={{ color: 'var(--accent-text)', marginBottom: 14 }}>{active.toUpperCase()}</div>

      <div className="expect-grid">
        {items.map((item) => (
          <Panel key={item.id} className="expect-card">
            <div className="expect-card-title">{item.title}</div>
            <p className="expect-card-detail">{item.detail}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
