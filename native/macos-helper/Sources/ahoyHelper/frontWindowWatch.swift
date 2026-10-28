import AppKit
import ApplicationServices

private var activationObserver: NSObjectProtocol?
private var windowObserver: AXObserver?

func watchFrontWindow() {
  activationObserver = NSWorkspace.shared.notificationCenter.addObserver(
    forName: NSWorkspace.didActivateApplicationNotification, object: nil, queue: .main
  ) { _ in MainActor.assumeIsolated { frontWindowChanged() } }
  observeFocusedWindow()
}

func stopWatchingFrontWindow() {
  if let activationObserver {
    NSWorkspace.shared.notificationCenter.removeObserver(activationObserver)
  }
  activationObserver = nil
  if let windowObserver {
    CFRunLoopRemoveSource(
      CFRunLoopGetMain(), AXObserverGetRunLoopSource(windowObserver), .defaultMode)
  }
  windowObserver = nil
}

private func observeFocusedWindow() {
  guard let app = NSWorkspace.shared.frontmostApplication else { return }
  var observer: AXObserver?
  let callback: AXObserverCallback = { _, _, _, _ in
    MainActor.assumeIsolated { frontWindowChanged() }
  }
  guard AXObserverCreate(app.processIdentifier, callback, &observer) == .success,
    let observer
  else { return }
  let appElement = AXUIElementCreateApplication(app.processIdentifier)
  for notification in [kAXFocusedWindowChangedNotification, kAXMainWindowChangedNotification] {
    AXObserverAddNotification(observer, appElement, notification as CFString, nil)
  }
  CFRunLoopAddSource(CFRunLoopGetMain(), AXObserverGetRunLoopSource(observer), .defaultMode)
  windowObserver = observer
}

private func frontWindowChanged() {
  clearOverlay()
  writeLine(EventLine(event: "frontWindowChanged", protocolVersion: nil))
}
