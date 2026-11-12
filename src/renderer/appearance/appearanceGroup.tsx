import { appearanceSchema } from "@getahoy/lib";
import { appearanceCopy } from "../../copy/appearanceCopy.ts";
import { Text } from "../components/ui/text.tsx";
import { AppearanceTile } from "./appearanceTile.tsx";
import { useAppearanceSwitch } from "./useAppearanceSwitch.ts";

export function AppearanceGroup() {
  const { chosen, applied, resolved, choose } = useAppearanceSwitch();
  return (
    <section className="flex flex-col gap-2">
      <Text as="h2" variant="eyebrow" className="pl-0.5 text-driftwood">
        {appearanceCopy.title}
      </Text>
      <div
        role="radiogroup"
        aria-label={appearanceCopy.title}
        className="flex gap-5 rounded-group bg-paper px-4.5 pt-4 pb-3.5"
      >
        {appearanceSchema.options.map((appearance) => (
          <AppearanceTile
            key={appearance}
            appearance={appearance}
            selected={chosen === appearance}
            onChoose={choose}
          />
        ))}
      </div>
      <Text variant="muted" className="px-0.5 text-caption">
        {appearanceCopy.caption(applied, resolved)}
      </Text>
    </section>
  );
}
