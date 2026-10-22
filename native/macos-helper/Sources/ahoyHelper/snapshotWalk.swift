import ApplicationServices

let maximumSnapshotElements = 500
let snapshotTimeBudget = Duration.milliseconds(150)

struct SnapshotElement: Encodable {
  let ref: String
  let role: String
  let label: String?
  let actions: [String]
  let frame: Rect?
}

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
  guard label != nil || !actions.isEmpty else { return }
  let ref = "e\(outcome.elements.count + 1)"
  let role = Accessibility.string(element, kAXRoleAttribute) ?? "AXUnknown"
  outcome.elements.append(
    SnapshotElement(ref: ref, role: role, label: label, actions: actions, frame: frame.map(Rect.init)))
  outcome.elementsByRef[ref] = element
}
