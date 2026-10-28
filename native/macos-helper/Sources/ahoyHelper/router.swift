import Foundation

func route(_ line: String) {
  guard let bytes = line.data(using: .utf8),
    let request = try? JSONDecoder().decode(HelperRequest.self, from: bytes)
  else {
    writeLine(FailureLine(id: nil, error: ErrorBody(.invalidRequest("Unreadable request"))))
    return
  }
  let arguments = request.args
  switch request.verb {
  case "snapshot": respond(request.id) { try takeSnapshot() }
  case "click": respond(request.id) { try clickElement(ref: arguments?.ref) }
  case "key": respond(request.id) { try pressKey(arguments?.key, modifiers: arguments?.modifiers) }
  case "type": respond(request.id) { try typeText(arguments?.text) }
  case "capture":
    Task { await respondLater(request.id) { try await captureDisplay(arguments?.displayId) } }
  case "overlay": respond(request.id) { try showOverlay(arguments?.marks) }
  default: fail(request.id, .invalidRequest("Unknown verb \(request.verb)"))
  }
}

private func respond<Output: Encodable>(_ id: String, _ work: () throws -> Output) {
  do {
    writeLine(SuccessLine(id: id, output: try work()))
  } catch {
    fail(id, asHelperError(error))
  }
}

private func respondLater<Output: Encodable>(_ id: String, _ work: () async throws -> Output) async {
  do {
    writeLine(SuccessLine(id: id, output: try await work()))
  } catch {
    fail(id, asHelperError(error))
  }
}

private func fail(_ id: String, _ error: HelperError) {
  writeLine(FailureLine(id: id, error: ErrorBody(error)))
}

private func asHelperError(_ error: Error) -> HelperError {
  error as? HelperError ?? .actionFailed(error.localizedDescription)
}
