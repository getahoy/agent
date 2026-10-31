import { agentCopy } from "../../copy/agentCopy.ts";
import { Button } from "../components/ui/button.tsx";
import { CheckBadge } from "../components/ui/checkBadge.tsx";
import { NoticeRow } from "../components/ui/noticeRow.tsx";
import { PennantMark } from "../components/ui/pennantMark.tsx";
import { StatusPill } from "../components/ui/statusPill.tsx";
import { Switch } from "../components/ui/switch.tsx";
import { Text } from "../components/ui/text.tsx";
import { GalleryPair } from "./galleryPair.tsx";

const variants = [
  "primary",
  "secondary",
  "ghost",
  "destructive",
  "quietDestructive",
] as const;
const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
const textVariants = [
  "display",
  "setup",
  "title",
  "body",
  "muted",
  "eyebrow",
  "heard",
  "heardSmall",
] as const;

export function GalleryPrimitives() {
  return (
    <>
      <GalleryPair label="button">
        <div className="flex flex-col gap-3">
          {variants.map((variant) => (
            <div key={variant} className="flex items-center gap-2">
              {sizes.map((size) => (
                <Button key={size} variant={variant} size={size}>
                  {variant}
                </Button>
              ))}
              <Button variant={variant} pending>
                {variant}
              </Button>
              <Button variant={variant} disabled>
                {variant}
              </Button>
            </div>
          ))}
        </div>
      </GalleryPair>
      <GalleryPair label="switch · pill · badge · mark">
        <div className="flex items-center gap-4">
          <Switch checked />
          <Switch checked={false} />
          <StatusPill label={agentCopy["status.encrypted"]} />
          <StatusPill label={agentCopy["status.paused"]} tone="quiet" />
          <StatusPill size="sm" label={agentCopy["status.off"]} tone="quiet" />
          <CheckBadge />
          <PennantMark className="h-6.5 w-8.5" />
        </div>
      </GalleryPair>
      <GalleryPair label="notice row">
        <div className="flex w-popover flex-col gap-2">
          <NoticeRow>{agentCopy["menubar.locked"]}</NoticeRow>
          <NoticeRow tone="problem">{agentCopy["helper.stopped"]}</NoticeRow>
        </div>
      </GalleryPair>
      <GalleryPair label="text">
        <div className="flex w-setup flex-col gap-2">
          {textVariants.map((variant) => (
            <Text key={variant} variant={variant}>
              {variant} {agentCopy["welcome.titleEmphasis"]}
            </Text>
          ))}
        </div>
      </GalleryPair>
    </>
  );
}
