import { Server } from "socket.io";

exports.handleSocket = async (io: Server) => {
  // connect
  io.on("connection", (socket) => {
    console.log("A new user is connected");
  });

  // disconnect
  io.on("disconnect", (socket) => {
    console.log("A user is disconnected");
  });
};