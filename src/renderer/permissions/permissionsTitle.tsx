import { agentCopy } from "../../copy/agentCopy.ts";
import { Text } from "../components/ui/text.tsx";

type PermissionsTitleProps = { variant: "title" | "setup" };

export function PermissionsTitle({ variant }: PermissionsTitleProps) {
  return (
    <Text as="h1" variant={variant}>
      {agentCopy["permissions.title"]}{" "}
      <em>{agentCopy["permissions.titleEmphasis"]}</em>
    </Text>
  );
}
