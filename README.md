# FiscalWise - AI-Powered Personal Finance Assistant

![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-orange)

A smart personal finance management app that leverages Vision Language Models (VLM) for automated bill capture and Large Language Models (LLM) for interactive financial advisory, creating a seamless and intelligent personal finance experience.

## ✨ Core Features

- 📝 Intelligent Bill Recognition:
    - [x] VLM-powered OCR for instant bill/receipt scanning
    - [x] Real-time extraction of transaction details (amount, date, merchant)
    - [ ] Support for multiple formats (screenshots, photos, digital receipts)
        - [x] Support Alipay transaction auto import
        - [x] Support WechatPay transaction auto import
        - [ ] Support other formats...
    - [ ] Automatic categorization of expenses

- 🗂️ Smart Financial Assistant (LLM Integration)
    - [x] Natural language interaction for financial queries
    - [ ] Personalized spending analysis and insights
    - [ ] Budget monitoring and alerts
    - [ ] Goal-setting assistance and tracking


- 📊 Advanced Analytics Reports
    - [x] Selective date range
    - [x] Daily expense visualization with bar chart
    - [x] Financial Summary in specified period with bar chart, pie chart and categories list by daily, weekly and monthly.
    - [ ] TBD...
- 📱 Mobile-responsive UI
    TBD...

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm 9+

### Quick Start
```bash
# Clone repository
git clone https://github.com/Breezewrf/fiscal-wise-ai-assistant.git

# Navigate to project
cd fiscal-wise-ai-assistant

# Install dependencies
npm install

# Launch dev server
npm run dev
```
Open `http://localhost:8080/` to view live preview

## 🔧 Tech Stack

| Technology      | Purpose                       |
|-----------------|-------------------------------|
| React 18        | Frontend Framework            |
| TypeScript 5    | Type-safe Development         |
| Vite 4          | Build Tool                    |
| shadcn-ui       | UI Component Library          |
| Tailwind CSS    | Utility-first CSS Framework   |
| Recharts        | Data Visualization            |

## 🚀 Deployment

Recommended hosting platforms:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/breezewrf/fiscal-wise-ai-assistant)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/breezewrf/fiscal-wise-ai-assistant)

## 🤝 Contributing

We welcome contributions via issues and PRs:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m 'Add some feature'`)
4. Push branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
