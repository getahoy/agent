import AppKit

let badgeSize = 26.0
let badgeFontSize = 14.0

struct OverlayMark: Decodable {
  let number: Int
  let frame: MarkFrame
}

struct MarkFrame: Decodable {
  let x: Double
  let y: Double
  let width: Double
  let height: Double
}

struct OverlayOutput: Encodable {
  let shown: Int
}

private var badgePanels: [NSPanel] = []

func showOverlay(_ marks: [OverlayMark]?) throws -> OverlayOutput {
  clearOverlay()
  badgePanels = (marks ?? []).map(makeBadge)
  if badgePanels.isEmpty { stopWatchingFrontWindow() } else { watchFrontWindow() }
  return OverlayOutput(shown: badgePanels.count)
}

func clearOverlay() {
  for panel in badgePanels { panel.orderOut(nil) }
  badgePanels = []
}

private func makeBadge(_ mark: OverlayMark) -> NSPanel {
  let corner = CGRect(x: mark.frame.x, y: mark.frame.y, width: badgeSize, height: badgeSize)
  let panel = NSPanel(
    contentRect: cocoaRect(fromAccessibility: corner),
    styleMask: [.borderless, .nonactivatingPanel], backing: .buffered, defer: false)
  panel.level = .statusBar
  panel.ignoresMouseEvents = true
  panel.isOpaque = false
  panel.backgroundColor = .clear
  panel.hasShadow = true
  panel.collectionBehavior = [.canJoinAllSpaces, .stationary, .ignoresCycle]
  panel.contentView = badgeView(number: mark.number)
  panel.orderFrontRegardless()
  return panel
}

private func badgeView(number: Int) -> NSView {
  let view = NSView(frame: CGRect(x: 0, y: 0, width: badgeSize, height: badgeSize))
  view.wantsLayer = true
  view.layer?.backgroundColor = NSColor.controlAccentColor.cgColor
  view.layer?.cornerRadius = badgeSize / 2
  let label = NSTextField(labelWithString: "\(number)")
  label.font = .boldSystemFont(ofSize: badgeFontSize)
  label.textColor = .white
  label.alignment = .center
  label.sizeToFit()
  let height = label.frame.height
  label.frame = CGRect(x: 0, y: (badgeSize - height) / 2, width: badgeSize, height: height)
  view.addSubview(label)
  return view
}
