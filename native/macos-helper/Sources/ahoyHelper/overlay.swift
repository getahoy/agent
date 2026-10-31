import AppKit

private let tagMinimumSide = 28.0
private let tagPaddingX = 8.0
private let tagCornerRadius = 7.0
private let tagSkewDegrees = 10.0
private let tagFontSize = 16.0
private let ringWidth = 2.0
private let shadowBlur = 12.0
private let shadowDrop = 4.0
private let shadowOpacity: Float = 0.35
private let panelMargin = 14.0
private let inkColor = NSColor(srgbRed: 0x17 / 255, green: 0x16 / 255, blue: 0x14 / 255, alpha: 1)
private let sailclothColor = NSColor(srgbRed: 0xf4 / 255, green: 0xf2 / 255, blue: 0xed / 255, alpha: 1)

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

func showOverlay(_ marks: [OverlayMark]?) -> OverlayOutput {
  clearOverlay()
  badgePanels = (marks ?? []).map(makeBadge)
  if !badgePanels.isEmpty { watchFrontWindow() }
  return OverlayOutput(shown: badgePanels.count)
}

func clearOverlay() {
  stopWatchingFrontWindow()
  for panel in badgePanels { panel.orderOut(nil) }
  badgePanels = []
}

private func numeralFont() -> NSFont {
  NSFont.monospacedSystemFont(ofSize: tagFontSize, weight: .medium)
}

private func tagSize(number: Int) -> CGSize {
  let text = NSAttributedString(string: "\(number)", attributes: [.font: numeralFont()])
  let width = max(tagMinimumSide, ceil(text.size().width) + tagPaddingX * 2)
  return CGSize(width: width, height: tagMinimumSide)
}

private func makeBadge(_ mark: OverlayMark) -> NSPanel {
  let size = tagSize(number: mark.number)
  let corner = CGRect(
    x: mark.frame.x - panelMargin, y: mark.frame.y - panelMargin,
    width: size.width + panelMargin * 2, height: size.height + panelMargin * 2)
  let panel = NSPanel(
    contentRect: cocoaRect(fromAccessibility: corner),
    styleMask: [.borderless, .nonactivatingPanel], backing: .buffered, defer: false)
  panel.level = .statusBar
  panel.ignoresMouseEvents = true
  panel.isOpaque = false
  panel.backgroundColor = .clear
  panel.hasShadow = false
  panel.collectionBehavior = [.canJoinAllSpaces, .stationary, .ignoresCycle]
  panel.orderFrontRegardless()
  // The panel's own scale is only right once it sits on its screen, so a
  // mark on a second display with a different scale stays sharp.
  let scale = panel.screen?.backingScaleFactor ?? panel.backingScaleFactor
  panel.contentView = badgeView(number: mark.number, tag: size, scale: scale)
  return panel
}

// Leaning the top edge right in a y-up layer matches CSS skewX(-10deg).
private func skewed(_ layer: CALayer) {
  let lean = tan(tagSkewDegrees * .pi / 180)
  layer.setAffineTransform(CGAffineTransform(a: 1, b: 0, c: lean, d: 1, tx: 0, ty: 0))
}

private func ringLayer(around tag: CGRect) -> CALayer {
  let ring = CALayer()
  ring.frame = tag.insetBy(dx: -ringWidth, dy: -ringWidth)
  ring.backgroundColor = sailclothColor.cgColor
  ring.cornerRadius = tagCornerRadius + ringWidth
  ring.shadowColor = NSColor.black.cgColor
  ring.shadowOpacity = shadowOpacity
  ring.shadowRadius = shadowBlur / 2
  ring.shadowOffset = CGSize(width: 0, height: -shadowDrop)
  skewed(ring)
  return ring
}

private func fillLayer(_ tag: CGRect) -> CALayer {
  let fill = CALayer()
  fill.frame = tag
  fill.backgroundColor = inkColor.cgColor
  fill.cornerRadius = tagCornerRadius
  skewed(fill)
  return fill
}

private func numeralLayer(number: Int, in tag: CGRect, scale: CGFloat) -> CATextLayer {
  let font = numeralFont()
  let numeral = CATextLayer()
  let lineHeight = ceil(font.ascender - font.descender)
  numeral.frame = CGRect(
    x: tag.minX, y: tag.midY - lineHeight / 2, width: tag.width, height: lineHeight)
  numeral.string = NSAttributedString(
    string: "\(number)", attributes: [.font: font, .foregroundColor: NSColor.white])
  numeral.alignmentMode = .center
  numeral.contentsScale = scale
  return numeral
}

private func badgeView(number: Int, tag size: CGSize, scale: CGFloat) -> NSView {
  let bounds = CGRect(
    x: 0, y: 0, width: size.width + panelMargin * 2, height: size.height + panelMargin * 2)
  let tag = CGRect(origin: CGPoint(x: panelMargin, y: panelMargin), size: size)
  let view = NSView(frame: bounds)
  view.wantsLayer = true
  guard let root = view.layer else { return view }
  root.addSublayer(ringLayer(around: tag))
  root.addSublayer(fillLayer(tag))
  root.addSublayer(numeralLayer(number: number, in: tag, scale: scale))
  return view
}
