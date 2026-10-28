import CoreGraphics

struct Rect: Encodable {
  let x: Double
  let y: Double
  let width: Double
  let height: Double

  init(_ rect: CGRect) {
    x = rect.origin.x
    y = rect.origin.y
    width = rect.size.width
    height = rect.size.height
  }
}

struct DisplaySummary: Encodable {
  let id: UInt32
  let frame: Rect
  let scale: Double
  let main: Bool
}

// Accessibility frames are global points with the origin at the main display's top left;
// AppKit windows use points from its bottom left. Points need no Retina scaling.
func cocoaRect(fromAccessibility rect: CGRect) -> CGRect {
  let mainHeight = CGDisplayBounds(CGMainDisplayID()).height
  return CGRect(
    x: rect.minX, y: mainHeight - rect.maxY, width: rect.width, height: rect.height)
}

func activeDisplays() -> [DisplaySummary] {
  var count: UInt32 = 0
  CGGetActiveDisplayList(0, nil, &count)
  var ids = [CGDirectDisplayID](repeating: 0, count: Int(count))
  CGGetActiveDisplayList(count, &ids, &count)
  return ids.map { id in
    DisplaySummary(
      id: id, frame: Rect(CGDisplayBounds(id)), scale: pixelScale(of: id),
      main: CGDisplayIsMain(id) != 0)
  }
}

private func pixelScale(of display: CGDirectDisplayID) -> Double {
  guard let mode = CGDisplayCopyDisplayMode(display), mode.width > 0 else { return 1 }
  return Double(mode.pixelWidth) / Double(mode.width)
}

func watchDisplayChanges() {
  CGDisplayRegisterReconfigurationCallback(
    { _, flags, _ in
      guard !flags.contains(.beginConfigurationFlag) else { return }
      MainActor.assumeIsolated {
        writeLine(EventLine(event: "displaysChanged", protocolVersion: nil))
      }
    }, nil)
}
