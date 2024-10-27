// import * as http from "http";
// import app from "./app";

// const normalizePort = (val: string | number): number | string | boolean => {
//   const port: number = parseInt(val as string, 10);

//   if (isNaN(port)) {
//     return val;
//   }
//   if (port >= 0) {
//     return port;
//   }
//   return false;
// };

// const port: number | string | boolean = normalizePort(process.env.PORT || "2880");
// app.set("port", port);

// const errorHandler = (error: NodeJS.ErrnoException): void => {
//   if (error.syscall !== "listen") {
//     throw error;
//   }
//   const address = server.address();
//   const bind = typeof address === "string" ? "pipe " + address : "port: " + port;
//   switch (error.code) {
//     case "EACCES":
//       console.error(bind + " requires elevated privileges.");
//       process.exit(1);
//       break;
//     case "EADDRINUSE":
//       console.error(bind + " is already in use.");
//       process.exit(1);
//       break;
//     default:
//       throw error;
//   }
// };

// const server: http.Server = http.createServer(app);

// server.on("error", errorHandler);
// server.on("listening", () => {
//   const address = server.address();
//   const bind = typeof address === "string" ? "pipe " + address : "port " + port;
//   console.log("Listening on " + bind);
// });

// server.listen(port as number);

import * as http from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
const chatController = require("./controllers/chat/chat");

const normalizePort = (val: string | number): number | string | boolean => {
  const port: number = parseInt(val as string, 10);

  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};

const port: number | string | boolean = normalizePort(process.env.PORT || "2880");
app.set("port", port);

const errorHandler = (error: NodeJS.ErrnoException): void => {
  if (error.syscall !== "listen") {
    throw error;
  }
  const address = server.address();
  const bind = typeof address === "string" ? "pipe " + address : "port: " + port;
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges.");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use.");
      process.exit(1);
      break;
    default:
      throw error;
  }
};

// Create the HTTP server
const server: http.Server = http.createServer(app);

// Initialize Socket.IO with the server
const io = new SocketIOServer(server);

io.on("connection", (socket) => {
  console.log("new user connected");

  // Handle incoming messages
  socket.on("message", async (message) => {
    const parsedObj = JSON.parse(message);
    console.log(parsedObj);
    const id = await chatController.registerMessage({
      body: {
        content: parsedObj.content,
        classId: parsedObj.classId,
        userId: parsedObj.userId,
      },
    });
    io.emit(
      "message",
      JSON.stringify({
        id: id,
        content: parsedObj.content,
        classId: parsedObj.classId,
        userId: parsedObj.userId,
        name: parsedObj.name,
      })
    );
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.on("error", errorHandler);
server.on("listening", () => {
  const address = server.address();
  const bind = typeof address === "string" ? "pipe " + address : "port " + port;
  console.log("Listening on " + bind);
});

// Start the server
server.listen(port as number);
