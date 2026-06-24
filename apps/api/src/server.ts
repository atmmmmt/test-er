import { app } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

async function bootstrap() {
  await connectDb(env.MONGO_URI);
  app.listen(env.PORT, () => console.log(`API running on port ${env.PORT}`));
}

bootstrap();
