import ApplicationServices

private var elementsByRef: [String: AXUIElement] = [:]

func replaceRegisteredElements(_ elements: [String: AXUIElement]) {
  elementsByRef = elements
}

func registeredElement(_ ref: String) -> AXUIElement? {
  elementsByRef[ref]
}
