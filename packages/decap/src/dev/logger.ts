import winston from 'winston';

const { combine, colorize, simple } = winston.format;

type LogOptions = {
  level: string;
};

export function createLogger({ level }: LogOptions) {
  return winston.createLogger({
    level,
    format: combine(colorize(), simple()),
    transports: [new winston.transports.Console()],
  });
}
