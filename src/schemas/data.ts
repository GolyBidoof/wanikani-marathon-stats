import { z } from 'zod';

export const ParticipantEntrySchema = z.object({
  user: z.string(),
  time: z.string().optional(),
  pages: z.union([z.number(), z.string()]).optional(),
  characters: z.union([z.number(), z.string()]).optional(),
  sources: z.union([z.number(), z.string()]).optional(),
  url: z.string().optional(),
});

export const AllStatsSchema = z.record(z.string(), z.array(ParticipantEntrySchema));
export const UsersSchema = z.array(z.string());

export const DataMetaSchema = z.object({
  lastUpdated: z.string(),
});

export type ValidatedAllStats = z.infer<typeof AllStatsSchema>;

export function parseAllStats(data: unknown) {
  return AllStatsSchema.parse(data);
}

export function parseUsers(data: unknown) {
  return UsersSchema.parse(data);
}

export function parseDataMeta(data: unknown) {
  return DataMetaSchema.parse(data);
}
