// swift-tools-version:5.7
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "antios",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "antios",
            targets: ["antios"]
        ),
    ],
    dependencies: [
        .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0"),
        .package(url: "https://github.com/kishikawakatsumi/KeychainAccess", from: "4.2.2"),
        .package(url: "https://github.com/Alamofire/Alamofire", from: "5.8.0"),
    ],
    targets: [
        .target(
            name: "antios",
            dependencies: [
                .product(name: "Supabase", package: "supabase-swift"),
                "KeychainAccess",
                "Alamofire",
            ]
        ),
        .testTarget(
            name: "antiosTests",
            dependencies: ["antios"]
        ),
    ]
)
