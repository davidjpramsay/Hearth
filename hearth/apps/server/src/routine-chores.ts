import type { ChoreOccurrence, MorningOverview } from '@hearth/shared';

/** A linked row is a view of a real due occurrence, never a second completion record. */
export function projectRoutineChores(
  overview: MorningOverview,
  occurrences: ChoreOccurrence[],
): MorningOverview {
  return {
    ...overview,
    people: overview.people.map(({ person, steps }) => ({
      person,
      steps: steps.flatMap((step) => {
        if (!step.choreTemplateId) return [step];
        const occurrence = occurrences.find(
          (item) =>
            item.templateId === step.choreTemplateId &&
            item.assignee.id === person.id &&
            item.localDate === overview.localDate &&
            (item.state === 'pending' || item.state === 'completed'),
        );
        if (!occurrence) return [];
        return [
          {
            ...step,
            title: occurrence.title,
            isCompleted: occurrence.state === 'completed',
            version: 0,
            chore: {
              occurrenceId: occurrence.id,
              completionId: occurrence.completionId,
              locked: occurrence.locked,
            },
          },
        ];
      }),
    })),
  };
}
