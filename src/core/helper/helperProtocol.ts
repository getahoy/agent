import { z } from "zod";

const rectSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

const displaySchema = z.object({
  id: z.number(),
  frame: rectSchema,
  scale: z.number(),
  main: z.boolean(),
});

const snapshotElementSchema = z.object({
  ref: z.string(),
  role: z.string(),
  label: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  help: z.string().optional(),
  placeholder: z.string().optional(),
  subrole: z.string().optional(),
  enabled: z.boolean().default(true),
  actions: z.array(z.string()),
  frame: rectSchema.optional(),
});

const snapshotSchema = z.object({
  app: z.object({
    name: z.string(),
    bundleId: z.string().optional(),
    pid: z.number(),
  }),
  window: z.object({ title: z.string().optional(), frame: rectSchema }),
  displays: z.array(displaySchema),
  elements: z.array(snapshotElementSchema),
  truncated: z.boolean(),
  elapsedMs: z.number(),
});

export const outputSchemaByVerb = {
  snapshot: snapshotSchema,
  click: z.object({ method: z.enum(["press", "coordinate"]) }),
  key: z.object({ key: z.string(), modifiers: z.array(z.string()) }),
  type: z.object({ characters: z.number() }),
  capture: z.object({
    path: z.string(),
    width: z.number(),
    height: z.number(),
    displayId: z.number(),
  }),
  overlay: z.object({ shown: z.number() }),
} as const;

export type HelperVerb = keyof typeof outputSchemaByVerb;
export type Modifier = "command" | "shift" | "option" | "control";
export type Rect = z.infer<typeof rectSchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;

export type HelperArgs = {
  snapshot: Record<string, never>;
  click: { ref: string };
  key: { key: string; modifiers: readonly Modifier[] };
  type: { text: string };
  capture: { displayId?: number };
  overlay: { marks: readonly { number: number; frame: Rect }[] };
};

export type HelperOutput<Verb extends HelperVerb> = z.infer<
  (typeof outputSchemaByVerb)[Verb]
>;

type OutputParsers = {
  [Verb in HelperVerb]: (output: unknown) => HelperOutput<Verb> | null;
};

function parseOrNull<Schema extends z.ZodType>(
  schema: Schema,
  output: unknown,
): z.output<Schema> | null {
  const parsed = schema.safeParse(output);
  return parsed.success ? parsed.data : null;
}

export const outputParsers: OutputParsers = {
  snapshot: (output) => parseOrNull(outputSchemaByVerb.snapshot, output),
  click: (output) => parseOrNull(outputSchemaByVerb.click, output),
  key: (output) => parseOrNull(outputSchemaByVerb.key, output),
  type: (output) => parseOrNull(outputSchemaByVerb.type, output),
  capture: (output) => parseOrNull(outputSchemaByVerb.capture, output),
  overlay: (output) => parseOrNull(outputSchemaByVerb.overlay, output),
};

const helperErrorCodeSchema = z.enum([
  "accessibility_denied",
  "screen_recording_denied",
  "secure_input",
  "unknown_ref",
  "no_focused_window",
  "not_implemented",
  "invalid_request",
  "action_failed",
]);

export const helperLineSchema = z.union([
  z.object({ event: z.literal("ready"), protocolVersion: z.number() }),
  z.object({ event: z.literal("displaysChanged") }),
  z.object({ event: z.literal("frontWindowChanged") }),
  z.object({ id: z.string(), ok: z.literal(true), output: z.unknown() }),
  z.object({
    id: z.string().optional(),
    ok: z.literal(false),
    error: z.object({ code: helperErrorCodeSchema, message: z.string() }),
  }),
]);

export type HelperLine = z.infer<typeof helperLineSchema>;

export type HelperErrorCode =
  | z.infer<typeof helperErrorCodeSchema>
  | "timeout"
  | "helper_exited"
  | "helper_unavailable"
  | "invalid_output";

export type HelperOutcome<Verb extends HelperVerb> =
  | { ok: true; output: HelperOutput<Verb> }
  | { ok: false; error: { code: HelperErrorCode; message: string } };

export type HelperEvent =
  | "ready"
  | "displaysChanged"
  | "frontWindowChanged"
  | "exited";
