import type { SlashCommand } from '../services/BotClient.js';
import { pingCommand } from './ping.js';
import { joinCommand } from './join.js';
import { leaveCommand } from './leave.js';
import { playCommand } from './play.js';
import { pauseCommand } from './pause.js';
import { resumeCommand } from './resume.js';
import { skipCommand } from './skip.js';
import { stopCommand } from './stop.js';
import { queueCommand } from './queue.js';
import { volumeCommand } from './volume.js';
import { languageCommand } from './language.js';
import { loopCommand } from './loop.js';
import { shuffleCommand } from './shuffle.js';
import { appCommand } from './app.js';

export const allCommands: SlashCommand[] = [
  pingCommand,
  joinCommand,
  leaveCommand,
  playCommand,
  pauseCommand,
  resumeCommand,
  skipCommand,
  stopCommand,
  queueCommand,
  volumeCommand,
  languageCommand,
  loopCommand,
  shuffleCommand,
  appCommand,
];
