import { z } from 'zod';
import { OpaqueIdSchema } from './schemas.js';
export const GuessWordSchema = z.string().regex(/^[a-z]{5}$/);
export const WordGuessArchiveSchema = z
  .object({
    version: z.literal(1),
    answers: z.array(GuessWordSchema).min(1).max(10_000),
    allowedGuesses: z.array(GuessWordSchema).min(1).max(30_000),
  })
  .strict()
  .superRefine((data, ctx) => {
    const allowed = new Set(data.allowedGuesses);
    if (
      allowed.size !== data.allowedGuesses.length ||
      new Set(data.answers).size !== data.answers.length
    )
      ctx.addIssue({ code: 'custom', message: 'Word lists must contain unique entries.' });
    if (data.answers.some((word) => !allowed.has(word)))
      ctx.addIssue({ code: 'custom', message: 'Every answer must be an allowed guess.' });
  });
export type WordGuessArchive = z.infer<typeof WordGuessArchiveSchema>;
export const WordGuessSnapshotSchema = z.object({
  id: OpaqueIdSchema,
  answers: WordGuessArchiveSchema.shape.answers,
  allowedGuesses: WordGuessArchiveSchema.shape.allowedGuesses,
});
export type WordGuessSnapshot = z.infer<typeof WordGuessSnapshotSchema>;
export const WordGuessCatalogueSchema = z.object({
  status: z.enum(['ready', 'stale', 'unconfigured', 'unavailable']),
  source: z.enum(['original-demo', 'household-word-list']),
  snapshot: WordGuessSnapshotSchema.nullable(),
});
export type WordGuessCatalogue = z.infer<typeof WordGuessCatalogueSchema>;
