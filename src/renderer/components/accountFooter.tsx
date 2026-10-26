import { homeCopy } from "../../copy/homeCopy.ts";

type AccountFooterProps = { email: string; onSignOut: () => void };

export function AccountFooter({ email, onSignOut }: AccountFooterProps) {
  return (
    <p className="flex items-center gap-2 text-muted text-xs">
      <span>
        {homeCopy.signedInAs} {email}
      </span>
      <span aria-hidden="true">·</span>
      <button type="button" onClick={onSignOut} className="text-primary">
        {homeCopy.signOut}
      </button>
    </p>
  );
}
