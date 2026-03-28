import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, systemPrompt, apiKey, image } = body

    if (!apiKey) {
      return NextResponse.json({ error: '缺少API Key' }, { status: 400 })
    }

    // 硅基流动 API 端点
    const API_URL = 'https://api.siliconflow.cn/v1/chat/completions'

    // 构建消息列表
    const allMessages: any[] = []

    if (systemPrompt) {
      allMessages.push({ role: 'system', content: systemPrompt })
    }

    // 只传最近的消息（避免token超限），过滤掉system消息
    const recentMessages = messages.slice(-6)
    const filteredMessages = recentMessages.filter((m: { role: string }) => m.role !== 'system')

    for (const m of filteredMessages) {
      // 转换角色：ai -> assistant, user -> user
      const role = m.role === 'ai' ? 'assistant' : 'user'

      if (m.image) {
        // 如果有图片，使用多模态消息格式
        allMessages.push({
          role,
          content: [
            { type: 'image_url', image_url: { url: m.image } },
            { type: 'text', text: m.content }
          ]
        })
      } else {
        allMessages.push({ role, content: m.content })
      }
    }

    // 如果有新上传的图片
    if (image) {
      const lastUserMsg = allMessages[allMessages.length - 1]
      if (lastUserMsg && lastUserMsg.role === 'user') {
        allMessages[allMessages.length - 1] = {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: image } },
            { type: 'text', text: lastUserMsg.content }
          ]
        }
      }
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        // 使用稳定快速的模型
        model: 'Qwen/Qwen2.5-7B-Instruct',
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
