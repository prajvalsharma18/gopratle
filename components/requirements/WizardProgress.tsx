const STEPS = ["Event basics", "Category details", "Preferences", "Review"];

export function WizardProgress({ currentStep }: { currentStep: number }) {
  return (
    <nav className="wizard-progress" aria-label="Requirement form progress">
      <ol>
        {STEPS.map((label, index) => {
          const step = index + 1;
          const state = step < currentStep ? "complete" : step === currentStep ? "current" : "upcoming";
          return (
            <li key={label} className={`wizard-progress-step is-${state}`} aria-current={state === "current" ? "step" : undefined}>
              <span className="wizard-progress-number" aria-hidden="true">{state === "complete" ? "✓" : step}</span>
              <span className="wizard-progress-label">{label}</span>
            </li>
          );
        })}
      </ol>
      <div className="wizard-progress-track" aria-hidden="true"><span style={{ width: `${((currentStep - 1) / 3) * 100}%` }} /></div>
      <p className="wizard-mobile-progress">Step {currentStep} of 4 <span>·</span> {STEPS[currentStep - 1]}</p>
    </nav>
  );
}
