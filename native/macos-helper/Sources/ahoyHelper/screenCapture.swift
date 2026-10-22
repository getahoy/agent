import Foundation
import ScreenCaptureKit
import UniformTypeIdentifiers

struct CaptureOutput: Encodable {
  let path: String
  let width: Int
  let height: Int
  let displayId: UInt32
}

func captureDisplay(_ requestedDisplay: UInt32?) async throws -> CaptureOutput {
  guard CGPreflightScreenCaptureAccess() else {
    CGRequestScreenCaptureAccess()
    throw HelperError.screenRecordingDenied
  }
  let displayId = requestedDisplay ?? CGMainDisplayID()
  let content = try await SCShareableContent.current
  guard let display = content.displays.first(where: { $0.displayID == displayId }) else {
    throw HelperError.invalidRequest("Unknown display \(displayId)")
  }
  let filter = SCContentFilter(display: display, excludingWindows: [])
  let configuration = SCStreamConfiguration()
  configuration.width = Int(filter.contentRect.width * CGFloat(filter.pointPixelScale))
  configuration.height = Int(filter.contentRect.height * CGFloat(filter.pointPixelScale))
  let image = try await SCScreenshotManager.captureImage(
    contentFilter: filter, configuration: configuration)
  let url = FileManager.default.temporaryDirectory
    .appendingPathComponent("ahoy-capture-\(UUID().uuidString).png")
  try writePNG(image, to: url)
  return CaptureOutput(path: url.path, width: image.width, height: image.height, displayId: displayId)
}

private func writePNG(_ image: CGImage, to url: URL) throws {
  guard
    let destination = CGImageDestinationCreateWithURL(
      url as CFURL, UTType.png.identifier as CFString, 1, nil)
  else { throw HelperError.actionFailed("Could not create the capture file") }
  CGImageDestinationAddImage(destination, image, nil)
  guard CGImageDestinationFinalize(destination) else {
    throw HelperError.actionFailed("Could not write the capture file")
  }
}
