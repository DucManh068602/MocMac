import dns from 'node:dns';
import mongoose from 'mongoose';

export async function connectDatabase() {
  const dnsServers = process.env.MONGODB_DNS_SERVERS
    ?.split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (dnsServers?.length) {
    dns.setServers(dnsServers);
  }

  const mongoUri = new URL(process.env.MONGODB_URI);
  const mongoUsername = process.env.MONGODB_USERNAME;
  const mongoPassword = process.env.MONGODB_PASSWORD;

  if (Boolean(mongoUsername) !== Boolean(mongoPassword)) {
    throw new Error('MONGODB_USERNAME and MONGODB_PASSWORD must both be set');
  }

  if (mongoUsername && mongoPassword) {
    mongoUri.username = mongoUsername;
    mongoUri.password = mongoPassword;
  }

  if (
    mongoUri.protocol === 'mongodb+srv:' &&
    !mongoUri.searchParams.has('authSource')
  ) {
    mongoUri.searchParams.set('authSource', 'admin');
  }

  return mongoose.connect(mongoUri.toString());
}
