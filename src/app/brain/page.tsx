'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'input' | 'analyzing' | 'result'

interface ReportData {
  trueDemand: string
  painPoint: string
  itchPoint: string
  爽点: string
  scenarios: { scene: string; 崩溃瞬间: string[]; 解决方案: string[] }[]
  titles: string[]
  detailIntro: string
  trustSection: string
  imageAnalysis?: string
}

export default function Brain() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('input')
  const [formData, setFormData] = useState({
    productName: '',
    productType: '',
    targetUser: '',
    userBenefits: '',
  })
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const hasKey = localStorage.getItem('api_key')
    if (!hasKey) {
      router.push('/settings')
    }
  }, [router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // 图片上传处理
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64 = event.target?.result as string
          setUploadedImages(prev => [...prev, base64].slice(0, 3))
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  // 下载报告
  const downloadReport = () => {
    if (!report) return

    let content = `# 真需求挖掘报告\n\n`
    content += `## 产品：${formData.productName}\n`
    content += `## 目标用户：${formData.targetUser}\n\n`

    content += `### 🎯 第一步：真伪需求判定\n\n`
    content += `- 真需求判定：${report.trueDemand}\n`
    content += `- 核心痛点：${report.painPoint}\n`
    content += `- 痒点：${report.itchPoint}\n`
    content += `- 爽点：${report.爽点}\n\n`

    content += `### 🧠 第二步：场景化痛点\n\n`
    report.scenarios?.forEach((s, i) => {
      content += `**场景${i+1}：${s.scene}**\n`
      content += `- 崩溃瞬间：${s.崩溃瞬间?.join('、')}\n`
      content += `- 解决方案：${s.解决方案?.join('、')}\n\n`
    })

    content += `### ✍️ 第三步：高转化文案\n\n`
    content += `**主图标题：**\n`
    report.titles?.forEach((t, i) => {
      content += `${i+1}. ${t}\n`
    })
    content += `\n**详情页开头：**\n${report.detailIntro}\n\n`
    content += `**信任板块：**\n${report.trustSection}\n`

    if (report.imageAnalysis) {
      content += `\n### 🖼️ 主图分析\n\n${report.imageAnalysis}\n`
    }

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `真需求报告_${formData.productName}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateReport = async () => {
    if (!formData.productName || !formData.targetUser || !formData.userBenefits) {
      setError('请填写完整信息')
      return
    }

    setError('')
    setLoading(true)
    setStep('analyzing')

    try {
      const apiKey = localStorage.getItem('api_key')

      // 如果有图片，加上图片分析
      let imagePrompt = ''
      if (uploadedImages.length > 0) {
        imagePrompt = `\n\n【主图分析】\n用户上传了 ${uploadedImages.length} 张图片，请分析这些主图：\n- 画面构成有什么问题？\n- 文案是否击中用户痛点？\n- 跟竞品比有什么优势和劣势？\n- 如何改进？\n`
      }

      const systemPrompt = `你是专业的电商真需求挖掘顾问，使用梁宁的"痛点/痒点/爽点"框架。

【用户信息】
- 产品名称：${formData.productName}
- 产品类型：${formData.productType}
- 目标用户：${formData.targetUser}
- 已有卖点：${formData.userBenefits}
${imagePrompt}

【请直接生成完整报告，不要询问用户】

第一步：真伪需求判定
- 使用痛点/痒点/爽点框架分析
- 判定这是真需求还是伪需求
- 一句话概括核心痛点

第二步：场景化痛点
- 列出3个典型场景
- 每个场景5个崩溃瞬间+解决方案

第三步：高转化文案
- 3个主图标题（每个不超过20字）
- 详情页开头文案（50字内）
- 详情页信任板块

如果有图片，第四步：主图分析
- 分析上传的主图/竞品主图
- 给出优化建议

【输出格式】（JSON）
{
  "trueDemand": "真需求判定",
  "painPoint": "核心痛点",
  "itchPoint": "痒点",
  "爽点": "爽点",
  "scenarios": [
    {"scene": "场景名", "崩溃瞬间": ["1","2","3","4","5"], "解决方案": ["1","2","3","4","5"]}
  ],
  "titles": ["标题1","标题2","标题3"],
  "detailIntro": "详情页开头",
  "trustSection": "信任板块",
  "imageAnalysis": "主图分析（如果没有图片则为空）"
}`

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '请生成报告' }],
          systemPrompt,
          apiKey,
          image: uploadedImages.length > 0 ? uploadedImages[0] : null
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
          } else {
            setReport({
              trueDemand: data.response,
              painPoint: '请查看上方内容',
              itchPoint: '',
              爽点: '',
              scenarios: [],
              titles: [],
              detailIntro: '',
              trustSection: ''
            })
          }
        } catch {
          setReport({
            trueDemand: data.response,
            painPoint: '',
            itchPoint: '',
            爽点: '',
            scenarios: [],
            titles: [],
            detailIntro: '',
            trustSection: ''
          })
        }
        setStep('result')
      }
    } catch (err: any) {
      setError(err.message || '生成失败，请重试')
      setStep('input')
    }

    setLoading(false)
  }

  const restart = () => {
    setFormData({
      productName: '',
      productType: '',
      targetUser: '',
      userBenefits: '',
    })
    setUploadedImages([])
    setReport(null)
    setStep('input')
  }

  // 输入步骤
  if (step === 'input') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => router.push('/')} style={styles.backBtn}>← 返回</button>
          <span style={styles.title}>真需求脑暴室</span>
          <span style={styles.placeholder}></span>
        </div>

        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>填写产品信息，一键生成报告</h2>

          <div style={styles.field}>
            <label style={styles.label}>产品名称 *</label>
            <input
              type="text"
              value={formData.productName}
              onChange={(e) => handleInputChange('productName', e.target.value)}
              placeholder="例如：留香沐浴露"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>产品类型 *</label>
            <select
              value={formData.productType}
              onChange={(e) => handleInputChange('productType', e.target.value)}
              style={styles.select}
            >
              <option value="">请选择</option>
              <option value="实物商品">实物商品</option>
              <option value="虚拟商品">虚拟商品/服务</option>
              <option value="知识付费">知识付费/课程</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>目标用户 *</label>
            <input
              type="text"
              value={formData.targetUser}
              onChange={(e) => handleInputChange('targetUser', e.target.value)}
              placeholder="例如：白领女生、年轻妈妈"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>已有卖点/差异化 *</label>
            <textarea
              value={formData.userBenefits}
              onChange={(e) => handleInputChange('userBenefits', e.target.value)}
              placeholder="你目前能想到的产品卖点"
              style={styles.textarea}
              rows={4}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>上传主图/竞品图（可选，最多3张）</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <button onClick={() => fileInputRef.current?.click()} style={styles.uploadBtn}>
              📷 上传图片
            </button>
            <div style={styles.imagePreview}>
              {uploadedImages.map((img, i) => (
                <div key={i} style={styles.previewItem}>
                  <img src={img} alt={`已上传${i+1}`} style={styles.previewImg} />
                  <button onClick={() => removeImage(i)} style={styles.removeBtn}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button onClick={generateReport} disabled={loading} style={styles.button}>
            {loading ? '正在生成报告...' : '一键生成报告 🚀'}
          </button>
        </div>
      </div>
    )
  }

  // 分析中
  if (step === 'analyzing') {
    return (
      <div style={styles.container}>
        <div style={styles.analyzing}>
          <div style={styles.spinner}></div>
          <h2>正在挖掘真需求...</h2>
          <p>使用"痛点/痒点/爽点"框架分析中</p>
        </div>
      </div>
    )
  }

  // 结果页
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={restart} style={styles.backBtn}>← 重新填写</button>
        <span style={styles.title}>真需求挖掘报告</span>
        <button onClick={downloadReport} style={styles.downloadBtn}>📥 下载</button>
      </div>

      <div style={styles.resultCard}>
        <h2 style={styles.resultTitle}>🎯 第一步：真伪需求判定</h2>
        <div style={styles.resultSection}>
          <p><strong>真需求判定：</strong>{report?.trueDemand || '无'}</p>
          <p><strong>核心痛点：</strong>{report?.painPoint || '无'}</p>
          <p><strong>痒点：</strong>{report?.itchPoint || '无'}</p>
          <p><strong>爽点：</strong>{report?.爽点 || '无'}</p>
        </div>

        <h2 style={styles.resultTitle}>🧠 第二步：场景化痛点</h2>
        <div style={styles.resultSection}>
          {report?.scenarios?.map((s, i) => (
            <div key={i} style={styles.scenario}>
              <p><strong>场景{i+1}：{s.scene}</strong></p>
              <p>崩溃瞬间：{s.崩溃瞬间?.join('、')}</p>
              <p>解决方案：{s.解决方案?.join('、')}</p>
            </div>
          ))}
        </div>

        <h2 style={styles.resultTitle}>✍️ 第三步：高转化文案</h2>
        <div style={styles.resultSection}>
          <p><strong>主图标题：</strong></p>
          <ul style={styles.titleList}>
            {report?.titles?.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
          <p><strong>详情页开头：</strong>{report?.detailIntro || '无'}</p>
          <p><strong>信任板块：</strong>{report?.trustSection || '无'}</p>
        </div>

        {report?.imageAnalysis && (
          <>
            <h2 style={styles.resultTitle}>🖼️ 第四步：主图分析</h2>
            <div style={styles.resultSection}>
              <p>{report.imageAnalysis}</p>
            </div>
          </>
        )}

        <div style={styles.resultActions}>
          <button onClick={downloadReport} style={styles.downloadBtnLarge}>
            📥 下载报告
          </button>
          <button onClick={restart} style={styles.restartBtn}>
            🔄 重新生成
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
  formCard: {
    background: '#fff',
    margin: '16px',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  formTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '24px',
    textAlign: 'center',
  },
  field: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '2px solid #eee',
    borderRadius: '8px',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '2px solid #eee',
    borderRadius: '8px',
    outline: 'none',
    background: '#fff',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '2px solid #eee',
    borderRadius: '8px',
    outline: 'none',
    resize: 'vertical',
  },
  uploadBtn: {
    padding: '10px 20px',
    fontSize: '14px',
    color: '#667eea',
    background: '#f0f0ff',
    border: '2px solid #667eea',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  imagePreview: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
    flexWrap: 'wrap',
  },
  previewItem: {
    position: 'relative',
  },
  previewImg: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid #eee',
  },
  removeBtn: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    width: '20px',
    height: '20px',
    borderRadius: '10px',
    background: '#ff4d4f',
    color: '#fff',
    border: 'none',
    fontSize: '12px',
    cursor: 'pointer',
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
    margin: '16px',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  resultTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #eee',
  },
  resultSection: {
    marginBottom: '24px',
    fontSize: '14px',
    lineHeight: '1.8',
    color: '#333',
  },
  scenario: {
    marginBottom: '16px',
    padding: '12px',
    background: '#f8f9fa',
    borderRadius: '8px',
  },
  titleList: {
    paddingLeft: '20px',
    marginBottom: '16px',
  },
  resultActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  downloadBtnLarge: {
    flex: 1,
    padding: '14px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fff',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  restartBtn: {
    flex: 1,
    padding: '14px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#667eea',
    background: '#fff',
    border: '2px solid #667eea',
    borderRadius: '8px',
    cursor: 'pointer',
  },
}
