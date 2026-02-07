//
//  ReportExportService.swift
//  antios
//
//  B3: 评估报告导出 - PDF 生成 + 邮件发送
//

import SwiftUI
import PDFKit

class ReportExportService {
    static let shared = ReportExportService()
    
    private init() {}
    
    // MARK: - Generate PDF Report
    
    func generatePDFReport(
        scaleName: String,
        score: Int,
        maxScore: Int,
        severity: String,
        interpretation: String,
        suggestions: [String],
        date: Date
    ) -> Data? {
        let pdfMetaData = [
            kCGPDFContextCreator: "Antianxiety",
            kCGPDFContextAuthor: "Max Health Assistant",
            kCGPDFContextTitle: "\(scaleName) 评估报告"
        ]
        
        let format = UIGraphicsPDFRendererFormat()
        format.documentInfo = pdfMetaData as [String: Any]
        
        let pageRect = CGRect(x: 0, y: 0, width: 612, height: 792)
        let renderer = UIGraphicsPDFRenderer(bounds: pageRect, format: format)
        
        let data = renderer.pdfData { context in
            context.beginPage()
            
            var yPosition: CGFloat = 50
            
            let titleFont = UIFont.boldSystemFont(ofSize: 24)
            let titleAttributes: [NSAttributedString.Key: Any] = [
                .font: titleFont,
                .foregroundColor: UIColor.black
            ]
            
            let title = "\(scaleName) 评估报告"
            title.draw(at: CGPoint(x: 50, y: yPosition), withAttributes: titleAttributes)
            yPosition += 40
            
            let dateFormatter = DateFormatter()
            dateFormatter.dateStyle = .long
            dateFormatter.locale = Locale(identifier: "zh_CN")
            
            let dateString = "评估日期: \(dateFormatter.string(from: date))"
            let bodyFont = UIFont.systemFont(ofSize: 14)
            let bodyAttributes: [NSAttributedString.Key: Any] = [
                .font: bodyFont,
                .foregroundColor: UIColor.darkGray
            ]
            dateString.draw(at: CGPoint(x: 50, y: yPosition), withAttributes: bodyAttributes)
            yPosition += 30
            
            let scoreText = "总分: \(score) / \(maxScore)"
            let scoreFont = UIFont.boldSystemFont(ofSize: 18)
            scoreText.draw(at: CGPoint(x: 50, y: yPosition), withAttributes: [
                .font: scoreFont,
                .foregroundColor: UIColor.black
            ])
            yPosition += 30
            
            let severityText = "评估结果: \(severity)"
            severityText.draw(at: CGPoint(x: 50, y: yPosition), withAttributes: [
                .font: scoreFont,
                .foregroundColor: severityColor(severity)
            ])
            yPosition += 40
            
            let interpretationTitle = "专业解读"
            interpretationTitle.draw(at: CGPoint(x: 50, y: yPosition), withAttributes: titleAttributes)
            yPosition += 30
            
            let interpretationRect = CGRect(x: 50, y: yPosition, width: 512, height: 100)
            interpretation.draw(in: interpretationRect, withAttributes: bodyAttributes)
            yPosition += 120
            
            let suggestionsTitle = "改善建议"
            suggestionsTitle.draw(at: CGPoint(x: 50, y: yPosition), withAttributes: titleAttributes)
            yPosition += 30
            
            for (index, suggestion) in suggestions.enumerated() {
                let bulletText = "\(index + 1). \(suggestion)"
                let suggestionRect = CGRect(x: 50, y: yPosition, width: 512, height: 40)
                bulletText.draw(in: suggestionRect, withAttributes: bodyAttributes)
                yPosition += 45
            }
            
            yPosition = pageRect.height - 100
            let disclaimer = "免责声明: 本报告仅供参考，不构成医疗诊断。如有需要，请咨询专业医疗人员。"
            let disclaimerAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.italicSystemFont(ofSize: 10),
                .foregroundColor: UIColor.gray
            ]
            disclaimer.draw(at: CGPoint(x: 50, y: yPosition), withAttributes: disclaimerAttributes)
        }
        
        return data
    }
    
    private func severityColor(_ severity: String) -> UIColor {
        switch severity {
        case "轻度": return UIColor.systemGreen
        case "中度": return UIColor.systemOrange
        case "中重度", "重度": return UIColor.systemRed
        default: return UIColor.black
        }
    }
    
    func sharePDF(_ data: Data, from viewController: UIViewController) {
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent("评估报告.pdf")
        
        do {
            try data.write(to: tempURL)
            let activityVC = UIActivityViewController(activityItems: [tempURL], applicationActivities: nil)
            viewController.present(activityVC, animated: true)
        } catch {
            print("保存 PDF 失败: \(error)")
        }
    }
}
