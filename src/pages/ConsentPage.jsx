import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

export default function ConsentPage({ state, updateState }) {
  const navigate = useNavigate();

  if (!state.auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (state.onboarding.consented) {
    return <Navigate to="/home" replace />;
  }

  const proceed = (agreed) => {
    updateState((current) => ({
      ...current,
      onboarding: {
        ...current.onboarding,
        consented: true,
        journalOptIn: agreed,
      },
    }));
    navigate('/home');
  };

  return (
    <section className="consent-screen">
      <header className="screen-header consent-header">
        <p className="kicker">◢ Step 02 / 02 · Sentinel wellness layer</p>
        <h1>Your mind is part of the mission</h1>
        <p>Private reflection and trend tracking, controlled by you at every step.</p>
      </header>
      <div className="consent-card">
        <p className="kicker">◢ Your journal is yours</p>
        <h2>Private by design</h2>
        <div className="consent-copy">
          <p>
            Cover Me uses NLP — natural language processing — to look at the words in your journal
            entry and estimate a private sentiment score for you over time.
          </p>
          <p>
            The system does not publish your writing, send your raw text to commanders, or surface
            your entries to peers. For normal entries, the app stores your writing and its trend
            score only in your private journal view.
          </p>
          <p>
            If language suggests immediate self-harm risk, the app does not save that entry. It only
            interrupts the flow to show crisis support resources directly to you.
          </p>
          <p>
            No commander, peer support leader, or third party ever sees your journal entries. You
            have the right to delete your data at any time.
          </p>
        </div>
      </div>
      <div className="consent-card consent-controls">
        <p className="kicker">◢ Deployment choice</p>
        <h2>Enable Sentinel?</h2>
        <p>
          You can change this preference later. Skipping does not restrict any other Cover Me
          feature.
        </p>
        <div className="consent-actions">
          <button className="primary-button" onClick={() => proceed(true)}>Enable wellness tracking →</button>
          <button className="secondary-button consent-skip-button" onClick={() => proceed(false)}>Skip for now</button>
        </div>
      </div>
    </section>
  );
}
