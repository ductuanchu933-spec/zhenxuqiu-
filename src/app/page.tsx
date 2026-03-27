'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const startBrainstorm = () => {
    const hasKey = localStorage.getItem('api_key')
    if (!hasKey) {
      router.push('/settings')
    } else {
      router.push('/brain')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>💡 真需求脑暴室</h1>
        <p style={styles.subtitle}>带你用AI一步步挖出产品真卖点，告别自卖自夸</p>

        <div style={styles.divider}></div>

        <p style={styles.desc}>
          帮助中小卖家和新品牌从&quot;自说自话&quot;的详情页写法，<br/>
          转变为&quot;击中用户痛点&quot;的高转化文案
        </p>

        <div style={styles.steps}>
          <div style={styles.step}>
            <span style={styles.stepNum}>1</span>
            <span>真伪需求判定</span>
          </div>
          <div style={styles.step}>
            <span style={styles.stepNum}>2</span>
            <span>场景化卖点脑暴</span>
          </div>
          <div style={styles.step}>
            <span style={styles.stepNum}>3</span>
            <span>高转化文案</span>
          </div>
        </div>

        <button onClick={startBrainstorm} style={styles.button}>
          开始脑暴 🚀
        </button>

        <div style={styles.footer}>
          <button
            onClick={() => router.push('/settings')}
            style={styles.link}
          >
            ⚙️ 设置API Key
          </button>
        </div>
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
    fontSize: '32px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    marginBottom: '8px',
    color: '#333',
  },
  subtitle: {
    fontSize: '16px',
    textAlign: 'center' as const,
    color: '#666',
    marginBottom: '24px',
  },
  divider: {
    height: '1px',
    background: '#eee',
    margin: '24px 0',
  },
  desc: {
    fontSize: '15px',
    textAlign: 'center' as const,
    color: '#666',
    lineHeight: '1.8',
    marginBottom: '32px',
  },
  steps: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '32px',
  },
  step: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    fontSize: '14px',
    color: '#666',
  },
  stepNum: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  button: {
    width: '100%',
    padding: '16px 32px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center' as const,
  },
  link: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
}
