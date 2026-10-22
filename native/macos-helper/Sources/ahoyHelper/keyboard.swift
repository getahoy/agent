import ApplicationServices
import Carbon.HIToolbox

let keystrokeIntervalMicroseconds: useconds_t = 10_000

struct KeyOutput: Encodable {
  let key: String
  let modifiers: [String]
}

struct TypeOutput: Encodable {
  let characters: Int
}

func pressKey(_ key: String?, modifiers: [String]?) throws -> KeyOutput {
  guard AXIsProcessTrusted() else { throw HelperError.accessibilityDenied }
  guard let key, let code = keyCode(for: key) else {
    throw HelperError.invalidRequest("Unknown key")
  }
  let names = modifiers ?? []
  var flags = CGEventFlags()
  for name in names {
    guard let flag = modifierFlagsByName[name] else {
      throw HelperError.invalidRequest("Unknown modifier \(name)")
    }
    flags.insert(flag)
  }
  for isDown in [true, false] {
    let event = CGEvent(keyboardEventSource: nil, virtualKey: code, keyDown: isDown)
    event?.flags = flags
    event?.post(tap: .cghidEventTap)
  }
  return KeyOutput(key: key, modifiers: names)
}

func typeText(_ text: String?) throws -> TypeOutput {
  guard AXIsProcessTrusted() else { throw HelperError.accessibilityDenied }
  guard let text, !text.isEmpty else { throw HelperError.invalidRequest("Nothing to type") }
  guard !IsSecureEventInputEnabled(), !focusedFieldIsSecure() else {
    throw HelperError.secureInput
  }
  for character in text {
    postCharacter(character)
    usleep(keystrokeIntervalMicroseconds)
  }
  return TypeOutput(characters: text.count)
}

func releaseModifierKeys() {
  for code in modifierKeyCodes {
    let event = CGEvent(keyboardEventSource: nil, virtualKey: code, keyDown: false)
    event?.flags = []
    event?.post(tap: .cghidEventTap)
  }
}

private func postCharacter(_ character: Character) {
  let units = Array(String(character).utf16)
  for isDown in [true, false] {
    guard let event = CGEvent(keyboardEventSource: nil, virtualKey: 0, keyDown: isDown) else {
      continue
    }
    event.keyboardSetUnicodeString(stringLength: units.count, unicodeString: units)
    event.post(tap: .cghidEventTap)
  }
}

private func focusedFieldIsSecure() -> Bool {
  let systemWide = AXUIElementCreateSystemWide()
  guard let focused = Accessibility.element(systemWide, kAXFocusedUIElementAttribute) else {
    return false
  }
  return Accessibility.string(focused, kAXSubroleAttribute) == kAXSecureTextFieldSubrole
}
