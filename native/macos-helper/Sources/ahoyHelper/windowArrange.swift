import AppKit
import ApplicationServices

let fullScreenAttribute = "AXFullScreen"

struct WindowOutput: Encodable {
  let app: String
}

func arrangeFrontWindow(_ action: String?) throws -> WindowOutput {
  guard AXIsProcessTrusted() else { throw HelperError.accessibilityDenied }
  let front = try frontWindow()
  switch action {
  case "fullScreen": try setFlag(front.window, fullScreenAttribute, kCFBooleanTrue)
  case "exitFullScreen": try setFlag(front.window, fullScreenAttribute, kCFBooleanFalse)
  case "minimize": try setFlag(front.window, kAXMinimizedAttribute, kCFBooleanTrue)
  case "fill": try setFrame(front.window, screenArea(of: front.frame).visible)
  case "leftHalf": try setFrame(front.window, halves(of: front.frame).slice)
  case "rightHalf": try setFrame(front.window, halves(of: front.frame).remainder)
  case "nextDisplay": try moveToNextDisplay(front)
  default: throw HelperError.invalidRequest("Unknown window action")
  }
  return WindowOutput(app: front.app.localizedName ?? "")
}

private struct ScreenArea {
  let index: Int
  let visible: CGRect
}

// The flip between the two origins is its own inverse, so it also turns AppKit into Accessibility.
private func visibleAreas() -> [CGRect] {
  NSScreen.screens.map { cocoaRect(fromAccessibility: $0.visibleFrame) }
}

private func screenArea(of window: CGRect) -> ScreenArea {
  let areas = visibleAreas()
  let centre = CGPoint(x: window.midX, y: window.midY)
  let index = areas.firstIndex { $0.contains(centre) } ?? 0
  return ScreenArea(index: index, visible: areas[index])
}

private func halves(of window: CGRect) -> (slice: CGRect, remainder: CGRect) {
  let visible = screenArea(of: window).visible
  return visible.divided(atDistance: visible.width / 2, from: .minXEdge)
}

private func moveToNextDisplay(_ front: FrontWindow) throws {
  let areas = visibleAreas()
  guard areas.count > 1 else { throw HelperError.oneDisplay }
  let from = screenArea(of: front.frame)
  let to = areas[(from.index + 1) % areas.count]
  let scaleX = to.width / from.visible.width
  let scaleY = to.height / from.visible.height
  let moved = CGRect(
    x: to.minX + (front.frame.minX - from.visible.minX) * scaleX,
    y: to.minY + (front.frame.minY - from.visible.minY) * scaleY,
    width: front.frame.width * scaleX, height: front.frame.height * scaleY)
  if isSettable(front.window, kAXSizeAttribute) {
    try setFrame(front.window, moved)
    return
  }
  guard isSettable(front.window, kAXPositionAttribute) else { throw HelperError.notResizable }
  setPosition(front.window, moved.origin)
}

private func isSettable(_ window: AXUIElement, _ attribute: String) -> Bool {
  var settable: DarwinBoolean = false
  let status = AXUIElementIsAttributeSettable(window, attribute as CFString, &settable)
  return status == .success && settable.boolValue
}

private func setFlag(_ window: AXUIElement, _ attribute: String, _ flag: CFBoolean) throws {
  guard isSettable(window, attribute) else { throw HelperError.notResizable }
  let status = AXUIElementSetAttributeValue(window, attribute as CFString, flag)
  guard status == .success else { throw HelperError.actionFailed("The window refused the change") }
}

// A window cannot grow past the screen it is on, so it moves first, resizes, then settles.
private func setFrame(_ window: AXUIElement, _ frame: CGRect) throws {
  guard isSettable(window, kAXSizeAttribute), isSettable(window, kAXPositionAttribute) else {
    throw HelperError.notResizable
  }
  setPosition(window, frame.origin)
  var size = frame.size
  if let value = AXValueCreate(.cgSize, &size) {
    AXUIElementSetAttributeValue(window, kAXSizeAttribute as CFString, value)
  }
  setPosition(window, frame.origin)
}

private func setPosition(_ window: AXUIElement, _ origin: CGPoint) {
  var point = origin
  guard let value = AXValueCreate(.cgPoint, &point) else { return }
  AXUIElementSetAttributeValue(window, kAXPositionAttribute as CFString, value)
}
