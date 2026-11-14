import AppKit
import ApplicationServices

let sparseTreeThreshold = 10
let manualAccessibilityWaitSeconds = 0.3

struct AppIdentity: Encodable {
  let name: String
  let bundleId: String?
  let pid: Int32
}

struct WindowSummary: Encodable {
  let title: String?
  let frame: Rect
}

struct SnapshotOutput: Encodable {
  let app: AppIdentity
  let window: WindowSummary
  let displays: [DisplaySummary]
  let elements: [SnapshotElement]
  let truncated: Bool
  let elapsedMs: Int
}

func takeSnapshot() throws -> SnapshotOutput {
  guard AXIsProcessTrusted() else { throw HelperError.accessibilityDenied }
  let started = ContinuousClock.now
  let front = try frontWindow()
  let (app, appElement, window, bounds) = (front.app, front.appElement, front.window, front.frame)
  var outcome = walkWindow(window, visibleBounds: bounds)
  if outcome.elements.count < sparseTreeThreshold {
    outcome = rewalkWithManualAccessibility(appElement, window: window, bounds: bounds)
  }
  replaceRegisteredElements(outcome.elementsByRef)
  return SnapshotOutput(
    app: AppIdentity(
      name: app.localizedName ?? "", bundleId: app.bundleIdentifier, pid: app.processIdentifier),
    window: WindowSummary(title: Accessibility.string(window, kAXTitleAttribute), frame: Rect(bounds)),
    displays: activeDisplays(), elements: outcome.elements, truncated: outcome.truncated,
    elapsedMs: milliseconds(since: started))
}

struct FrontWindow {
  let app: NSRunningApplication
  let appElement: AXUIElement
  let window: AXUIElement
  let frame: CGRect
}

func frontWindow() throws -> FrontWindow {
  guard let app = NSWorkspace.shared.frontmostApplication else {
    throw HelperError.noFocusedWindow
  }
  let appElement = AXUIElementCreateApplication(app.processIdentifier)
  AXUIElementSetMessagingTimeout(appElement, elementMessagingTimeoutSeconds)
  guard let window = focusedWindow(of: appElement), let frame = Accessibility.frame(window)
  else { throw HelperError.noFocusedWindow }
  return FrontWindow(app: app, appElement: appElement, window: window, frame: frame)
}

private func focusedWindow(of app: AXUIElement) -> AXUIElement? {
  Accessibility.element(app, kAXFocusedWindowAttribute)
    ?? Accessibility.element(app, kAXMainWindowAttribute)
}

private func rewalkWithManualAccessibility(
  _ app: AXUIElement, window: AXUIElement, bounds: CGRect
) -> WalkOutcome {
  AXUIElementSetAttributeValue(app, "AXManualAccessibility" as CFString, kCFBooleanTrue)
  Thread.sleep(forTimeInterval: manualAccessibilityWaitSeconds)
  return walkWindow(window, visibleBounds: bounds)
}

private func milliseconds(since start: ContinuousClock.Instant) -> Int {
  Int((ContinuousClock.now - start) / .milliseconds(1))
}
