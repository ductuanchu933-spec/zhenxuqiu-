# 真需求脑暴室

AI对话式产品卖点挖掘工具

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 本地运行

```bash
npm run dev
```

访问 http://localhost:3000

### 3. 部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

或者直接在 GitHub 上创建仓库，然后到 Vercel 绑定 GitHub 即可自动部署。

## 使用流程

1. 打开页面，点击「开始脑暴」
2. 首次使用需要设置 API Key（去硅基流动注册）
3. 按照 AI 的引导一步步回答问题
4. 最后获得高转化文案和主图标题

## 配置说明

### 支持的模型

当前使用硅基流动的 Qwen/Qwen2.5-7B-Instruct 模型。

你可以在 `src/app/api/chat/route.ts` 中修改 model 字段来切换其他模型。

### 更多模型选择

硅基流动支持的模型包括：
- Qwen/Qwen2.5-7B-Instruct
- Qwen/Qwen2.5-14B-Instruct
- THUDM/glm-4-9b-chat
- 详见硅基流动官网

## 技术栈

- Next.js 14
- React 18
- TypeScript

## 文件结构

```
├── src/
│   ├── app/
│   │   ├── page.tsx          # 首页
│   │   ├── brain/page.tsx    # 脑暴室（对话页面）
│   │   ├── settings/page.tsx # 设置页面
│   │   ├── api/chat/route.ts # AI API 接口
│   │   ├── layout.tsx
│   │   └── globals.css
│   └── components/
├── package.json
├── next.config.js
├── tsconfig.json
└── README.md
```
