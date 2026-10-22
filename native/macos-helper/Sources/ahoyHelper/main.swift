import Foundation

func shutDown() -> Never {
  releaseModifierKeys()
  exit(0)
}

func stopOnSignal(_ signalNumber: Int32) -> DispatchSourceSignal {
  signal(signalNumber, SIG_IGN)
  let source = DispatchSource.makeSignalSource(signal: signalNumber, queue: .main)
  source.setEventHandler { shutDown() }
  source.resume()
  return source
}

nonisolated func readRequests() {
  while let line = readLine() {
    DispatchQueue.main.async { MainActor.assumeIsolated { route(line) } }
  }
  DispatchQueue.main.async { MainActor.assumeIsolated { shutDown() } }
}

releaseModifierKeys()
watchDisplayChanges()
let signalSources = [stopOnSignal(SIGTERM), stopOnSignal(SIGINT)]
writeLine(EventLine(event: "ready", protocolVersion: helperProtocolVersion))
Thread.detachNewThread(readRequests)
RunLoop.main.run()
