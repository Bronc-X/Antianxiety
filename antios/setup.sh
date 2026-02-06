#!/bin/bash
# 初始化 antios Xcode 项目
# 由于 xcodegen 需要 Xcode 15.3，使用手动创建方式

cd /Users/broncin/Desktop/Antianxiety/antios

echo "🚀 创建 antios Xcode 项目..."

# 使用 swift package 初始化（如果尚未初始化）
if [ ! -f "Package.swift" ]; then
    swift package init --type library --name antios
fi

echo ""
echo "📁 项目结构已创建:"
find antios -name "*.swift" | head -30

echo ""
echo "📋 下一步操作:"
echo "1. 打开 Xcode 14.2"
echo "2. File → New → Project"
echo "3. 选择 iOS → App"
echo "4. 产品名称: antios"
echo "5. Bundle ID: com.antianxiety.antios"
echo "6. Interface: SwiftUI"
echo "7. 保存到: /Users/broncin/Desktop/Antianxiety/antios/"
echo ""
echo "8. 然后将已创建的 Swift 文件拖入项目中"
echo "9. 添加 SPM 依赖:"
echo "   - https://github.com/supabase/supabase-swift"
echo "   - https://github.com/kishikawakatsumi/KeychainAccess"
echo "   - https://github.com/Alamofire/Alamofire"
echo ""
echo "✅ 所有 Swift 源文件已准备就绪!"
