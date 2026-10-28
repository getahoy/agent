import ApplicationServices

let maximumSnapshotElements = 500
let snapshotTimeBudget = Duration.milliseconds(150)

struct SnapshotElement: Encodable {
  let ref: String
  let role: String
  let label: String?
  let title: String?
  let description: String?
  let help: String?
  let placeholder: String?
  let subrole: String?
  let enabled: Bool
  let actions: [String]
  let frame: Rect?
}

private let describingAttributes = [
  kAXTitleAttribute, kAXDescriptionAttribute, kAXHelpAttribute,
  kAXPlaceholderValueAttribute, kAXSubroleAttribute, kAXRoleAttribute,
]

struct WalkOutcome {
  var elements: [SnapshotElement] = []
  var elementsByRef: [String: AXUIElement] = [:]
  var truncated = false
}

func walkWindow(_ window: AXUIElement, visibleBounds: CGRect) -> WalkOutcome {
  let deadline = ContinuousClock.now + snapshotTimeBudget
  var queue = [window]
  var nextIndex = 0
  var outcome = WalkOutcome()
  while nextIndex < queue.count {
    if outcome.elements.count >= maximumSnapshotElements || ContinuousClock.now >= deadline {
      outcome.truncated = true
      break
    }
    let element = queue[nextIndex]
    nextIndex += 1
    let frame = Accessibility.frame(element)
    if let frame, !frame.isEmpty, !frame.intersects(visibleBounds) { continue }
    collect(element, frame: frame, into: &outcome)
    queue.append(contentsOf: Accessibility.children(element))
  }
  return outcome
}

private func collect(_ element: AXUIElement, frame: CGRect?, into outcome: inout WalkOutcome) {
  let label = Accessibility.label(element)
  let actions = Accessibility.meaningfulActions(element)
  let texts = Accessibility.strings(element, describingAttributes)
  guard label != nil || !actions.isEmpty || texts.prefix(4).contains(where: { $0 != nil })
  else { return }
  let ref = "e\(outcome.elements.count + 1)"
  outcome.elements.append(
    SnapshotElement(
      ref: ref, role: texts[5] ?? "AXUnknown", label: label, title: texts[0],
      description: texts[1], help: texts[2], placeholder: texts[3], subrole: texts[4],
      enabled: Accessibility.bool(element, kAXEnabledAttribute) ?? true, actions: actions,
      frame: frame.map(Rect.init)))
  outcome.elementsByRef[ref] = element
}
