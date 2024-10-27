import jwt from "jsonwebtoken";
const Message = require("../../lib/prisma").message;
const ClassAccess = require("../../lib/prisma").classAccess;

exports.registerMessage = async (req: any, res: any) => {
  try {
    console.log("Registering a new message...");
    const { content, classId, userId } = req.body;
    console.log(content);
    console.log(classId);
    console.log(userId);

    // Validate mandatory fields
    if (!content || !classId) {
      return;
    }

    // Verify if the user has access to the class
    // const classAccess = await ClassAccess.findFirst({
    //   where: {
    //     classId: classId,
    //     userId: userId,
    //     status: "APPROVED",
    //   },
    // });

    // if (!classAccess) {
    //   return res.status(403).json({
    //     status: false,
    //     data: {
    //       message: "You do not have permission to send messages to this class.",
    //     },
    //   });
    // }

    // Register the new message
    const newMessage = await Message.create({
      data: {
        content: content,
        senderId: userId,
        classId: classId,
      },
    });

    console.log("Message registered successfully.");
    return newMessage.id;
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      status: false,
      error: error.message,
    });
  }
};
