import { log } from "../tools.js";
import { Arm5eChatMessage } from "./chat-message.js";

export class Arm5eSocketHandler {
  constructor() {
    this.identifier = "system.arm5e";
    this.registerSocketListeners();
  }

  registerSocketListeners() {
    game.socket.on(this.identifier, ({ type, action, payload }) => {
      log(false, "Socket message handling", `type: ${type}, action: ${action}`, payload);
      switch (type) {
        case "CHAT":
          Arm5eChatMessage.handleSocketMessages(action, payload);
          break;
        default:
          throw new Error("unknown type");
      }
    });
  }
  async EmitAcked(type, action, payload) {
    await new Promise((resolve) => {
      // This is the acknowledgement callback
      const ackCb = (response) => {
        resolve(response);
      };

      socket.emit(this.identifier, { type, action, payload }, ackCb);
    });
  }

  emit(type, action, payload) {
    log(false, "Socket message emit", `type: ${type}, action: ${action}`, payload);
    return game.socket.emit(this.identifier, { type, action, payload });
  }

  error(msg) {
    console.error(msg);
  }
}
