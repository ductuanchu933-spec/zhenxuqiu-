import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, systemPrompt, apiKey, image } = body

    if (!apiKey) {
      return NextResponse.json({ error: '缺少API Key' }, { status: 400 })
    }

    console.log('收到请求, image长度:', image?.length || 0)

    // 硅基流动 API 端点
    const API_URL = 'https://api.siliconflow.cn/v1/chat/completions'

    // 构建消息列表
    const allMessages: any[] = []

    if (systemPrompt) {
      allMessages.push({ role: 'system', content: systemPrompt })
    }

    // 如果有图片，直接把图片和消息一起发送
    if (image) {
      const userMsg = messages.find((m: any) => m.role === 'user')
      const textContent = userMsg?.content || '请分析这张图片'

      allMessages.push({
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: image } },
          { type: 'text', text: textContent }
        ]
      })
    } else {
      // 没有图片，普通文本消息
      for (const m of messages) {
        allMessages.push({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })
      }
    }

    console.log('发送的消息:', JSON.stringify(allMessages).substring(0, 300))

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        // 使用支持视觉的VLM模型
        model: 'Qwen/Qwen2-VL-72B-Instruct',
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
