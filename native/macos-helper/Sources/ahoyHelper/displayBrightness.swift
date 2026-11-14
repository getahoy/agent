import CoreGraphics
import Foundation

let displayServicesPath = "/System/Library/PrivateFrameworks/DisplayServices.framework/DisplayServices"
let fullBrightness: Float = 100

struct BrightnessOutput: Encodable {
  let level: Int
}

private typealias GetBrightness = @convention(c) (CGDirectDisplayID, UnsafeMutablePointer<Float>)
  -> Int32
private typealias SetBrightness = @convention(c) (CGDirectDisplayID, Float) -> Int32

// DisplayServices is private and can change with macOS, so it is looked up at run time:
// a missing symbol becomes "unavailable" and the agent falls back to the brightness keys.
private let displayServices = dlopen(displayServicesPath, RTLD_LAZY)

private func displayServicesFunction<Function>(_ name: String, as _: Function.Type) -> Function? {
  guard let displayServices, let address = dlsym(displayServices, name) else { return nil }
  return unsafeBitCast(address, to: Function.self)
}

func displayBrightness(setTo level: Int?) throws -> BrightnessOutput {
  guard let display = builtInDisplay() else { throw HelperError.noBuiltInDisplay }
  guard
    let getBrightness = displayServicesFunction(
      "DisplayServicesGetBrightness", as: GetBrightness.self),
    let setBrightness = displayServicesFunction(
      "DisplayServicesSetBrightness", as: SetBrightness.self)
  else { throw HelperError.unavailable("DisplayServices is missing") }
  if let level, setBrightness(display, Float(level) / fullBrightness) != 0 {
    throw HelperError.unavailable("The display refused the brightness")
  }
  var current: Float = 0
  guard getBrightness(display, &current) == 0 else {
    throw HelperError.unavailable("The display did not report its brightness")
  }
  return BrightnessOutput(level: Int((current * fullBrightness).rounded()))
}

private func builtInDisplay() -> CGDirectDisplayID? {
  activeDisplays().map(\.id).first { CGDisplayIsBuiltin($0) != 0 }
}
