import type { PhoneEndReason } from "../core/pairing/endedByPhone.ts";

type EndedMessageCopy = {
  title: string;
  before: string;
  after: string;
  afterOnPairPage: string;
  popover: (phone: string) => string;
};

export const endedCopy: Record<PhoneEndReason, EndedMessageCopy> = {
  removed: {
    title: "Disconnected from your iPhone.",
    before: "",
    after: " removed this Mac. Scan this code with the Ahoy app to pair again.",
    afterOnPairPage: " removed this Mac. This code still works for any iPhone.",
    popover: (phone) => `${phone} removed this Mac.`,
  },
  signed_out: {
    title: "Signed out on your iPhone.",
    before: "You signed out of Ahoy on ",
    after: ", which also unpaired this Mac. Scan this code to pair again.",
    afterOnPairPage:
      ", which also unpaired this Mac. This code still works for any iPhone.",
    popover: (phone) => `You signed out of Ahoy on ${phone}.`,
  },
};

export const endedWhenCopy = {
  justNow: "Just now",
  minutes: (count: number) =>
    count === 1 ? "1 minute ago" : `${count} minutes ago`,
  hours: (count: number) => (count === 1 ? "1 hour ago" : `${count} hours ago`),
  whileAsleep: (when: string) => `${when} · while this Mac was asleep`,
};

export const endedNotificationCopy: Record<
  PhoneEndReason,
  { title: (phone: string) => string; body: string }
> = {
  removed: {
    title: (phone) => `Disconnected from ${phone}`,
    body: "It removed this Mac. Open Ahoy to pair again.",
  },
  signed_out: {
    title: (phone) => `Signed out on ${phone}`,
    body: "This Mac is no longer paired. Open Ahoy to pair again.",
  },
};
