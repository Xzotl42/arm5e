export class Arm5eSocketHandler {
  constructor() {
    this.identifier = "system.arm5e"; // whatever event name is correct for your package
    this.registerSocketListeners();
  }

  registerSocketListeners() {
    game.socket.on(this.identifier, ({ type, payload }) => {
      switch (type) {
        case "ACTION":
          this.#handleAction(payload);
          break;
        default:
          throw new Error("unknown type");
      }
    });
  }

  emit(type, payload) {
    return game.socket.emit(this.identifier, { type, payload });
  }

  #handleAction(arg) {
    console.log(arg);
  }
}
