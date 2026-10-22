import type {
  HelperErrorCode,
  HelperOutcome,
  HelperOutput,
  HelperVerb,
  Snapshot,
} from "../core/helper/helperProtocol.ts";

const ROLE_COLUMN_WIDTH = 18;

const permissionHints: Partial<Record<HelperErrorCode, string>> = {
  accessibility_denied:
    "Grant Accessibility to your terminal app: System Settings > Privacy & Security > Accessibility, then restart the console.",
  screen_recording_denied:
    "Grant Screen Recording to your terminal app: System Settings > Privacy & Security > Screen & System Audio Recording, then restart the console.",
};

export function printOutcome<Verb extends HelperVerb>(
  outcome: HelperOutcome<Verb>,
  printOutput: (output: HelperOutput<Verb>) => void,
): void {
  if (outcome.ok) {
    printOutput(outcome.output);
    return;
  }
  console.log(`  failed: ${outcome.error.code}, ${outcome.error.message}`);
  const hint = permissionHints[outcome.error.code];
  if (hint) console.log(`  ${hint}`);
}

export function printSnapshot(snapshot: Snapshot): void {
  const truncation = snapshot.truncated ? ", stopped at the budget" : "";
  console.log(
    `  ${snapshot.app.name} | ${snapshot.window.title ?? "untitled window"} | ${snapshot.elements.length} elements in ${snapshot.elapsedMs} ms${truncation}`,
  );
  for (const display of snapshot.displays) {
    const { x, y, width, height } = display.frame;
    console.log(
      `  display ${display.id}${display.main ? " (main)" : ""}: ${width}x${height} at ${x},${y}, scale ${display.scale}`,
    );
  }
  for (const element of snapshot.elements) {
    const actions =
      element.actions.length > 0 ? ` [${element.actions.join(", ")}]` : "";
    console.log(
      `  ${element.ref.padEnd(6)}${element.role.padEnd(ROLE_COLUMN_WIDTH)}${element.label ?? ""}${actions}`,
    );
  }
}
