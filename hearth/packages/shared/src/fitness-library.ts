import { z } from 'zod';
import { OpaqueIdSchema } from './schemas.js';
export const MAX_FITNESS_CLIP_BYTES = 25 * 1024 * 1024;
export const FitnessLibraryExerciseSchema = z
  .object({
    id: OpaqueIdSchema,
    name: z.string().trim().min(1).max(80),
    instructions: z.string().trim().max(2000),
    version: z.number().int().positive(),
    demonstration: z
      .object({
        id: OpaqueIdSchema,
        byteLength: z.number().int().positive(),
        mimeType: z.literal('video/mp4'),
      })
      .strict()
      .nullable(),
  })
  .strict();
export const FitnessLibrarySchema = z
  .object({ exercises: z.array(FitnessLibraryExerciseSchema).max(100) })
  .strict();
export const FitnessLibraryCommandSchema = z
  .object({ requestId: OpaqueIdSchema, expectedVersion: z.number().int().min(0) })
  .strict();
export const SaveFitnessLibraryExerciseSchema = FitnessLibraryCommandSchema.extend({
  name: z.string().trim().min(1).max(80),
  instructions: z.string().trim().max(2000),
}).strict();
export const FitnessLibraryResultSchema = z
  .object({ exercise: FitnessLibraryExerciseSchema.nullable(), replayed: z.boolean() })
  .strict();
export type FitnessLibraryExercise = z.infer<typeof FitnessLibraryExerciseSchema>;
export type FitnessLibraryCommand = z.infer<typeof FitnessLibraryCommandSchema>;
export type SaveFitnessLibraryExercise = z.infer<typeof SaveFitnessLibraryExerciseSchema>;
export type FitnessLibraryResult = z.infer<typeof FitnessLibraryResultSchema>;
