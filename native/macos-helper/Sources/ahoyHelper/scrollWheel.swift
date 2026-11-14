import ApplicationServices

let scrollBurstEvents = 12
let scrollBurstMicroseconds = 250_000
let scrollSigns: [String: Int32] = ["up": 1, "down": -1]

struct ScrollOutput: Encodable {
  let pixels: Int
}

// Many small events over a moment scroll like a trackpad; one large event jumps.
// Their location sends them to the front window, not whatever sits under the pointer.
func scrollFrontWindow(_ direction: String?, windowHeights: Double?) throws -> ScrollOutput {
  guard AXIsProcessTrusted() else { throw HelperError.accessibilityDenied }
  guard let direction, let sign = scrollSigns[direction] else {
    throw HelperError.invalidRequest("Unknown scroll direction")
  }
  guard let windowHeights, windowHeights > 0 else {
    throw HelperError.invalidRequest("Nothing to scroll")
  }
  let front = try frontWindow()
  let centre = CGPoint(x: front.frame.midX, y: front.frame.midY)
  let pixels = max(scrollBurstEvents, Int((front.frame.height * windowHeights).rounded()))
  for index in 0..<scrollBurstEvents {
    let share = pixels / scrollBurstEvents + (index < pixels % scrollBurstEvents ? 1 : 0)
    let event = CGEvent(
      scrollWheelEvent2Source: nil, units: .pixel, wheelCount: 1, wheel1: Int32(share) * sign,
      wheel2: 0, wheel3: 0)
    event?.location = centre
    event?.post(tap: .cghidEventTap)
    usleep(useconds_t(scrollBurstMicroseconds / scrollBurstEvents))
  }
  return ScrollOutput(pixels: pixels)
}
