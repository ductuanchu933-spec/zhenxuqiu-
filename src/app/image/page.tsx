'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'input' | 'analyzing' | 'result'

interface CompetitorImage {
  id: number
  url: string
  background: string
  copy: string
  copyLines: number
  composition: string
  color: string
  mainSize: string
  sellingPoints: number
}

interface Statistics {
  background: Record<string, number>
  copy: Record<string, number>
  composition: Record<string, number>
  color: Record<string, number>
}

export default function Image() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('input')
  const [myProductImage, setMyProductImage] = useState<string>('')
  const [myProductAnalysis, setMyProductAnalysis] = useState<any>(null)
  const [competitorImages, setCompetitorImages] = useState<string[]>([])
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorImage[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState<any>(null)
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

      // 构建提示词
      let imageAnalysisPrompt = ''
      if (myProductImage) {
        imageAnalysisPrompt += `\n【你的产品主图】\n用户也上传了自己的产品主图，请一并分析并对比。`
      }

      const systemPrompt = `你是电商主图视觉分析专家。请分析用户上传的竞品主图，统计各维度信息。

【任务】
1. 逐一分析每张竞品主图的维度信息
2. 统计各维度的占比
3. 找出同质化严重的点
4. 给出差异化建议${imageAnalysisPrompt}

【需要识别的维度】
1. 背景类型：纯色(纯色背景)/场景(生活场景)/拼接(多图拼接)/白底(白色背景)
2. 文案：有文案/无文案，如果有用几行
3. 构图：居中/对角/多图拼接/特写/平铺
4. 配色：红色系/蓝色系/绿色系/白色系/黑色系/彩色/暖色/冷色/中性
5. 主体大小：主体大(占画面70%+)/主体中(40-70%)/主体小(40%以下)

【输出格式】（JSON，必须严格JSON格式）
{
  "competitorAnalysis": [
    {
      "background": "背景类型",
      "copy": "有文案/无文案",
      "copyLines": 数字,
      "composition": "构图类型",
      "color": "主色调",
      "mainSize": "主体大小",
      "sellingPoints": 数字
    }
  ],
  "statistics": {
    "background": {"纯色": 数字, "场景": 数字, "拼接": 数字, "白底": 数字},
    "copy": {"有文案": 数字, "无文案": 数字, "平均行数": 数字},
    "composition": {"居中": 数字, "对角": 数字, "多图": 数字, "特写": 数字, "平铺": 数字},
    "color": {"红色系": 数字, "蓝色系": 数字, "绿色系": 数字, "白色系": 数字, "黑色系": 数字, "彩色": 数字, "暖色": 数字, "冷色": 数字, "中性": 数字}
  },
  "homogenizationWarning": "同质化分析，指出哪些维度已经高度同质化",
  "differentiationSuggestion": "差异化建议，从哪个维度突破最有机会",
  "yourImageAnalysis": "如果用户上传了自己的产品图，对比分析他的主图vs竞品"
}`

      // 发送图片分析
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `请分析这 ${competitorImages.length} 张竞品主图。` }],
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
        console.log('AI回复:', data.response)
        try {
          const jsonMatch = data.response.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            console.log('解析结果:', parsed)
            setReport(parsed)
            setStatistics(parsed.statistics)
            setCompetitorAnalysis(parsed.competitorAnalysis || [])
            setMyProductAnalysis(parsed.yourImageAnalysis || '')
          } else {
            console.log('没有找到JSON')
            setReport({ rawResponse: data.response })
          }
        } catch (e) {
          console.log('解析错误:', e)
          setReport({ rawResponse: data.response })
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
    setMyProductAnalysis('')
    setCompetitorImages([])
    setCompetitorAnalysis([])
    setStatistics(null)
    setReport(null)
    setStep('input')
  }

  const downloadReport = () => {
    if (!report) return

    let content = `# 主图分析报告\n\n`
    content += `## 统计结果\n\n`

    if (statistics) {
      content += `### 背景类型\n`
      for (const [key, val] of Object.entries(statistics.background || {})) {
        content += `- ${key}: ${val}%\n`
      }

      content += `\n### 文案\n`
      content += `- 有文案: ${statistics.copy?.['有文案'] || 0}%\n`
      content += `- 无文案: ${statistics.copy?.['无文案'] || 0}%\n`
      content += `- 平均行数: ${statistics.copy?.['平均行数'] || 0}\n`

      content += `\n### 构图\n`
      for (const [key, val] of Object.entries(statistics.composition || {})) {
        content += `- ${key}: ${val}%\n`
      }

      content += `\n### 配色\n`
      for (const [key, val] of Object.entries(statistics.color || {})) {
        content += `- ${key}: ${val}%\n`
      }
    }

    content += `\n## ⚠️ 同质化预警\n\n${report.homogenizationWarning || '无'}\n\n`
    content += `## 💡 差异化建议\n\n${report.differentiationSuggestion || '无'}\n\n`

    if (report.yourImageAnalysis) {
      content += `## 🔍 你的主图分析\n\n${report.yourImageAnalysis}\n`
    }

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `主图分析报告.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadReportDOC = () => {
    if (!report || !statistics) return

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>主图分析报告</title>
<style>
body { font-family: 'Microsoft YaHei', sans-serif; padding: 40px; }
h1 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
h2 { color: #667eea; margin-top: 30px; }
.stat-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
.stat-table td { padding: 8px; border: 1px solid #ddd; }
.stat-bar { height: 20px; background: #667eea; border-radius: 3px; }
.warning { background: #fff5f5; padding: 15px; border-left: 4px solid #ff4d4f; }
.suggestion { background: #f0f5ff; padding: 15px; border-left: 4px solid #667eea; }
</style>
</head>
<body>
<h1>🖼️ 主图分析报告</h1>

<h2>📊 统计结果</h2>
<table class="stat-table">
<tr><td colspan="2"><strong>背景类型</strong></td></tr>
${Object.entries(statistics.background || {}).map(([k, v]) => `<tr><td>${k}</td><td><div class="stat-bar" style="width:${v}%"></div> ${v}%</td></tr>`).join('')}
</table>

<table class="stat-table">
<tr><td colspan="2"><strong>文案</strong></td></tr>
<tr><td>有文案</td><td>${statistics.copy?.['有文案'] || 0}%</td></tr>
<tr><td>无文案</td><td>${statistics.copy?.['无文案'] || 0}%</td></tr>
<tr><td>平均行数</td><td>${statistics.copy?.['平均行数'] || 0}</td></tr>
</table>

<table class="stat-table">
<tr><td colspan="2"><strong>构图</strong></td></tr>
${Object.entries(statistics.composition || {}).map(([k, v]) => `<tr><td>${k}</td><td><div class="stat-bar" style="width:${v}%"></div> ${v}%</td></tr>`).join('')}
</table>

<h2>⚠️ 同质化预警</h2>
<div class="warning">
<p>${report.homogenizationWarning || '无'}</p>
</div>

<h2>💡 差异化建议</h2>
<div class="suggestion">
<p>${report.differentiationSuggestion || '无'}</p>
</div>

${myProductImage ? `
<h2>🔍 你的主图分析</h2>
<p>${report.yourImageAnalysis || '无'}</p>
` : ''}

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
              <input
                type="file"
                ref={myImageInputRef}
                accept="image/*"
                onChange={handleMyImageUpload}
                style={{ display: 'none' }}
              />
              {myProductImage ? (
                <div style={styles.previewBox}>
                  <img src={myProductImage} alt="我的产品" style={styles.previewImg} />
                  <button onClick={() => setMyProductImage('')} style={styles.removeBtn}>✕</button>
                </div>
              ) : (
                <button onClick={() => myImageInputRef.current?.click()} style={styles.uploadBtn}>
                  📷 上传我的产品图
                </button>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>竞品主图 *（建议5-20张）</label>
              <input
                type="file"
                ref={competitorImageInputRef}
                accept="image/*"
                multiple
                onChange={handleCompetitorImageUpload}
                style={{ display: 'none' }}
              />
              <button onClick={() => competitorImageInputRef.current?.click()} style={styles.uploadBtn}>
                🎯 上传竞品主图
              </button>

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
          <p>识别背景/文案/构图/配色统计中</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={restart} style={styles.backBtn}>← 重新分析</button>
        <span style={styles.title}>🖼️ 主图分析报告</span>
        <button onClick={downloadReport} style={styles.downloadBtn}>📥 下载</button>
      </div>

      <div style={styles.content}>
        {/* 统计结果 */}
        <div style={styles.resultCard}>
          <h2 style={styles.resultTitle}>📊 统计结果</h2>

          {statistics && (
            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <h4>背景类型</h4>
                <div style={styles.statBar}>
                  {Object.entries(statistics.background || {}).map(([key, val]) => (
                    <div key={key} style={styles.statRow}>
                      <span>{key}</span>
                      <div style={styles.barContainer}>
                        <div style={{ ...styles.bar, width: `${val}%` }}></div>
                      </div>
                      <span>{val}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.statItem}>
                <h4>文案</h4>
                <div style={styles.statBar}>
                  {Object.entries(statistics.copy || {}).filter(k => k[0] !== '平均行数').map(([key, val]) => (
                    <div key={key} style={styles.statRow}>
                      <span>{key}</span>
                      <div style={styles.barContainer}>
                        <div style={{ ...styles.bar, width: `${val}%` }}></div>
                      </div>
                      <span>{val}%</span>
                    </div>
                  ))}
                  <p style={styles.avgText}>平均行数: {statistics.copy?.['平均行数'] || 0}</p>
                </div>
              </div>

              <div style={styles.statItem}>
                <h4>构图</h4>
                <div style={styles.statBar}>
                  {Object.entries(statistics.composition || {}).map(([key, val]) => (
                    <div key={key} style={styles.statRow}>
                      <span>{key}</span>
                      <div style={styles.barContainer}>
                        <div style={{ ...styles.bar, width: `${val}%` }}></div>
                      </div>
                      <span>{val}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.statItem}>
                <h4>配色</h4>
                <div style={styles.statBar}>
                  {Object.entries(statistics.color || {}).map(([key, val]) => (
                    <div key={key} style={styles.statRow}>
                      <span>{key}</span>
                      <div style={styles.barContainer}>
                        <div style={{ ...styles.bar, width: `${val}%` }}></div>
                      </div>
                      <span>{val}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 同质化预警 */}
        <div style={styles.resultCard}>
          <h2 style={styles.resultTitle}>⚠️ 同质化预警</h2>
          <div style={styles.resultSection}>
            <p>{report?.homogenizationWarning || report?.rawResponse || '分析中...'}</p>
          </div>
        </div>

        {/* 差异化建议 */}
        <div style={styles.resultCard}>
          <h2 style={styles.resultTitle}>💡 差异化建议</h2>
          <div style={styles.resultSection}>
            <p>{report?.differentiationSuggestion || '无'}</p>
          </div>
        </div>

        {/* 你的主图分析 */}
        {myProductImage && (
          <div style={styles.resultCard}>
            <h2 style={styles.resultTitle}>🔍 你的主图分析</h2>
            <div style={styles.resultSection}>
              <p>{report?.yourImageAnalysis || '无'}</p>
            </div>
          </div>
        )}

        <div style={styles.resultActions}>
          <button onClick={downloadReportDOC} style={styles.downloadBtnLarge}>
            📥 下载Word报告
          </button>
          <button onClick={downloadReport} style={styles.downloadBtnOutline}>
            📄 下载Markdown
          </button>
          <button onClick={restart} style={styles.restartBtn}>
            🔄 重新分析
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    color: '#666',
    cursor: 'pointer',
  },
  title: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: '50px',
  },
  downloadBtn: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    color: '#667eea',
    cursor: 'pointer',
  },
  content: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  formCard: {
    background: '#fff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  formTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px',
    textAlign: 'center',
  },
  formDesc: {
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
    marginBottom: '24px',
  },
  field: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
  },
  uploadBtn: {
    padding: '12px 20px',
    fontSize: '14px',
    color: '#667eea',
    background: '#f0f0ff',
    border: '2px solid #667eea',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'inline-block',
  },
  previewBox: {
    position: 'relative',
    display: 'inline-block',
  },
  previewImg: {
    width: '120px',
    height: '120px',
    objectFit: 'contain',
    borderRadius: '8px',
    border: '1px solid #eee',
  },
  removeBtn: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    width: '24px',
    height: '24px',
    borderRadius: '12px',
    background: '#ff4d4f',
    color: '#fff',
    border: 'none',
    fontSize: '12px',
    cursor: 'pointer',
  },
  imageGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '12px',
  },
  previewItem: {
    position: 'relative',
  },
  gridImg: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid #eee',
  },
  smallRemoveBtn: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    width: '16px',
    height: '16px',
    borderRadius: '8px',
    background: '#ff4d4f',
    color: '#fff',
    border: 'none',
    fontSize: '10px',
    cursor: 'pointer',
  },
  imageCount: {
    fontSize: '12px',
    color: '#999',
    marginTop: '8px',
  },
  error: {
    color: '#ff4d4f',
    fontSize: '14px',
    marginBottom: '12px',
  },
  button: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fff',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '16px',
  },
  analyzing: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    color: '#666',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #eee',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  resultCard: {
    background: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: '16px',
  },
  resultTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #eee',
  },
  resultSection: {
    fontSize: '14px',
    lineHeight: '1.8',
    color: '#333',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  statItem: {
    marginBottom: '16px',
  },
  statBar: {
    marginTop: '8px',
  },
  statRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
    fontSize: '13px',
  },
  barContainer: {
    flex: 1,
    height: '16px',
    background: '#f0f0f0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '4px',
  },
  avgText: {
    fontSize: '12px',
    color: '#666',
    marginTop: '8px',
  },
  resultActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
  },
  downloadBtnLarge: {
    flex: 1,
    padding: '14px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  downloadBtnOutline: {
    flex: 1,
    padding: '14px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#667eea',
    background: '#fff',
    border: '2px solid #667eea',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  restartBtn: {
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#667eea',
    background: '#fff',
    border: '2px solid #667eea',
    borderRadius: '8px',
    cursor: 'pointer',
  },
}
