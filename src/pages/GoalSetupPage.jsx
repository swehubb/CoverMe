import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';
import { useAuth } from '../contexts/AuthContext';

const goals = ['pass', 'silver', 'gold'];

export default function GoalSetupPage() {
  const navigate = useNavigate();
  const { currentModule, setCurrentModule, updateUser, user } = useAuth();

  const handleGoalPick = (goal) => {
    updateUser((currentUser) => ({
      ...currentUser,
      ipptGoal: goal,
    }));
  };

  return (
    <PageWrapper
      title="Set Your Goal"
      description="Pick the first demo goal for Wei before continuing into the consent screen."
      module={currentModule}
    >
      <div className="stack">
        <section className="card">
          <div className="section-label">IPPT Goal</div>
          <div className="pill-row">
            {goals.map((goal) => (
              <button
                key={goal}
                type="button"
                className={`choice-pill${user?.ipptGoal === goal ? ' active' : ''}`}
                onClick={() => handleGoalPick(goal)}
              >
                {goal}
              </button>
            ))}
          </div>
        </section>
        <section className="card">
          <div className="section-label">Default Module</div>
          <div className="pill-row">
            {['enlist', 'serve'].map((module) => (
              <button
                key={module}
                type="button"
                className={`choice-pill${currentModule === module ? ' active' : ''}`}
                onClick={() => setCurrentModule(module)}
              >
                {module}
              </button>
            ))}
          </div>
        </section>
        <div className="actions-row">
          <button type="button" className="button-primary" onClick={() => navigate('/setup/consent')}>
            Continue
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}
