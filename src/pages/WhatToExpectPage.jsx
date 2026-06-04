import { useState } from 'react';
import mockEnlistmentInfo, { enlistmentSections } from '../data/mockEnlistmentInfo';

export default function WhatToExpectPage() {
  const [activeSection, setActiveSection] = useState(enlistmentSections[0]);

  const itemsForSection = mockEnlistmentInfo.filter((item) => item.section === activeSection);

  return (
    <section>
      <header className="screen-header">
        <p className="kicker">Enlist · Screen 6</p>
        <h1>What to Expect</h1>
        <p>
          A structured first-day guide covering everything a pre-enlistee needs to know before
          stepping through the gates.
        </p>
        <div className="rule" />
      </header>

      <div className="expect-tab-bar">
        {enlistmentSections.map((section) => (
          <button
            key={section}
            type="button"
            className={`expect-tab${activeSection === section ? ' active' : ''}`}
            onClick={() => setActiveSection(section)}
          >
            {section}
          </button>
        ))}
      </div>

      <div className="expect-section-label">{activeSection}</div>

      <div className="expect-grid">
        {itemsForSection.map((item) => (
          <article key={item.id} className="expect-card">
            <h3 className="expect-card-title">{item.title}</h3>
            <p className="expect-card-detail">{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
