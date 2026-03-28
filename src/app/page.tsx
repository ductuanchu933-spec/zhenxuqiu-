'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

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
        <p style={styles.subtitle}>用AI一步步挖出产品真卖点</p>

        <div style={styles.sceneSection}>
          <h2 style={styles.sceneTitle}>写主图时，你是否：</h2>
          <ul style={styles.sceneList}>
            <li>❌ 看了竞品半天，卖点都差不多</li>
            <li>❌ 详情页写成"产品说明书"</li>
            <li>❌ 不知道怎么突出差异化</li>
            <li>❌ 不确定用户真正要什么</li>
          </ul>
        </div>

        <div style={styles.divider}></div>

        <h2 style={styles.valueTitle}>我们帮你做到：</h2>
        <div style={styles.values}>
          <div style={styles.valueItem}>
            <span style={styles.valueIcon}>🎯</span>
            <span>挖出真需求 → 知道用户为什么买</span>
          </div>
          <div style={styles.valueItem}>
            <span style={styles.valueIcon}>🧠</span>
            <span>场景化卖点 → 知道用户怎么用</span>
          </div>
          <div style={styles.valueItem}>
            <span style={styles.valueIcon}>✍️</span>
            <span>落地文案 → 主图标题直接可用</span>
          </div>
        </div>

        <div style={styles.method}>
          <p style={styles.methodText}>
            梁宁说：用户买的不是钻头，是墙上的洞<br/>
            我们帮你挖的是：洞在哪里，怎么钻
          </p>
        </div>

        <button onClick={startBrainstorm} style={styles.button}>
          开始挖需求 🚀
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

const styles: Record<string, React.CSSProperties> = {
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
    padding: '32px 24px',
    maxWidth: '480px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '4px',
    color: '#333',
  },
  subtitle: {
    fontSize: '15px',
    textAlign: 'center',
    color: '#666',
    marginBottom: '24px',
  },
  sceneSection: {
    background: '#f8f9fa',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
  },
  sceneTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '12px',
  },
  sceneList: {
    fontSize: '13px',
    color: '#666',
    paddingLeft: '20px',
    lineHeight: '2',
    margin: 0,
  },
  divider: {
    height: '1px',
    background: '#eee',
    margin: '20px 0',
  },
  valueTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '12px',
  },
  values: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  valueItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: '#333',
  },
  valueIcon: {
    fontSize: '16px',
  },
  method: {
    background: '#fff5f5',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '24px',
  },
  methodText: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'center',
    lineHeight: '1.8',
    margin: 0,
  },
  button: {
    width: '100%',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fff',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  footer: {
    marginTop: '20px',
    textAlign: 'center',
  },
  link: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: '13px',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
}
