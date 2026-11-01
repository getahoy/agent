import { motion } from "motion/react";
import { endedCopy } from "../../copy/endedCopy.ts";
import type { EndedByPhone } from "../../core/pairing/endedByPhone.ts";
import { Text } from "../components/ui/text.tsx";
import { useMessageEnter } from "../lib/motion.ts";
import { endedWhen } from "../phone/phoneLinkCopy.ts";

type EndedMessageProps = {
  notice: EndedByPhone;
  place: "home" | "pairPage";
};

export function EndedMessage({ notice, place }: EndedMessageProps) {
  const enter = useMessageEnter();
  const copy = endedCopy[notice.reason];
  return (
    <motion.div
      {...enter}
      role="status"
      aria-live="polite"
      className="flex max-w-110 flex-col gap-2.5"
    >
      <Text variant="eyebrow" className="text-driftwood">
        {endedWhen(notice, Date.now())}
      </Text>
      <Text as="h1" variant="title">
        {copy.title}
      </Text>
      <p className="text-body-sm text-driftwood">
        {copy.before}
        <span className="font-medium text-ink">{notice.deviceName}</span>
        {place === "home" ? copy.after : copy.afterOnPairPage}
      </p>
    </motion.div>
  );
}
