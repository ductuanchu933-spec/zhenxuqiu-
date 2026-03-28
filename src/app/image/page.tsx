'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'input' | 'analyzing' | 'result'

interface Statistics {
  background: Record<string, number>
  copy: Record<string, number>
  composition: Record<string, number>
  color: Record<string, number>
  sellingPoints: Record<string, number>
}

export default function Image() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('input')
  const [myProductImage, setMyProductImage] = useState<string>('')
  const [competitorImages, setCompetitorImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState<any>(null)
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const myImageInputRef = useRef<HTMLInputElement>(null)
  const competitorImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const hasKey = localStorage.getItem('api_key')
    if (!hasKey) {
      router.push('/settings')
    }
  }, [router])

  const handleMyImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setMyProductImage(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCompetitorImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64 = event.target?.result as string
          setCompetitorImages(prev => [...prev, base64].slice(0, 20))
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeCompetitorImage = (index: number) => {
    setCompetitorImages(prev => prev.filter((_, i) => i !== index))
  }

  const analyzeImages = async () => {
    if (competitorImages.length === 0) {
      setError('请至少上传5张竞品主图')
      return
    }

    setError('')
    setLoading(true)
    setStep('analyzing')

    try {
      const apiKey = localStorage.getItem('api_key')

      const hasMyImage = myProductImage ? '是' : '否'

      const systemPrompt = `你是电商主图视觉分析专家。请分析用户上传的竞品主图，进行详细的数据分析。

【任务】
1. 逐一分析每张竞品主图的所有维度
2. 进行详细的数据统计
3. 给出详细的同质化分析
4. 给出具体的差异化建议
5. 如果用户上传了自己的产品图，进行对比分析

【需要识别的维度 - 全部都要分析】
1. 背景：纯色/场景/拼接/白底
2. 文案内容：提取主图上所有的文字内容（逐字识别）
3. 文案词根：分析文案关键词（如：留香/持久/保湿/美白/护肤/天然/正品等）
4. 有无文案：有/无
5. 行数：文案行数
6. 构图：居中/对角/多图/特写/平铺
7. 配色主色调：红色系/蓝色系/绿色系/白色系/黑色系/彩色/暖色/冷色
8. 主体大小：大中小
9. 卖点数量：1-9

【数据分析要求】
- 统计每个维度的占比（百分比）
- 统计文案词根出现频率
- 找出占比超过60%的维度（高度同质化）

【同质化分析要求】
- 详细说明哪些维度已经高度同质化
- 给出具体数值，如"背景：80%竞品使用场景图"
- 标记同质化超过60%的维度

【差异化建议要求】
- 基于数据分析，给出具体的差异化方向
- 建议要具体可执行

【你的产品图分析】
如果用户上传了自己的产品图，需要：
- 分析你自己的主图各个维度
- 跟竞品进行对比
- 指出你的差异化优势和劣势

【输出格式】（JSON）
{
  "competitorAnalysis": [
    {
      "imageIndex": 1,
      "background": "背景",
      "copyContent": "文案内容原文",
      "copyKeywords": ["词根1", "词根2"],
      "hasCopy": "有/无",
      "copyLines": 数字,
      "composition": "构图",
      "color": "主色调",
      "mainSize": "大/中/小",
      "sellingPoints": 数字
    }
  ],
  "statistics": {
    "background": {"纯色": 0, "场景": 0, "拼接": 0, "白底": 0},
    "hasCopy": {"有": 0, "无": 0},
    "copyKeywords": {"词根A": 出现次数, "词根B": 出现次数},
    "composition": {"居中": 0, "对角": 0, "多图": 0, "特写": 0, "平铺": 0},
    "color": {"红色系": 0, "蓝色系": 0, "绿色系": 0, "白色系": 0, "黑色系": 0, "彩色": 0, "暖色": 0, "冷色": 0},
    "mainSize": {"大": 0, "中": 0, "小": 0}
  },
  "homogenizationWarning": "详细同质化分析：\n1.背景维度：xxx\n2.文案维度：xxx\n3.构图维度：xxx\n4.配色维度：xxx\n\n高度同质化（>60%）的维度：xxx",
  "differentiationSuggestion": "详细差异化建议：\n1.背景：建议用xxx差异化\n2.文案：建议用xxx差异化\n3.构图：建议用xxx差异化\n4.配色：建议用xxx差异化",
  "yourImageAnalysis": "你的主图分析：\n- 背景：xxx\n- 文案：xxx\n- 构图：xxx\n- 配色：xxx\n\nvs竞品对比：\n- 优势：xxx\n- 劣势：xxx\n- 优化建议：xxx"
}`

      const userContent = hasMyImage === '是'
        ? `请分析这 ${competitorImages.length} 张竞品主图，以及1张用户自己的产品主图。`
        : `请分析这 ${competitorImages.length} 张竞品主图。`

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userContent }],
          systemPrompt,
          apiKey,
          image: competitorImages[0]
        })
      })

      const data = await response.json()

      console.log('API返回:', data)

      if (data.error) {
        setError(data.error)
        setStep('input')
      } else {
        try {
          let jsonStr = data.response
          jsonStr = jsonStr.replace(/\/\/.*$/gm, '')
          jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, '')

          const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            console.log('解析结果:', parsed)
            setReport(parsed)
            setStatistics(parsed.statistics)
          } else {
            setReport({
              homogenizationWarning: 'JSON解析失败，原始回复：' + jsonStr.substring(0, 1000),
              differentiationSuggestion: jsonStr.substring(0, 1000),
              yourImageAnalysis: ''
            })
          }
        } catch (e) {
          console.log('解析错误:', e)
          setReport({
            homogenizationWarning: '解析失败：' + (data.response || '').substring(0, 500),
            differentiationSuggestion: '',
            yourImageAnalysis: ''
          })
        }
        setStep('result')
      }
    } catch (err: any) {
      console.log('错误:', err)
      setError(err.message || '分析失败，请重试')
      setStep('input')
    }

    setLoading(false)
  }

  const restart = () => {
    setMyProductImage('')
    setCompetitorImages([])
    setReport(null)
    setStatistics(null)
    setStep('input')
  }

  const downloadReport = () => {
    if (!report) return

    let content = `# 主图分析报告\n\n`
    content += `## 统计结果\n\n`

    if (statistics) {
      content += `### 背景\n`
      for (const [k, v] of Object.entries(statistics.background || {})) {
        content += `- ${k}: ${v}%\n`
      }
      content += `\n### 文案\n`
      content += `- 有文案: ${statistics.hasCopy?.['有'] || 0}%\n`
      content += `- 无文案: ${statistics.hasCopy?.['无'] || 0}%\n`
      if (statistics.copyKeywords) {
        content += `\n### 文案词根\n`
        for (const [k, v] of Object.entries(statistics.copyKeywords)) {
          content += `- ${k}: ${v}次\n`
        }
      }
      content += `\n### 构图\n`
      for (const [k, v] of Object.entries(statistics.composition || {})) {
        content += `- ${k}: ${v}%\n`
      }
      content += `\n### 配色\n`
      for (const [k, v] of Object.entries(statistics.color || {})) {
        content += `- ${k}: ${v}%\n`
      }
    }

    content += `\n## 同质化预警\n\n${report?.homogenizationWarning || '无'}\n\n`
    content += `## 差异化建议\n\n${report?.differentiationSuggestion || '无'}\n\n`
    content += `## 你的主图分析\n\n${report?.yourImageAnalysis || '无'}\n`

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `主图分析报告.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadReportDOC = () => {
    if (!report) return

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>主图分析报告</title>
<style>
body { font-family: 'Microsoft YaHei', sans-serif; padding: 40px; }
h1 { color: #333; border-bottom: 2px solid #667eea; }
h2 { color: #667eea; margin-top: 30px; }
.warning { background: #fff5f5; padding: 15px; border-left: 4px solid #ff4d4f; }
.suggestion { background: #f0f5ff; padding: 15px; border-left: 4px solid #667eea; }
</style>
</head>
<body>
<h1>🖼️ 主图分析报告</h1>
<h2>📊 统计结果</h2>
${statistics ? `
<h3>背景</h3>
${Object.entries(statistics.background || {}).map(([k,v]) => `<p>${k}: ${v}%</p>`).join('')}
<h3>文案</h3>
<p>有文案: ${statistics.hasCopy?.['有'] || 0}%</p>
<p>无文案: ${statistics.hasCopy?.['无'] || 0}%</p>
<h3>构图</h3>
${Object.entries(statistics.composition || {}).map(([k,v]) => `<p>${k}: ${v}%</p>`).join('')}
<h3>配色</h3>
${Object.entries(statistics.color || {}).map(([k,v]) => `<p>${k}: ${v}%</p>`).join('')}
` : ''}
<h2>⚠️ 同质化预警</h2>
<div class="warning">${report?.homogenizationWarning || '无'}</div>
<h2>💡 差异化建议</h2>
<div class="suggestion">${report?.differentiationSuggestion || '无'}</div>
<h2>🔍 你的主图分析</h2>
<p>${report?.yourImageAnalysis || '无'}</p>
</body>
</html>`

    const blob = new Blob([html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `主图分析报告.doc`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (step === 'input') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => router.push('/')} style={styles.backBtn}>← 返回</button>
          <span style={styles.title}>🖼️ 主图分析</span>
          <span style={styles.placeholder}></span>
        </div>

        <div style={styles.content}>
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>上传主图，开始分析</h2>
            <p style={styles.formDesc}>上传你的产品主图和竞品主图，AI帮你分析差异化</p>

            <div style={styles.field}>
              <label style={styles.label}>你的产品主图（可选，1张）</label>
              <input type="file" ref={myImageInputRef} accept="image/*" onChange={handleMyImageUpload} style={{ display: 'none' }} />
              {myProductImage ? (
                <div style={styles.previewBox}>
                  <img src={myProductImage} alt="我的产品" style={styles.previewImg} />
                  <button onClick={() => setMyProductImage('')} style={styles.removeBtn}>✕</button>
                </div>
              ) : (
                <button onClick={() => myImageInputRef.current?.click()} style={styles.uploadBtn}>📷 上传我的产品图</button>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>竞品主图 *（建议5-20张）</label>
              <input type="file" ref={competitorImageInputRef} accept="image/*" multiple onChange={handleCompetitorImageUpload} style={{ display: 'none' }} />
              <button onClick={() => competitorImageInputRef.current?.click()} style={styles.uploadBtn}>🎯 上传竞品主图</button>

              <div style={styles.imageGrid}>
                {competitorImages.map((img, i) => (
                  <div key={i} style={styles.previewItem}>
                    <img src={img} alt={`竞品${i+1}`} style={styles.gridImg} />
                    <button onClick={() => removeCompetitorImage(i)} style={styles.smallRemoveBtn}>✕</button>
                  </div>
                ))}
              </div>
              <p style={styles.imageCount}>已上传 {competitorImages.length}/20 张</p>
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <button onClick={analyzeImages} disabled={loading} style={styles.button}>
              {loading ? '正在分析...' : '开始分析 🚀'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'analyzing') {
    return (
      <div style={styles.container}>
        <div style={styles.analyzing}>
          <div style={styles.spinner}></div>
          <h2>正在分析主图...</h2>
          <p>识别背景/文案/构图/配色/词根中</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={restart} style={styles.backBtn}>← 重新分析</button>
        <span style={styles.title}>🖼️ 主图分析报告</span>
        <button onClick={downloadReportDOC} style={styles.downloadBtn}>📥 下载</button>
      </div>

      <div style={styles.content}>
        {/* 统计结果 */}
        {statistics && (
          <div style={styles.resultCard}>
            <h2 style={styles.resultTitle}>📊 统计结果</h2>
            <div style={styles.statsGrid}>
              <div style={styles.statItem}><h4>背景</h4>
                {Object.entries(statistics.background || {}).map(([k, v]) => (
                  <div key={k} style={styles.statRow}><span>{k}</span><div style={styles.barContainer}><div style={{ ...styles.bar, width: `${v}%` }}></div></div><span>{v}%</span></div>
                ))}
              </div>
              <div style={styles.statItem}><h4>文案</h4>
                {Object.entries(statistics.hasCopy || {}).map(([k, v]) => (
                  <div key={k} style={styles.statRow}><span>{k}</span><div style={styles.barContainer}><div style={{ ...styles.bar, width: `${v}%` }}></div></div><span>{v}%</span></div>
                ))}
              </div>
              <div style={styles.statItem}><h4>构图</h4>
                {Object.entries(statistics.composition || {}).map(([k, v]) => (
                  <div key={k} style={styles.statRow}><span>{k}</span><div style={styles.barContainer}><div style={{ ...styles.bar, width: `${v}%` }}></div></div><span>{v}%</span></div>
                ))}
              </div>
              <div style={styles.statItem}><h4>配色</h4>
                {Object.entries(statistics.color || {}).map(([k, v]) => (
                  <div key={k} style={styles.statRow}><span>{k}</span><div style={styles.barContainer}><div style={{ ...styles.bar, width: `${v}%` }}></div></div><span>{v}%</span></div>
                ))}
              </div>
              <div style={styles.statItem}><h4>主体大小</h4>
                {Object.entries(statistics.mainSize || {}).map(([k, v]) => (
                  <div key={k} style={styles.statRow}><span>{k}</span><div style={styles.barContainer}><div style={{ ...styles.bar, width: `${v}%` }}></div></div><span>{v}%</span></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 同质化预警 */}
        <div style={styles.resultCard}>
          <h2 style={styles.resultTitle}>⚠️ 同质化预警</h2>
          <div style={styles.resultSection}>
            <pre style={styles.preText}>{report?.homogenizationWarning || '无'}</pre>
          </div>
        </div>

        {/* 差异化建议 */}
        <div style={styles.resultCard}>
          <h2 style={styles.resultTitle}>💡 差异化建议</h2>
          <div style={styles.resultSection}>
            <pre style={styles.preText}>{report?.differentiationSuggestion || '无'}</pre>
          </div>
        </div>

        {/* 你的主图分析 */}
        {myProductImage && (
          <div style={styles.resultCard}>
            <h2 style={styles.resultTitle}>🔍 你的主图分析</h2>
            <div style={styles.resultSection}>
              <pre style={styles.preText}>{report?.yourImageAnalysis || '无'}</pre>
            </div>
          </div>
        )}

        <div style={styles.resultActions}>
          <button onClick={downloadReportDOC} style={styles.downloadBtnLarge}>📥 下载Word报告</button>
          <button onClick={downloadReport} style={styles.downloadBtnOutline}>📄 下载Markdown</button>
          <button onClick={restart} style={styles.restartBtn}>🔄 重新分析</button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#f5f5f5' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  backBtn: { background: 'none', border: 'none', fontSize: '14px', color: '#666', cursor: 'pointer' },
  title: { fontSize: '16px', fontWeight: 'bold', color: '#333' },
  placeholder: { width: '50px' },
  downloadBtn: { background: 'none', border: 'none', fontSize: '14px', color: '#667eea', cursor: 'pointer' },
  content: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
  formCard: { background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  formTitle: { fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '8px', textAlign: 'center' },
  formDesc: { fontSize: '14px', color: '#666', textAlign: 'center', marginBottom: '24px' },
  field: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' },
  uploadBtn: { padding: '12px 20px', fontSize: '14px', color: '#667eea', background: '#f0f0ff', border: '2px solid #667eea', borderRadius: '8px', cursor: 'pointer' },
  previewBox: { position: 'relative', display: 'inline-block' },
  previewImg: { width: '120px', height: '120px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #eee' },
  removeBtn: { position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', borderRadius: '12px', background: '#ff4d4f', color: '#fff', border: 'none', fontSize: '12px', cursor: 'pointer' },
  imageGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' },
  previewItem: { position: 'relative' },
  gridImg: { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' },
  smallRemoveBtn: { position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', borderRadius: '8px', background: '#ff4d4f', color: '#fff', border: 'none', fontSize: '10px', cursor: 'pointer' },
  imageCount: { fontSize: '12px', color: '#999', marginTop: '8px' },
  error: { color: '#ff4d4f', fontSize: '14px', marginBottom: '12px' },
  button: { width: '100%', padding: '14px', fontSize: '16px', fontWeight: 'bold', color: '#fff', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '16px' },
  analyzing: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', color: '#666' },
  spinner: { width: '40px', height: '40px', border: '4px solid #eee', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' },
  resultCard: { background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '16px' },
  resultTitle: { fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #eee' },
  resultSection: { fontSize: '14px', lineHeight: '1.8', color: '#333' },
  preText: { whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  statItem: { marginBottom: '16px' },
  statRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '13px' },
  barContainer: { flex: 1, height: '16px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' },
  bar: { height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '4px' },
  resultActions: { display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' },
  downloadBtnLarge: { flex: '1', padding: '14px', fontSize: '14px', fontWeight: 'bold', color: '#fff', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: '8px', cursor: 'pointer', minWidth: '150px' },
  downloadBtnOutline: { flex: '1', padding: '14px', fontSize: '14px', fontWeight: 'bold', color: '#667eea', background: '#fff', border: '2px solid #667eea', borderRadius: '8px', cursor: 'pointer', minWidth: '150px' },
  restartBtn: { flex: '1', padding: '14px 24px', fontSize: '14px', fontWeight: 'bold', color: '#667eea', background: '#fff', border: '2px solid #667eea', borderRadius: '8px', cursor: 'pointer', minWidth: '120px' },
}
