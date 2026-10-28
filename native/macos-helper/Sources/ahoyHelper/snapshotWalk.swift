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
  let clip: Rect
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

private struct Visit {
  let element: AXUIElement
  let clip: CGRect
}

// Content scrolled out of a scroll area is still inside the window, so each scroll area
// narrows the visible region its descendants are clipped to.
func walkWindow(_ window: AXUIElement, visibleBounds: CGRect) -> WalkOutcome {
  let deadline = ContinuousClock.now + snapshotTimeBudget
  var queue = [Visit(element: window, clip: visibleBounds)]
  var nextIndex = 0
  var outcome = WalkOutcome()
  while nextIndex < queue.count {
    if outcome.elements.count >= maximumSnapshotElements || ContinuousClock.now >= deadline {
      outcome.truncated = true
      break
    }
    let visit = queue[nextIndex]
    nextIndex += 1
    let frame = Accessibility.frame(visit.element)
    if let frame, !frame.isEmpty, !frame.intersects(visit.clip) { continue }
    let texts = Accessibility.strings(visit.element, describingAttributes)
    collect(visit, frame: frame, texts: texts, into: &outcome)
    let scrolls = texts[5] == kAXScrollAreaRole
    let childClip = scrolls ? visit.clip.intersection(frame ?? visit.clip) : visit.clip
    queue.append(
      contentsOf: Accessibility.children(visit.element).map { Visit(element: $0, clip: childClip) })
  }
  return outcome
}

private func collect(
  _ visit: Visit, frame: CGRect?, texts: [String?], into outcome: inout WalkOutcome
) {
  let element = visit.element
  let label = Accessibility.label(element)
  let actions = Accessibility.meaningfulActions(element)
  guard label != nil || !actions.isEmpty || texts.prefix(5).contains(where: { $0 != nil })
  else { return }
  let ref = "e\(outcome.elements.count + 1)"
  outcome.elements.append(
    SnapshotElement(
      ref: ref, role: texts[5] ?? "AXUnknown", label: label, title: texts[0],
      description: texts[1], help: texts[2], placeholder: texts[3], subrole: texts[4],
      enabled: Accessibility.bool(element, kAXEnabledAttribute) ?? true, actions: actions,
      frame: frame.map(Rect.init), clip: Rect(visit.clip)))
  outcome.elementsByRef[ref] = element
}
