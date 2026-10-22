import { Component, type ReactNode } from "react";
import { agentCopy } from "../../copy/agentCopy.ts";
import { ActionButton } from "./actionButton.tsx";

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
      <main className="flex min-h-screen flex-col gap-4 p-8">
        <p role="alert">{agentCopy["error.message"]}</p>
        <div>
          <ActionButton onPress={() => this.setState({ failed: false })}>
            {agentCopy["error.retry"]}
          </ActionButton>
        </div>
      </main>
    );
  }
}
