import type { AgentState } from "../../core/appState/appState.ts";
import { PairingPanel } from "../pairing/pairingPanel.tsx";
import { PopoverContent } from "../popover/popoverContent.tsx";
import { PermissionsStep } from "../setup/permissionsStep.tsx";
import { SetupFrame } from "../setup/setupFrame.tsx";
import { WelcomeStep } from "../setup/welcomeStep.tsx";
import { WindowApp } from "../window/windowApp.tsx";
import type { WindowPage } from "../window/windowPage.ts";
import { GalleryPair } from "./galleryPair.tsx";
import { GalleryPrimitives } from "./galleryPrimitives.tsx";
import { GallerySection } from "./gallerySection.tsx";
import { pairingStates, phoneStates, setupStates } from "./galleryStates.ts";
import { GalleryWindowFrame } from "./galleryWindowFrame.tsx";

const pages: readonly WindowPage[] = [
  "home",
  "phone",
  "permissions",
  "settings",
  "account",
];

const pairedStates = Object.entries(phoneStates).filter(
  ([, state]) => state.pairedPhones.length > 0,
);

function windowFrame(state: AgentState, page: WindowPage) {
  return (
    <GalleryWindowFrame>
      <WindowApp state={state} initialPage={page} />
    </GalleryWindowFrame>
  );
}

export function GalleryApp() {
  return (
    <main className="flex flex-col gap-10 overflow-y-auto p-10 select-text">
      <GallerySection title="Primitives">
        <GalleryPrimitives />
      </GallerySection>
      <GallerySection title="Popover">
        {Object.entries(phoneStates).map(([label, state]) => (
          <GalleryPair key={label} label={label}>
            <div className="flex w-popover flex-col gap-2.5 rounded-popover bg-material p-3">
              <PopoverContent state={state} />
            </div>
          </GalleryPair>
        ))}
      </GallerySection>
      <GallerySection title="Main window">
        {pages.map((page) => (
          <GalleryPair key={page} label={page}>
            {windowFrame(phoneStates.connected, page)}
          </GalleryPair>
        ))}
        {pairedStates.map(([label, state]) => (
          <GalleryPair key={label} label={`home · ${label}`}>
            {windowFrame(state, "home")}
          </GalleryPair>
        ))}
      </GallerySection>
      <GallerySection title="Setup">
        <GalleryPair label="welcome">
          <GalleryWindowFrame>
            <WelcomeStep />
          </GalleryWindowFrame>
        </GalleryPair>
        {Object.entries(setupStates).map(([label, state]) => (
          <GalleryPair key={label} label={label}>
            <GalleryWindowFrame>
              <PermissionsStep permissions={state.permissions} />
            </GalleryWindowFrame>
          </GalleryPair>
        ))}
        {Object.entries(pairingStates).map(([label, status]) => (
          <GalleryPair key={label} label={`pair · ${label}`}>
            <GalleryWindowFrame>
              <SetupFrame step={2}>
                <PairingPanel status={status} />
              </SetupFrame>
            </GalleryWindowFrame>
          </GalleryPair>
        ))}
      </GallerySection>
    </main>
  );
}
