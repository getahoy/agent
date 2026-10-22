import ApplicationServices

let maximumLabelLength = 200
let elementMessagingTimeoutSeconds: Float = 0.1

let passiveActions: Set<String> = [
  "AXShowMenu", "AXScrollToVisible", "AXShowDefaultUI", "AXShowAlternateUI",
]

enum Accessibility {
  static func string(_ element: AXUIElement, _ attribute: String) -> String? {
    var raw: CFTypeRef?
    guard AXUIElementCopyAttributeValue(element, attribute as CFString, &raw) == .success,
      let text = raw as? String, !text.isEmpty
    else { return nil }
    return text
  }

  static func element(_ element: AXUIElement, _ attribute: String) -> AXUIElement? {
    var raw: CFTypeRef?
    guard AXUIElementCopyAttributeValue(element, attribute as CFString, &raw) == .success,
      let raw, CFGetTypeID(raw) == AXUIElementGetTypeID()
    else { return nil }
    return unsafeDowncast(raw, to: AXUIElement.self)
  }

  static func children(_ element: AXUIElement) -> [AXUIElement] {
    var raw: CFTypeRef?
    guard AXUIElementCopyAttributeValue(element, kAXChildrenAttribute as CFString, &raw) == .success
    else { return [] }
    return raw as? [AXUIElement] ?? []
  }

  static func meaningfulActions(_ element: AXUIElement) -> [String] {
    var names: CFArray?
    guard AXUIElementCopyActionNames(element, &names) == .success, let names = names as? [String]
    else { return [] }
    return names.filter { !passiveActions.contains($0) }
  }

  static func label(_ element: AXUIElement) -> String? {
    let text =
      string(element, kAXTitleAttribute)
      ?? string(element, kAXDescriptionAttribute)
      ?? string(element, kAXValueAttribute)
    return text.map { String($0.prefix(maximumLabelLength)) }
  }

  static func frame(_ element: AXUIElement) -> CGRect? {
    var origin = CGPoint.zero
    var size = CGSize.zero
    guard let position = axValue(element, kAXPositionAttribute),
      AXValueGetValue(position, .cgPoint, &origin),
      let extent = axValue(element, kAXSizeAttribute),
      AXValueGetValue(extent, .cgSize, &size)
    else { return nil }
    return CGRect(origin: origin, size: size)
  }

  private static func axValue(_ element: AXUIElement, _ attribute: String) -> AXValue? {
    var raw: CFTypeRef?
    guard AXUIElementCopyAttributeValue(element, attribute as CFString, &raw) == .success,
      let raw, CFGetTypeID(raw) == AXValueGetTypeID()
    else { return nil }
    return unsafeDowncast(raw, to: AXValue.self)
  }
}
