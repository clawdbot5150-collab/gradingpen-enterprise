# AIGFNetwork - Ultimate Social Confidence Training Platform

A premium, comprehensive social confidence training platform that helps users build genuine social skills through AI-powered conversations, practice scenarios, and progressive skill development.

## 🚀 Features

### Core Features
- **8 AI Personalities**: Confident, Empathetic, Playful, Professional, Intellectual, Creative, Supportive, Challenging
- **Real-time Chat**: Instant AI feedback with WebSocket connections
- **Practice Scenarios**: First Date, Social Events, Workplace, Cold Approach, Group Conversations, Networking
- **Progressive Difficulty**: Skill assessments and adaptive learning
- **Confidence Scoring**: Advanced analytics and progress tracking
- **Conversation Analysis**: Actionable insights and improvement suggestions

### Premium Features
- Voice chat capability (preparation layer)
- Conversation replay and analysis
- Daily challenges and exercises
- Achievement system with badges
- Community features (anonymous success stories)
- Mobile-responsive PWA design
- Advanced analytics dashboard
- Export conversation transcripts
- Personalized improvement recommendations

### Ethical Safeguards
- Mental health resources and crisis protocols
- Healthy relationship education
- Consent and boundary education
- Professional referral system
- Data privacy and encryption

## 🛠️ Technical Stack

- **Backend**: Node.js + Express + Socket.io
- **Frontend**: Next.js + React + Tailwind CSS + Framer Motion
- **Database**: PostgreSQL
- **AI**: OpenAI GPT-4 with custom personality prompts
- **Authentication**: JWT with secure session management
- **Real-time**: WebSocket connections
- **Deployment**: Docker + production scripts

## 📁 Project Structure

```
aigf-network/
├── backend/                 # Node.js + Express API
├── frontend/                # Next.js React app
├── database/                # PostgreSQL schemas & migrations
├── ai-personalities/        # Custom AI prompts & logic
├── docker/                  # Containerization configs
├── docs/                    # Comprehensive documentation
├── tests/                   # Testing suite
└── deployment/              # Production deployment scripts
```

## 🚀 Quick Start

1. **Setup Environment**
   ```bash
   cp .env.example .env
   # Configure your OpenAI API key, database, and other settings
   ```

2. **Install Dependencies**
   ```bash
   npm run install:all
   ```

3. **Setup Database**
   ```bash
   npm run db:setup
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

5. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - WebSocket: ws://localhost:5000

## 🔧 Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- OpenAI API key
- Docker (for deployment)

### Environment Variables
See `.env.example` for required configuration.

### Database Migrations
```bash
npm run db:migrate
npm run db:seed
```

### Testing
```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 🚀 Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Production Deployment
```bash
npm run deploy:prod
```

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Frontend Components](./docs/frontend.md)
- [AI Personalities Guide](./docs/ai-personalities.md)
- [Database Schema](./docs/database.md)
- [Deployment Guide](./docs/deployment.md)
- [Ethical Guidelines](./docs/ethics.md)

## 🛡️ Security & Privacy

This platform prioritizes user safety and privacy:
- End-to-end encryption for sensitive conversations
- Comprehensive mental health safeguards
- Professional referral system
- Anonymous community features
- GDPR compliance ready

## 🤝 Contributing

Please read our [Contributing Guidelines](./docs/contributing.md) and [Code of Conduct](./docs/code-of-conduct.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please check our [Documentation](./docs/) or contact our support team.

---

**Built with ❤️ for helping people build genuine social confidence**