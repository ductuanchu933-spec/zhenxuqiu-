'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'input' | 'analyzing' | 'result'

export default function Image() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('input')
  const [myProductImage, setMyProductImage] = useState<string>('')
  const [competitorImages, setCompetitorImages] = useState<string[]>([])
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
      setError('请至少上传竞品主图')
      return
    }

    setError('')
    setLoading(true)
    setStep('analyzing')

    try {
      const apiKey = localStorage.getItem('api_key')

      const systemPrompt = `你是电商主图视觉分析专家。

【任务】
分析用户上传的竞品主图，统计各维度信息，找出同质化点，给出差异化建议。

【需要识别的维度】
1. 背景类型：纯色/场景/拼接/白底
2. 文案：有无文案/行数/字数
3. 构图：居中/对角/多图拼接/特写
4. 配色：主色调/冷暖
5. 主体大小：大/中/小
6. 卖点数量：0/1/2/3+

【输出格式】（JSON）
{
  "competitorAnalysis": [
    {
      "background": "背景类型",
      "copy": "有无文案",
      "copyLines": 行数,
      "composition": "构图类型",
      "color": "主色调",
      "mainSize": "主体大小",
      "sellingPoints": 数量
    }
  ],
  "statistics": {
    "background": {"纯色": 占比, "场景": 占比, "拼接": 占比, "白底": 占比},
    "copy": {"有文案": 占比, "无文案": 占比, "平均行数": 数字},
    "composition": {"居中": 占比, "对角": 占比, "多图": 占比, "特写": 占比},
    "color": {"主色调": 占比, "冷暖比例": 比例}
  },
  "homogenizationWarning": "同质化严重的维度",
  "differentiationSuggestion": "差异化切入点建议",
  "yourImageAnalysis": "如果用户上传了自己的产品图，分析他的主图与竞品的差异"
}`

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '请分析这些主图' }],
          systemPrompt,
          apiKey,
          image: competitorImages[0]
        })
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setStep('input')
      } else {
        try {
          const jsonMatch = data.response.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            setReport(parsed)
          }
        } catch {
          setReport({ rawResponse: data.response })
        }
        setStep('result')
      }
    } catch (err: any) {
      setError(err.message || '分析失败，请重试')
      setStep('input')
    }

    setLoading(false)
  }

  const restart = () => {
    setMyProductImage('')
    setCompetitorImages([])
    setReport(null)
    setStep('input')
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
              <label style={styles.label}>竞品主图 *（最多20张）</label>
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
        <span style={styles.placeholder}></span>
      </div>

      <div style={styles.content}>
        <div style={styles.resultCard}>
          <h2 style={styles.resultTitle}>📊 统计结果</h2>
          <div style={styles.resultSection}>
            <p>此功能正在完善中，请等待更新...</p>
          </div>

          <button onClick={restart} style={styles.button}>
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
  content: {
    padding: '20px',
    maxWidth: '600px',
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
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid #eee',
  },
  smallRemoveBtn: {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    width: '18px',
    height: '18px',
    borderRadius: '9px',
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
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
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
    marginBottom: '24px',
  },
}
