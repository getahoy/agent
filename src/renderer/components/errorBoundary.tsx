import { Component, type ReactNode } from "react";
import { agentCopy } from "../../copy/agentCopy.ts";
import { Button } from "./ui/button.tsx";
import { Text } from "./ui/text.tsx";

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { failed: boolean };

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main
        role="alert"
        className="flex h-full flex-col items-center justify-center gap-4 bg-sailcloth p-8 text-center"
      >
        <Text variant="body">{agentCopy["error.message"]}</Text>
        <Button onClick={() => this.setState({ failed: false })}>
          {agentCopy["error.retry"]}
        </Button>
      </main>
    );
  }
}
