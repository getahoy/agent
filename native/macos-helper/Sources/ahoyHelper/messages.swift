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
}

enum HelperError: Error {
  case accessibilityDenied
  case screenRecordingDenied
  case secureInput
  case unknownRef
  case noFocusedWindow
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
    case .notImplemented(let detail), .invalidRequest(let detail), .actionFailed(let detail):
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
