var users = 0;

function connectedUsers() {
  console.log("number of connected users: " + users);
}

exports.handleSocket = async (io: any) => {
  //   io.on("connection", (socket: any) => {
  //     console.log(`⚡: ${socket.id} user just connected!`);

  //     // /*------------ gestion de la connexion ------------*/
  //     // socket.on("user_connect", async (obj: any) => {});

  //     // /*------------ gestion de l'envoie d'un message ------------*/
  //     // socket.on("message", async (msg: any) => {
  //     //   console.log(msg);
  //     // });
  //   });
  io.on("connection", (io: any) => {
    console.log("new user connected");

    // Optionally, add event handlers for the socket
    io.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
};
