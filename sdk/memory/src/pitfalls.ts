/**
 * The two mistakes this example made before it worked, each runnable.
 *
 * Both were found by running the code, not by reading the types, and both produce output that
 * points at the wrong culprit — which is why they are here as commands you can execute rather
 * than as a warning in a README nobody opens at the moment they bite.
 */

import { Agent, PermissionEngine } from "@getloopscale/loopzero-sdk";

type Assistant = Awaited<ReturnType<typeof Agent.create>>;

// #region lesson:pitfall-send-returns-handle
/**
 * `send()` does not return the answer. It starts a run and hands back a HANDLE whose `status` is
 * `"running"` and whose `result` is empty. The text arrives from `wait()`.
 *
 *   WRONG — compiles, runs, prints nothing:
 *     const answer = await agent.send(message);
 *     console.log(answer.result);            // empty: the run has not finished
 *
 * This example was written that way and printed nothing, twice, while the memory file on disk was
 * written correctly. The failure reads as "memory is broken" and is really "the run had not
 * finished" — so the time goes into the wrong half of the system.
 *
 * The separation is deliberate: a caller may want to stream a run rather than block on it.
 */
export async function demonstrateSendReturnsHandle(
  agent: Assistant,
  message: string,
): Promise<{ afterSend: string; afterWait: string; text: string | undefined }> {
  const run = await agent.send(message);
  const afterSend = run.status;

  const finished = await run.wait();
  return { afterSend, afterWait: finished.status, text: finished.result };
}
// #endregion

// #region lesson:pitfall-permission-engine-shape
/**
 * `PermissionEngine` takes its rules POSITIONALLY: an array, not an options object.
 *
 *   WRONG, and refused at construction:
 *     new PermissionEngine({ rules: [...] })
 *
 * Measured against @getloopscale/loopzero-sdk 0.1.0 by the command below: the object form throws a
 * `ConfigurationError` with the code `permission_rules_not_array`. Earlier releases of the SDK
 * constructed it and stored the whole options object in the field meant to hold the array, so no
 * rule could ever match and nothing said so. The refusal is what replaced that silence.
 *
 * A `.mjs` proof script in this project passed the object form for weeks and still observed
 * "nothing was created", the right answer for the wrong reason. The object form typechecks
 * nowhere, which is why the example is TypeScript: `strict` catches it before it runs.
 *
 * An engine with an EMPTY array is not a no-op: with no rule matching, every tool call resolves to
 * `ask`, and with no gate configured to answer, it blocks. The protection is the engine being
 * present, not a rule written in advance against an attack nobody predicted.
 */
export function demonstratePermissionEngineShape(): { positional: unknown; objectForm: unknown } {
  const rule = { tool: "shell", action: "deny" };

  const positional = new PermissionEngine([rule as never]);
  const rulesOf = (engine: unknown) => (engine as { rules: unknown }).rules;

  let objectForm: unknown;
  try {
    // @ts-expect-error: the object form is what this pitfall is about; it typechecks nowhere.
    objectForm = rulesOf(new PermissionEngine({ rules: [rule] }));
  } catch (error) {
    objectForm = { refused: (error as { code?: string }).code };
  }

  return { positional: rulesOf(positional), objectForm };
}
// #endregion
