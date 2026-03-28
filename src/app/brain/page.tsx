'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'ai' | 'user'
  content: string
  image?: string  // base64图片
}

type Step = 'intro' | 'step1' | 'step1_confirm' | 'step2' | 'step2_confirm' | 'step3' | 'done'

export default function Brain() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('intro')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [productInfo, setProductInfo] = useState('')
  const [userScenarios, setUserScenarios] = useState('')
  const [userReviews, setUserReviews] = useState('')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hasKey = localStorage.getItem('api_key')
    if (!hasKey) {
      router.push('/settings')
    }
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 图片上传处理
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setUploadedImage(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setUploadedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getStepName = () => {
    switch (step) {
      case 'intro':
      case 'step1':
        return '第一步：真伪需求判定'
      case 'step1_confirm':
        return '第一步：确认中'
      case 'step2':
      case 'step2_confirm':
        return '第二步：场景化卖点脑暴'
      case 'step3':
        return '第三步：生成高转化文案'
      case 'done':
        return '完成'
      default:
        return ''
    }
  }

  const getProgress = () => {
    if (step === 'intro' || step === 'step1' || step === 'step1_confirm') return 1
    if (step === 'step2' || step === 'step2_confirm') return 2
    if (step === 'step3') return 3
    return 3
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')

    // 如果有上传图片，添加到消息中
    const userMsg: Message = { role: 'user', content: userMessage }
    if (uploadedImage) {
      userMsg.image = uploadedImage
      setUploadedImage(null)
    }

    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const apiKey = localStorage.getItem('api_key')

      let prompt = ''
      let systemPrompt = ''

      // 根据步骤生成不同的prompt
      if (step === 'intro') {
        // 用户提供了产品信息，存储并进入第一步
        setProductInfo(userMessage)
        systemPrompt = `你是专业的电商真需求挖掘顾问「真需求脑暴师」，由电商陪跑教练小白训练。
专门帮助中小卖家找到产品的真需求和差异化卖点。

【核心方法论】
使用梁宁的"痛点/痒点/爽点"框架：
- 痛点：用户解决不了的问题，不解决会痛苦
- 痒点：用户想成为的理想状态
- 爽点：用户想要的即时满足

【你的任务】
1. 先友好问候用户，确认收到信息
2. 用"痛点/痒点/爽点"框架分析：
   - 用户买这个产品，背后真正想解决什么问题？（痛点）
   - 用户想变成什么样？（痒点）
   - 用户想要什么即时体验？（爽点）
3. 判定这是"真需求"还是"伪需求"
   - 真需求：用户愿意付费、影响决策、不满足会痛苦
   - 伪需求：用户说想要但不会为此付费
4. 挖到最痛的那一个点，一句话概括

【输出格式】
"好的，信息收到了！现在我帮你分析..."

然后输出：
- 真需求判定：是/否
- 核心痛点：一句话
- 痛点来源：用户什么情况下会买
- 痒点/爽点分析

最后询问：
"💡 我挖到的这个符合你的用户实际情况吗？"`

        prompt = userMessage
        setStep('step1')

      } else if (step === 'step1') {
        // 用户确认或补充，进入第二步
        setUserScenarios(userMessage)
        systemPrompt = `你是场景化营销专家。
基于上一步确认的真需求，进行场景化卖点脑暴。

【场景化框架】
针对每个场景，列出：
1. 场景描述：用户在什么情况下会用
2. 崩溃瞬间：在这个场景下最让用户痛苦的5个点
3. 一秒解决：产品如何一秒钟解决这个痛苦

【场景来源】
如果没有具体场景，可以脑暴以下典型场景：
- 场景1：日常使用（早上/晚上/空闲时）
- 场景2：特定场合（约会/见客户/运动/旅游）
- 场景3：用户担心的场景（怕没用/怕质量差/怕不适合）

【输出格式】
"好的，痛点确认了！现在我们来场景化..."

然后输出：
| 场景 | 崩溃瞬间 | 如何一秒解决 |
|------|----------|--------------|
| 场景名 | 瞬间1 | 解决方案 |
| 场景名 | 瞬间2 | 解决方案 |
...（每个场景5个瞬间）

最后询问：
"💡 这些场景和崩溃瞬间符合你的用户吗？"`

        prompt = userMessage
        setStep('step2')

      } else if (step === 'step2') {
        // 用户确认场景，进入第三步生成文案
        setUserReviews(userMessage)
        systemPrompt = `你是电商文案专家，专门写高转化的主图标题和详情页文案。

【基于】
- 第一步确认的真需求
- 第二步的场景化痛点

【五步高转化文案公式】

a. 场景带入
   - 描述用户日常生活中的一个具体场景
   - 让用户觉得"这就是我"

b. 揭露痛点
   - 点出用户不说出口的心里话
   - 用痛点/痒点/爽点框架

c. 给出方案
   - 展示产品如何解决这个痛点
   - 突出差异化

d. 信任背书
   - 用户证言/数据/案例
   - 真实的细节

e. 限时行动
   - 明确的行动号召
   - 降低行动门槛

【必须输出】

1. 3个主图标题（每个不超过20字，直接可用）
2. 详情页开头文案（50字内）
3. 详情页信任板块（用户证言）

【文案风格】
- 口语化、生活化
- 说人话，不堆砌华丽词藻
- 能让用户产生共鸣

【输出格式】
"好的，场景确认了！现在我来生成高转化文案..."

然后输出完整的文案内容。`

        prompt = userMessage
        setStep('step3')

      } else if (step === 'step3') {
        // 用户确认文案，流程完成
        systemPrompt = `感谢用户完成整个真需求挖掘流程。

【告诉用户】
- 恭喜完成了真需求挖掘
- 这份文案可以直接用到主图和详情页
- 如果还想挖另一个产品，可以重新开始

请简洁祝福用户，并提供重新开始的方式。`
        prompt = userMessage
        setStep('done')
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat({ role: 'user', content: userMessage }),
          systemPrompt,
          apiKey,
          image: uploadedImage || null
        })
      })

      const data = await response.json()

      if (data.error) {
        setMessages(prev => [...prev, { role: 'ai', content: `错误: ${data.error}` }])
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: data.response }])
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: '抱歉，出现了错误，请重试。' }])
    }

    setLoading(false)
  }

  const startChat = () => {
    const introMessage = `欢迎来到真需求脑暴室👏
我是AI脑暴师，由电商教练小白训练。

【我帮你做什么】
用"痛点/痒点/爽点"框架，一步步帮你挖出产品的真需求。

【现在请告诉我】
1. 你卖的是什么产品？
2. 你的目标用户是谁？
3. 你目前能想到的用户痛点是什么？

💡 一次回答就好，不用急，我们慢慢挖，挖到最痛的那个点。`

    setMessages([{ role: 'ai', content: introMessage }])
    setStep('step1')
  }

  const restart = () => {
    setMessages([])
    setInput('')
    setProductInfo('')
    setUserScenarios('')
    setUserReviews('')
    setStep('intro')
    startChat()
  }

  // 初始启动
  useEffect(() => {
    if (step === 'intro' && messages.length === 0) {
      startChat()
    }
  }, [step])

  return (
    <div style={styles.container}>
      {/* 顶部导航 */}
      <div style={styles.header}>
        <button onClick={() => router.push('/')} style={styles.backBtn}>← 返回</button>
        <span style={styles.title}>真需求脑暴室</span>
        <div style={styles.stepIndicator}>
          {getProgress()}/3
        </div>
      </div>

      {/* 进度条 */}
      <div style={styles.progressBar}>
        <div style={{
          ...styles.progressFill,
          width: `${(getProgress() / 3) * 100}%`
        }}></div>
      </div>

      {/* 步骤名称 */}
      <div style={styles.stepName}>
        {getStepName()}
      </div>

      {/* 对话区域 */}
      <div style={styles.chatArea}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              ...styles.message,
              justifyContent: msg.role === 'ai' ? 'flex-start' : 'flex-end'
            }}
          >
            {msg.role === 'ai' && <span style={styles.aiAvatar}>🤖</span>}
            <div style={{
              ...styles.bubble,
              background: msg.role === 'ai' ? '#f5f5f5' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: msg.role === 'ai' ? '#333' : '#fff',
              borderRadius: msg.role === 'ai' ? '0 16px 16px 16px' : '16px 0 16px 16px',
            }}>
              {msg.content}
            </div>
            {msg.role === 'user' && <span style={styles.userAvatar}>👤</span>}
          </div>
        ))}

        {loading && (
          <div style={styles.message}>
            <span style={styles.aiAvatar}>🤖</span>
            <div style={styles.bubble}>
              <span style={styles.loading}>正在思考...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div style={styles.inputArea}>
        {/* 隐藏的文件输入 */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />

        {/* 图片上传按钮 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={styles.imageBtn}
          disabled={loading}
          title="上传图片"
        >
          📷
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="输入你的回答..."
          style={styles.input}
          disabled={loading}
        />
        <button onClick={sendMessage} style={styles.sendBtn} disabled={loading || !input.trim() && !uploadedImage}>
          发送
        </button>
      </div>

      {/* 已上传的图片预览 */}
      {uploadedImage && (
        <div style={styles.imagePreview}>
          <img src={uploadedImage} alt="已上传" style={styles.previewImg} />
          <button onClick={removeImage} style={styles.removeImgBtn}>✕</button>
        </div>
      )}

      {/* 完成时显示重新开始按钮 */}
      {step === 'done' && (
        <div style={styles.doneButtons}>
          <button onClick={restart} style={styles.restartBtn}>
            🔄 重新开始
          </button>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
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
  stepIndicator: {
    fontSize: '14px',
    color: '#666',
    background: '#f5f5f5',
    padding: '4px 12px',
    borderRadius: '12px',
  },
  progressBar: {
    height: '3px',
    background: '#e0e0e0',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    transition: 'width 0.3s',
  },
  stepName: {
    padding: '8px 16px',
    fontSize: '12px',
    color: '#666',
    background: '#fff',
    textAlign: 'center' as const,
  },
  chatArea: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto' as const,
  },
  message: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '12px',
    gap: '8px',
  },
  aiAvatar: {
    fontSize: '24px',
  },
  userAvatar: {
    fontSize: '24px',
  },
  bubble: {
    maxWidth: '75%',
    padding: '12px 16px',
    fontSize: '14px',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap' as const,
  },
  loading: {
    color: '#999',
    fontStyle: 'italic',
  },
  inputArea: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    background: '#fff',
    borderTop: '1px solid #eee',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '14px',
    border: '2px solid #eee',
    borderRadius: '24px',
    outline: 'none',
  },
  sendBtn: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '24px',
    cursor: 'pointer',
  },
  doneButtons: {
    padding: '16px',
    background: '#fff',
    textAlign: 'center' as const,
  },
  restartBtn: {
    padding: '12px 32px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#667eea',
    background: '#fff',
    border: '2px solid #667eea',
    borderRadius: '24px',
    cursor: 'pointer',
  },
  imageBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '22px',
    border: '2px solid #eee',
    background: '#fff',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreview: {
    position: 'relative',
    display: 'inline-block',
    margin: '0 16px 12px',
  },
  previewImg: {
    maxWidth: '120px',
    maxHeight: '120px',
    borderRadius: '8px',
    border: '2px solid #eee',
  },
  removeImgBtn: {
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
}
