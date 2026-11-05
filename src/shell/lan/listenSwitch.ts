import type { GoodbyeReason } from "@getahoy/protocol";
import { Notification } from "electron";
import { agentCopy } from "../../copy/agentCopy.ts";
import { type OffDuration, offUntil } from "../../core/appState/listenOff.ts";
import type { AgentController } from "../agentController.ts";

const EXPIRY_CHECK_MS = 30_000;
const REFUSED_NOTICE_GAP_MS = 10 * 60 * 1000;

type ListenSwitchOptions = {
  controller: AgentController;
  endSessions: (reason: GoodbyeReason) => void;
  openWindow: () => void;
};

export class ListenSwitch {
  readonly #options: ListenSwitchOptions;
  #lastNoticeAt = Number.NEGATIVE_INFINITY;
  #notice: Notification | null = null;

  constructor(options: ListenSwitchOptions) {
    this.#options = options;
  }

  start(): void {
    this.#checkExpiry();
    setInterval(() => this.#checkExpiry(), EXPIRY_CHECK_MS);
  }

  turnOn(): Promise<void> {
    return this.#options.controller.turnListeningOn();
  }

  turnOff(duration: OffDuration): Promise<void> {
    this.#options.endSessions("turned_off");
    const until = offUntil(duration, new Date());
    return this.#options.controller.turnListeningOff(until);
  }

  phoneRefused(): void {
    const now = Date.now();
    if (now - this.#lastNoticeAt < REFUSED_NOTICE_GAP_MS) return;
    this.#lastNoticeAt = now;
    this.#showRefusedNotice();
  }

  // Held in a field: a collected Notification drops its click and action handlers.
  #showRefusedNotice(): void {
    const notice = new Notification({
      title: agentCopy["listen.refusedTitle"],
      body: agentCopy["listen.refusedBody"],
      actions: [{ type: "button", text: agentCopy["listen.turnOn"] }],
    });
    notice.on("action", () => void this.turnOn());
    notice.on("click", () => this.#options.openWindow());
    this.#notice?.close();
    this.#notice = notice;
    notice.show();
  }

  // An off time is stored only while listening is off; turning on clears it.
  #checkExpiry(): void {
    const until = this.#options.controller.lanOffUntil();
    if (until !== null && Date.now() >= until) void this.turnOn();
  }
}
