'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Settings() {
  const router = useRouter()
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('api_key')
    if (stored) {
      setApiKey(stored)
    }
  }, [])

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('api_key', apiKey.trim())
      setSaved(true)
      setTimeout(() => {
        router.push('/')
      }, 1000)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>⚙️ 设置</h1>
        <p style={styles.subtitle}>请输入你的API Key（硅基流动或其他兼容API）</p>

        <div style={styles.inputGroup}>
          <label style={styles.label}>API Key</label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-xxxxx..."
            style={styles.input}
          />
        </div>

        <button onClick={saveApiKey} style={styles.button}>
          {saved ? '✓ 已保存' : '保存'}
        </button>

        <div style={styles.help}>
          <h3 style={styles.helpTitle}>💡 如何获取API Key</h3>
          <ol style={styles.helpList}>
            <li>访问 <a href="https://siliconflow.cn" target="_blank" style={styles.link}>硅基流动</a> 注册账号</li>
            <li>进入控制台，复制你的API Key</li>
            <li>粘贴到上方输入框</li>
          </ol>
        </div>

        <button
          onClick={() => router.push('/')}
          style={styles.back}
        >
          ← 返回首页
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '480px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    marginBottom: '8px',
    color: '#333',
  },
  subtitle: {
    fontSize: '14px',
    textAlign: 'center' as const,
    color: '#666',
    marginBottom: '32px',
  },
  inputGroup: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '14px',
    fontSize: '14px',
    border: '2px solid #eee',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    width: '100%',
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fff',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  help: {
    marginTop: '32px',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '10px',
  },
  helpTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#333',
  },
  helpList: {
    fontSize: '13px',
    color: '#666',
    paddingLeft: '20px',
    lineHeight: '2',
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
  },
  back: {
    display: 'block',
    width: '100%',
    marginTop: '20px',
    padding: '12px',
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'center' as const,
  },
}
