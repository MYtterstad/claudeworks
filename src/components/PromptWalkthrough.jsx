export default function PromptWalkthrough({ steps }) {
  return (
    <div>
      <p style={{
        fontSize: 14,
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        marginBottom: 24,
      }}>
        This walkthrough shows the prompts used to build this app with Claude,
        step by step. Each prompt built on the previous result, iterating toward
        the final version.
      </p>

      {steps.map((step, i) => (
        <div key={i} className="prompt-step">
          <div className="prompt-step-number">Step {i + 1}</div>
          <div className="prompt-step-title">{step.title}</div>
          <div className="prompt-step-content">{step.description}</div>
          <div className="prompt-text">{step.prompt}</div>
          {step.outcome && (
            <div style={{
              marginTop: 10,
              fontSize: 13,
              color: 'var(--accent-amber)',
              fontStyle: 'italic',
            }}>
              → {step.outcome}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
