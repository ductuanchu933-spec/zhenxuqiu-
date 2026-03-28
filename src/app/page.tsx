'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Tab = 'demand' | 'image'

export default function Home() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('demand')

  const startBrainstorm = () => {
    const hasKey = localStorage.getItem('api_key')
    if (!hasKey) {
      router.push('/settings')
    } else {
      router.push('/brain')
    }
  }

  const goToImageAnalysis = () => {
    const hasKey = localStorage.getItem('api_key')
    if (!hasKey) {
      router.push('/settings')
    } else {
      router.push('/image')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h1 style={styles.logo}>🎯 电商老兵小白工具箱</h1>

        <div style={styles.nav}>
          <button
            onClick={() => setActiveTab('demand')}
            style={{
              ...styles.navItem,
              ...(activeTab === 'demand' ? styles.navItemActive : {})
            }}
          >
            💡 真需求挖掘
          </button>
          <button
            onClick={() => setActiveTab('image')}
            style={{
              ...styles.navItem,
              ...(activeTab === 'image' ? styles.navItemActive : {})
            }}
          >
            🖼️ 主图分析
          </button>
        </div>

        <div style={styles.footer}>
          <button
            onClick={() => router.push('/settings')}
            style={styles.settingsBtn}
          >
            ⚙️ 设置API Key
          </button>
        </div>
      </div>

      <div style={styles.main}>
        {activeTab === 'demand' && (
          <div style={styles.card}>
            <h2 style={styles.title}>💡 真需求挖掘</h2>
            <p style={styles.subtitle}>用AI一步步挖出产品真卖点，告别自卖自夸</p>

            <div style={styles.sceneSection}>
              <h3 style={styles.sceneTitle}>写主图时，你是否：</h3>
              <ul style={styles.sceneList}>
                <li>❌ 看了竞品半天，卖点都差不多</li>
                <li>❌ 详情页写成"产品说明书"</li>
                <li>❌ 不知道怎么突出差异化</li>
                <li>❌ 不确定用户真正要什么</li>
              </ul>
            </div>

            <div style={styles.divider}></div>

            <h3 style={styles.valueTitle}>我们帮你做到：</h3>
            <div style={styles.values}>
              <div style={styles.valueItem}>
                <span>🎯</span>
                <span>挖出真需求 → 知道用户为什么买</span>
              </div>
              <div style={styles.valueItem}>
                <span>🧠</span>
                <span>场景化卖点 → 知道用户怎么用</span>
              </div>
              <div style={styles.valueItem}>
                <span>✍️</span>
                <span>落地文案 → 主图标题直接可用</span>
              </div>
            </div>

            <button onClick={startBrainstorm} style={styles.button}>
              开始挖掘 🚀
            </button>
          </div>
        )}

        {activeTab === 'image' && (
          <div style={styles.card}>
            <h2 style={styles.title}>🖼️ 主图分析</h2>
            <p style={styles.subtitle}>录入竞品主图，AI帮你找出差异化突破点</p>

            <div style={styles.sceneSection}>
              <h3 style={styles.sceneTitle}>你遇到的问题：</h3>
              <ul style={styles.sceneList}>
                <li>❌ 不知道竞品主图都在用什么背景、文案</li>
                <li>❌ 不知道自己的主图有没有差异化</li>
                <li>❌ 点击率低不知道从哪里改</li>
                <li>❌ 设计师自嗨，数据说话避免浪费</li>
              </ul>
            </div>

            <div style={styles.divider}></div>

            <h3 style={styles.valueTitle}>我们帮你做到：</h3>
            <div style={styles.values}>
              <div style={styles.valueItem}>
                <span>📊</span>
                <span>统计背景/文案/构图/配色占比</span>
              </div>
              <div style={styles.valueItem}>
                <span>⚠️</span>
                <span>同质化预警：哪个维度已饱和</span>
              </div>
              <div style={styles.valueItem}>
                <span>💡</span>
                <span>差异化切入点建议</span>
              </div>
              <div style={styles.valueItem}>
                <span>📋</span>
                <span>输出主图优化方向建议书</span>
              </div>
            </div>

            <button onClick={goToImageAnalysis} style={styles.button}>
              开始分析 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    background: '#f5f5f5',
  },
  sidebar: {
    width: '240px',
    background: '#fff',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
  },
  logo: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '30px',
    textAlign: 'center',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  navItem: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#666',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  navItemActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 'auto',
  },
  settingsBtn: {
    width: '100%',
    padding: '10px',
    fontSize: '13px',
    color: '#666',
    background: '#f5f5f5',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  main: {
    flex: 1,
    padding: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '480px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
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
    marginBottom: '24px',
  },
  valueItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: '#333',
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
}
