import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, systemPrompt, apiKey } = body

    if (!apiKey) {
      return NextResponse.json({ error: '缺少API Key' }, { status: 400 })
    }

    // 硅基流动 API 端点
    const API_URL = 'https://api.siliconflow.cn/v1/chat/completions'

    // 构建消息列表
    const allMessages = []

    if (systemPrompt) {
      allMessages.push({ role: 'system', content: systemPrompt })
    }

    // 只传最近的消息（避免token超限）
    const recentMessages = messages.slice(-10)
    allMessages.push(...recentMessages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content
    })))

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-7B-Instruct', // 使用硅基流动的模型
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `API错误: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (data.choices && data.choices.length > 0) {
      return NextResponse.json({
        response: data.choices[0].message.content
      })
    } else {
      return NextResponse.json({ error: 'API返回格式异常' }, { status: 500 })
    }

  } catch (error: any) {
    return NextResponse.json(
      { error: `请求失败: ${error.message}` },
      { status: 500 }
    )
  }
}
