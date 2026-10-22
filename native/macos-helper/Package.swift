// swift-tools-version: 6.4

import PackageDescription

let package = Package(
  name: "ahoyHelper",
  platforms: [.macOS(.v14)],
  targets: [
    .executableTarget(
      name: "ahoyHelper",
      swiftSettings: [
        .enableUpcomingFeature("ApproachableConcurrency"),
        .defaultIsolation(MainActor.self),
      ]
    )
  ]
)
