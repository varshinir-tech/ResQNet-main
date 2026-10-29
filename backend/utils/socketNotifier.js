let ioInstance = null;

module.exports = {
  setIO: (io) => {
    ioInstance = io;
  },
  getIO: () => {
    return ioInstance;
  },
  emitEvent: (event, data) => {
    if (ioInstance) {
      ioInstance.emit(event, data);
    }
  }
};
