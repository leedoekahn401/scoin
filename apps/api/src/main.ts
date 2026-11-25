import { createApp } from './app';
import { config } from './config';
import { startJobs } from './modules/jobs/jobs.service';
import { prisma } from './prisma';

const server = createApp().listen(config.port, () => {
  console.log(`SchoolCoin API on http://localhost:${config.port}`);
});
const jobs = startJobs();

async function shutdown() {
  for (const job of jobs) job.stop();
  server.close();
  await prisma.$disconnect();
}

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
