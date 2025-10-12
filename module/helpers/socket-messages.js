import { log, sleep } from "../tools.js";
import { Mutex } from "../tools/concurency.js";
import { Arm5eChatMessage } from "./chat-message.js";

export const SMSG_TYPES = {
  ACK: "ACK",
  CHAT: "CHAT"
};

export const SMSG_FIELDS = {
  ID: "ID",
  ACTION: "action",
  TYPE: "type",
  SENDER: "sender",
  CHAT_MSG_ID: "messageId",
  CHAT_MSG_DB_UPDATE: "chatDbUpdate"
};

export class Arm5eSocketHandler {
  constructor() {
    this.identifier = "system.arm5e";
    this.registerSocketListeners();
    this.pendingMessages = new Set();
  }

  static TIMEOUT = 10000;
  static TICK = 100;
  static globalMutex = new Mutex();

  registerSocketListeners() {
    game.socket.on(this.identifier, async ({ type, action, payload }) => {
      log(false, "Socket message handling", `type: ${type}, action: ${action}`, payload);
      const mutex = new Mutex();
      try {
        await mutex.lock();
        switch (type) {
          case SMSG_TYPES.ACK:
            {
              if (game.user._id === payload[SMSG_FIELDS.SENDER]) {
                const ID = payload[SMSG_FIELDS.ID];
                if (ID) {
                  Arm5eSocketHandler.globalMutex.lock();
                  if (this.pendingMessages.has(ID)) {
                    this.pendingMessages.delete(ID);
                  } else {
                    log(false, "Unknown ACK");
                  }
                  Arm5eSocketHandler.globalMutex.unlock();
                } else {
                  log(false, 'Missing mandatory field "ID"');
                }
              }
            }
            break;
          case SMSG_TYPES.CHAT:
            Arm5eChatMessage.handleSocketMessages(action, payload);
            break;
          default:
            throw new Error("unknown type");
        }
        mutex.unlock();
      } finally {
        mutex.unlock();
        Arm5eSocketHandler.globalMutex.unlock();
      }
    });
  }

  emit(type, action, payload) {
    log(false, "Socket message emit", `type: ${type}, action: ${action}`, payload);
    return game.socket.emit(this.identifier, { type, action, payload });
  }

  acknowledgeMessage(msgId) {
    game.socket.emit(this.identifier, {
      type: "ACK",
      payload: { [SMSG_FIELDS.SENDER]: game.user._id, [SMSG_FIELDS.ID]: msgId }
    });
  }

  async emitAwaited(type, action, payload) {
    log(false, "Awaited Socket message emit", `type: ${type}, action: ${action}`, payload);
    const ID = foundry.utils.randomID();
    payload[SMSG_FIELDS.ID] = ID;
    try {
      Arm5eSocketHandler.globalMutex.lock();
      this.pendingMessages.add(ID);
      Arm5eSocketHandler.globalMutex.unlock();
      game.socket.emit(this.identifier, { type, action, payload });
      let loop = 0;
      await sleep(Arm5eSocketHandler.TICK);
      while (this.pendingMessages.has(ID)) {
        loop++;
        if (loop > Arm5eSocketHandler.TIMEOUT / Arm5eSocketHandler.TICK) {
          log(false, `Timeout after ${Arm5eSocketHandler.TIMEOUT / 1000.0} sec for msgId ${ID}`);
          break;
        }
        await sleep(Arm5eSocketHandler.TICK);
      }
      this.pendingMessages.delete(ID);
    } finally {
      this.pendingMessages.delete(ID);
      Arm5eSocketHandler.globalMutex.unlock();
    }
  }

  error(msg) {
    console.error(msg);
  }
}
