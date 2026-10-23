import { z } from "zod";

const agentEnvSchema = z.object({ VITE_AHOY_API_URL: z.url() });

export type AgentEnv = z.infer<typeof agentEnvSchema>;

export function parseAgentEnv(): AgentEnv {
  const parsed = agentEnvSchema.safeParse(import.meta.env);
  if (parsed.success) return parsed.data;
  throw new Error(
    `Invalid agent environment\n${z.prettifyError(parsed.error)}`,
  );
}
