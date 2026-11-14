import Foundation

let helperProtocolVersion = 1

struct HelperRequest: Decodable {
  let id: String
  let verb: String
  let args: RequestArguments?
}

struct RequestArguments: Decodable {
  let ref: String?
  let key: String?
  let modifiers: [String]?
  let text: String?
  let displayId: UInt32?
  let marks: [OverlayMark]?
  let direction: String?
  let windowHeights: Double?
  let action: String?
  let level: Int?
}

enum HelperError: Error {
  case accessibilityDenied
  case screenRecordingDenied
  case secureInput
  case unknownRef
  case noFocusedWindow
  case notResizable
  case oneDisplay
  case noBuiltInDisplay
  case unavailable(String)
  case notImplemented(String)
  case invalidRequest(String)
  case actionFailed(String)

  var code: String {
    switch self {
    case .accessibilityDenied: "accessibility_denied"
    case .screenRecordingDenied: "screen_recording_denied"
    case .secureInput: "secure_input"
    case .unknownRef: "unknown_ref"
    case .noFocusedWindow: "no_focused_window"
    case .notResizable: "not_resizable"
    case .oneDisplay: "one_display"
    case .noBuiltInDisplay: "no_built_in_display"
    case .unavailable: "unavailable"
    case .notImplemented: "not_implemented"
    case .invalidRequest: "invalid_request"
    case .actionFailed: "action_failed"
    }
  }

  var message: String {
    switch self {
    case .accessibilityDenied: "Accessibility permission is not granted"
    case .screenRecordingDenied: "Screen Recording permission is not granted"
    case .secureInput: "A password field or secure input is active"
    case .unknownRef: "That element is not in the latest snapshot"
    case .noFocusedWindow: "No focused window"
    case .notResizable: "The window does not allow that change"
    case .oneDisplay: "There is only one display"
    case .noBuiltInDisplay: "No built-in display is on"
    case .unavailable(let detail), .notImplemented(let detail), .invalidRequest(let detail),
      .actionFailed(let detail):
      detail
    }
  }
}

struct ErrorBody: Encodable {
  let code: String
  let message: String

  init(_ error: HelperError) {
    code = error.code
    message = error.message
  }
}

struct SuccessLine<Output: Encodable>: Encodable {
  let id: String
  let ok = true
  let output: Output
}

struct FailureLine: Encodable {
  let id: String?
  let ok = false
  let error: ErrorBody
}

struct EventLine: Encodable {
  let event: String
  let protocolVersion: Int?
}

func writeLine(_ line: some Encodable) {
  guard let bytes = try? JSONEncoder().encode(line), let text = String(bytes: bytes, encoding: .utf8)
  else { return }
  print(text)
  fflush(stdout)
}
