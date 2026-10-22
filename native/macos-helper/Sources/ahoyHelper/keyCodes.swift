import CoreGraphics

let namedKeyCodes: [String: CGKeyCode] = [
  "return": 36, "tab": 48, "space": 49, "delete": 51, "escape": 53,
  "forwardDelete": 117, "home": 115, "end": 119, "pageUp": 116, "pageDown": 121,
  "left": 123, "right": 124, "down": 125, "up": 126,
  "f1": 122, "f2": 120, "f3": 99, "f4": 118, "f5": 96, "f6": 97,
  "f7": 98, "f8": 100, "f9": 101, "f10": 109, "f11": 103, "f12": 111,
]

let characterKeyCodes: [Character: CGKeyCode] = [
  "a": 0, "s": 1, "d": 2, "f": 3, "h": 4, "g": 5, "z": 6, "x": 7, "c": 8, "v": 9,
  "b": 11, "q": 12, "w": 13, "e": 14, "r": 15, "y": 16, "t": 17, "1": 18, "2": 19,
  "3": 20, "4": 21, "6": 22, "5": 23, "=": 24, "9": 25, "7": 26, "-": 27, "8": 28,
  "0": 29, "]": 30, "o": 31, "u": 32, "[": 33, "i": 34, "p": 35, "l": 37, "j": 38,
  "'": 39, "k": 40, ";": 41, "\\": 42, ",": 43, "/": 44, "n": 45, "m": 46, ".": 47,
  "`": 50,
]

let modifierFlagsByName: [String: CGEventFlags] = [
  "command": .maskCommand, "shift": .maskShift, "option": .maskAlternate,
  "control": .maskControl,
]

let modifierKeyCodes: [CGKeyCode] = [55, 54, 56, 60, 58, 61, 59, 62, 63]

func keyCode(for key: String) -> CGKeyCode? {
  if let code = namedKeyCodes[key] { return code }
  guard key.count == 1, let character = key.lowercased().first else { return nil }
  return characterKeyCodes[character]
}
