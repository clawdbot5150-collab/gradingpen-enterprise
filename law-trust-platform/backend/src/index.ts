import 'reflect-metadata';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { createConnection } from 'typeorm';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createClient } from 'redis';
import { Client as ElasticClient } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

// Import resolvers
import { LeadResolver } from './resolvers/LeadResolver';
import { LawyerResolver } from './resolvers/LawyerResolver';
import { CaseResolver } from './resolvers/CaseResolver';
import { AnalyticsResolver } from './resolvers/AnalyticsResolver';
import { AuthResolver } from './resolvers/AuthResolver';
import { PaymentResolver } from './resolvers/PaymentResolver';

// Import middleware
import { authMiddleware } from './middleware/auth';
import { loggingMiddleware } from './middleware/logging';
import { errorMiddleware } from './middleware/error';

// Import services
import { TwilioService } from './services/TwilioService';
import { SendGridService } from './services/SendGridService';
import { StripeService } from './services/StripeService';
import { OpenAIService } from './services/OpenAIService';
import { ElasticsearchService } from './services/ElasticsearchService';

// Import routes
import { webhookRoutes } from './routes/webhooks';
import { uploadRoutes } from './routes/uploads';
import { emergencyRoutes } from './routes/emergency';

dotenv.config();

class Server {
  private app: express.Application;
  private redisClient: any;
  private elasticClient: ElasticClient;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupServices();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://law-trust.com', 'https://www.law-trust.com']
        : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
    });
    this.app.use('/api', limiter);

    // Emergency intake has higher rate limit
    const emergencyLimiter = rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 10, // 10 emergency intakes per 5 minutes
    });
    this.app.use('/api/emergency', emergencyLimiter);

    // Body parsing and compression
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use(loggingMiddleware);

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });
  }

  private async setupServices(): Promise<void> {
    try {
      // Initialize Redis
      this.redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });
      await this.redisClient.connect();
      console.log('✅ Redis connected');

      // Initialize Elasticsearch
      this.elasticClient = new ElasticClient({
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
        auth: {
          username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
          password: process.env.ELASTICSEARCH_PASSWORD || 'changeme',
        },
      });
      console.log('✅ Elasticsearch connected');

      // Initialize external services
      new TwilioService();
      new SendGridService();
      new StripeService();
      new OpenAIService();
      new ElasticsearchService(this.elasticClient);

    } catch (error) {
      console.error('❌ Service initialization failed:', error);
      process.exit(1);
    }
  }

  public async start(): Promise<void> {
    try {
      // Database connection
      await createConnection({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'law_trust',
        entities: [__dirname + '/entities/*.{ts,js}'],
        synchronize: process.env.NODE_ENV !== 'production',
        logging: process.env.NODE_ENV === 'development',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });
      console.log('✅ Database connected');

      // Build GraphQL schema
      const schema = await buildSchema({
        resolvers: [
          LeadResolver,
          LawyerResolver,
          CaseResolver,
          AnalyticsResolver,
          AuthResolver,
          PaymentResolver,
        ],
        authChecker: ({ context: { user } }) => {
          return !!user;
        },
      });

      // Apollo Server setup
      const server = new ApolloServer({
        schema,
        context: ({ req }) => {
          const user = req.user; // Set by auth middleware
          return { user, req, redis: this.redisClient };
        },
        introspection: process.env.NODE_ENV !== 'production',
        playground: process.env.NODE_ENV !== 'production',
      });

      await server.start();
      server.applyMiddleware({ app: this.app, path: '/graphql', cors: false });

      // REST API routes
      this.app.use('/api/webhooks', webhookRoutes);
      this.app.use('/api/uploads', uploadRoutes);
      this.app.use('/api/emergency', emergencyRoutes);

      // Auth middleware for protected routes
      this.app.use('/api', authMiddleware);
      this.app.use('/graphql', authMiddleware);

      // Error handling middleware (must be last)
      this.app.use(errorMiddleware);

      const PORT = process.env.PORT || 4000;
      this.app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 GraphQL playground: http://localhost:${PORT}/graphql`);
        console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      });

    } catch (error) {
      console.error('❌ Server startup failed:', error);
      process.exit(1);
    }
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start server
const server = new Server();
server.start().catch((error) => {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
});