import ApplicationServices

struct ClickOutput: Encodable {
  let method: String
}

func clickElement(ref: String?) throws -> ClickOutput {
  guard AXIsProcessTrusted() else { throw HelperError.accessibilityDenied }
  guard let ref, let element = registeredElement(ref) else { throw HelperError.unknownRef }
  if Accessibility.meaningfulActions(element).contains(kAXPressAction),
    AXUIElementPerformAction(element, kAXPressAction as CFString) == .success
  {
    return ClickOutput(method: "press")
  }
  guard let frame = Accessibility.frame(element), !frame.isEmpty else {
    throw HelperError.actionFailed("The element has no position to click")
  }
  postClick(at: CGPoint(x: frame.midX, y: frame.midY))
  return ClickOutput(method: "coordinate")
}

private func postClick(at point: CGPoint) {
  for type in [CGEventType.leftMouseDown, .leftMouseUp] {
    CGEvent(mouseEventSource: nil, mouseType: type, mouseCursorPosition: point, mouseButton: .left)?
      .post(tap: .cghidEventTap)
  }
}
