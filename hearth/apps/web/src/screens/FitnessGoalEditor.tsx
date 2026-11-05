import { useEffect, useRef, useState } from 'react';
import type { FitnessPersonPlan } from '@hearth/shared';

export function FitnessGoalEditor({
  goal,
  index,
  plan,
  editPlan,
}: {
  goal: FitnessPersonPlan['goals'][number];
  index: number;
  plan: FitnessPersonPlan;
  editPlan: (update: (p: FitnessPersonPlan) => FitnessPersonPlan) => void;
}) {
  const [open, setOpen] = useState(!goal.title);
  const title = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (title.current?.value === '') title.current.focus();
  }, []);
  const workouts = plan.workouts.filter((w) => w.goalId === goal.id);
  function change(update: Partial<FitnessPersonPlan['goals'][number]>) {
    editPlan((p) => ({
      ...p,
      goals: p.goals.map((g) => (g.id === goal.id ? { ...g, ...update } : g)),
    }));
  }
  return (
    <details
      className="fitness-goal-editor"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary id={`fitness-goal-${goal.id}`}>
        <strong>{goal.title || `New goal ${index + 1}`}</strong>
        <span>{goal.achieved ? 'Achieved' : `${workouts.length} linked`}</span>
      </summary>
      <div className="fitness-goal-editor__body">
        <label>
          Goal {index + 1}
          <input
            ref={title}
            maxLength={160}
            value={goal.title}
            onChange={(e) => change({ title: e.target.value })}
          />
        </label>
        <div className="fitness-settings__row">
          <label>
            Target date (optional)
            <input
              type="date"
              value={goal.targetDate ?? ''}
              onChange={(e) => change({ targetDate: e.target.value || null })}
            />
          </label>
          <label className="fitness-settings__check">
            <input
              type="checkbox"
              checked={goal.achieved}
              onChange={(e) => change({ achieved: e.target.checked })}
            />{' '}
            Achieved
          </label>
        </div>
        <label>
          This goal’s weekly focus (optional)
          <textarea
            maxLength={240}
            rows={2}
            value={goal.weeklyFocus ?? ''}
            onChange={(e) => change({ weeklyFocus: e.target.value })}
          />
        </label>
        <p className="field-help">
          Link workouts from their details. Achieved goals pause their linked workouts from
          tomorrow.
        </p>
        <button
          type="button"
          className="admin-danger"
          aria-label={`Remove goal ${index + 1}`}
          onClick={() => {
            if (
              workouts.length &&
              !window.confirm(
                'Remove this goal? Its workouts will continue as general fitness. Past progress is kept.',
              )
            )
              return;
            editPlan((p) => ({
              ...p,
              goals: p.goals.filter((g) => g.id !== goal.id),
              workouts: p.workouts.map((w) => (w.goalId === goal.id ? { ...w, goalId: null } : w)),
            }));
            requestAnimationFrame(() => document.getElementById('fitness-add-goal')?.focus());
          }}
        >
          Remove goal
        </button>
      </div>
    </details>
  );
}
