import AppKit
import ApplicationServices

private let chromiumBrowserBundleIds: Set<String> = [
  "com.google.Chrome", "com.google.Chrome.beta", "com.google.Chrome.canary",
  "org.chromium.Chromium", "com.brave.Browser", "com.microsoft.edgemac",
  "company.thebrowser.Browser", "com.vivaldi.Vivaldi", "com.operasoftware.Opera",
]
private var webPagesOn = false
private var browserObservers: [NSObjectProtocol] = []

struct WebPagesOutput: Encodable {
  let on: Bool
}

func isChromiumBrowser(_ app: NSRunningApplication) -> Bool {
  app.bundleIdentifier.map(chromiumBrowserBundleIds.contains) ?? false
}

func wantsWebTree(_ app: NSRunningApplication) -> Bool {
  webPagesOn && isChromiumBrowser(app)
}

// A heavy page such as Gmail takes about two seconds to build its tree once asked, so while on,
// browsers are asked ahead of any command. Activation can come before launching ends, when the
// ask is dropped, so a finished launch asks again.
func setWebPages(_ on: Bool?) throws -> WebPagesOutput {
  guard let on else { throw HelperError.invalidRequest("webPages needs on") }
  webPagesOn = on
  browserObservers.forEach(NSWorkspace.shared.notificationCenter.removeObserver)
  browserObservers = on ? watchBrowsers() : []
  for app in NSWorkspace.shared.runningApplications { setWebTree(app, on: on) }
  return WebPagesOutput(on: on)
}

func askForWebTree(_ app: NSRunningApplication) {
  setWebTree(app, on: true)
}

private func watchBrowsers() -> [NSObjectProtocol] {
  let names = [
    NSWorkspace.didLaunchApplicationNotification, NSWorkspace.didActivateApplicationNotification,
  ]
  return names.map { name in
    NSWorkspace.shared.notificationCenter.addObserver(forName: name, object: nil, queue: .main) {
      notification in
      let key = NSWorkspace.applicationUserInfoKey
      guard let app = notification.userInfo?[key] as? NSRunningApplication else { return }
      MainActor.assumeIsolated { askForWebTree(app) }
    }
  }
}

// Chromium browsers build the page tree only once AXEnhancedUserInterface is set, which other
// apps react to (window managers, heavy redraws), so only browsers get it. Chrome answers with
// an error yet turns it on, so the answer is not checked.
private func setWebTree(_ app: NSRunningApplication, on: Bool) {
  guard isChromiumBrowser(app) else { return }
  let appElement = AXUIElementCreateApplication(app.processIdentifier)
  AXUIElementSetAttributeValue(appElement, "AXEnhancedUserInterface" as CFString, on as CFBoolean)
}
