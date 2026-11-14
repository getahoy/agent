import AppKit

let systemDefinedAuxKeySubtype: Int16 = 8
let auxKeyDownState = 0xA
let auxKeyUpState = 0xB
let systemKeyTypes: [String: Int] = [
  "brightnessUp": 2, "brightnessDown": 3, "playPause": 16, "next": 17, "previous": 18,
]

struct SystemKeyOutput: Encodable {
  let key: String
}

// Media and brightness keys are system-defined events; CGEvent keyboard events cannot carry them.
func pressSystemKey(_ name: String?) throws -> SystemKeyOutput {
  guard AXIsProcessTrusted() else { throw HelperError.accessibilityDenied }
  guard let name, let keyType = systemKeyTypes[name] else {
    throw HelperError.invalidRequest("Unknown system key")
  }
  for state in [auxKeyDownState, auxKeyUpState] {
    let event = NSEvent.otherEvent(
      with: .systemDefined, location: .zero,
      modifierFlags: NSEvent.ModifierFlags(rawValue: UInt(state << 8)), timestamp: 0,
      windowNumber: 0, context: nil, subtype: systemDefinedAuxKeySubtype,
      data1: (keyType << 16) | (state << 8), data2: -1)
    event?.cgEvent?.post(tap: .cghidEventTap)
  }
  return SystemKeyOutput(key: name)
}
