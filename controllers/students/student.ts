import jwt from "jsonwebtoken";

const User = require("../../lib/prisma").user;
const Class = require("../../lib/prisma").class;
const ClassAccess = require("../../lib/prisma").classAccess;
const Notification = require("../../lib/prisma").notification;

export const StudentController = {
  createClassAccess: async (req: any, res: any) => {
    try {
      console.log("Creating class access...");
      const { classId, userId } = req.body;
      console.log(classId);
      console.log(userId);

      // Validate the input
      if (!classId || !userId) {
        return res.status(400).json({
          status: false,
          data: {
            message: "Class ID and User ID must be provided.",
          },
        });
      }

      // Check if the user already has access or a pending request for this class
      const existingAccess = await ClassAccess.findFirst({
        where: {
          classId: classId,
          userId: userId,
        },
      });

      if (existingAccess) {
        return res.status(400).json({
          status: false,
          data: {
            message: "The user already has access or a pending request for this class.",
          },
        });
      }

      // Create the ClassAccess entry with the default status "PENDING"
      const newClassAccess = await ClassAccess.create({
        data: {
          classId: classId,
          userId: userId,
          status: "PENDING", // The initial status can be "PENDING" until approved by the teacher
        },
      });

      console.log("Class access created successfully.");
      return res.status(201).json({
        status: true,
        data: {
          newClassAccess,
        },
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        status: false,
        error: error.message,
      });
    }
  },

  deleteClassAccess: async (req: any, res: any) => {
    try {
      console.log("Deleting class access...");
      const { classAccessId } = req.body;

      // Validate the input
      if (!classAccessId) {
        return res.status(400).json({
          status: false,
          data: {
            message: "Class Access ID must be provided.",
          },
        });
      }

      // Delete the ClassAccess entry
      await ClassAccess.delete({
        where: {
          id: classAccessId,
        },
      });

      console.log("Class access deleted successfully.");
      return res.status(200).json({
        status: true,
        data: { message: "The class access request has been successfully deleted." },
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        status: false,
        error: error.message,
      });
    }
  },

  getStudentClasses: async (req: any, res: any) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          status: false,
          data: {
            message: "Token is required.",
          },
        });
      }

      // Verify the token and extract the user information
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");

      const userId = decoded.userId;

      // Check if the user exists and is a student
      const student = await User.findFirst({
        where: {
          id: userId,
          role: "STUDENT",
        },
        select: {
          id: true,
          lastname: true,
          firstname: true,
          classAccesses: {
            where: {
              status: "APPROVED",
            },
            select: {
              id: true,
              status: true,
              class: {
                select: {
                  id: true,
                  name: true,
                  year: true,
                  students: {
                    select: {
                      id: true,
                      status: true,
                      user: {
                        select: {
                          id: true,
                          firstname: true,
                          lastname: true,
                          phone: true,
                        },
                      },
                    },
                  },
                  teacher: {
                    select: {
                      id: true,
                      firstname: true,
                      lastname: true,
                    },
                  },
                  evaluations: {
                    select: {
                      id: true,
                      title: true,
                      content: true,
                      createdAt: true,
                    },
                  },
                  documents: {
                    select: {
                      id: true,
                      title: true,
                      content: true,
                      createdAt: true,
                    },
                  },
                  messages: {
                    select: {
                      id: true,
                      content: true,
                      createdAt: true,
                      sender: {
                        select: {
                          id: true,
                          firstname: true,
                          lastname: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Check if the student exists
      if (!student) {
        return res.status(404).json({
          status: false,
          data: {
            message: "Student not found or user is not a student.",
          },
        });
      }

      // Return the student's classes
      return res.status(200).json({
        status: true,
        data: {
          class: student.classAccesses,
        },
      });
    } catch (error: any) {
      console.error("Error retrieving student classes:", error);

      if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
        return res.status(401).json({
          status: false,
          data: {
            message: "Invalid or expired token.",
          },
        });
      }

      return res.status(500).json({
        status: false,
        error: error.message,
      });
    }
  },

  getPendingAccessRequests: async (req: any, res: any) => {
    try {
      console.log("Fetching pending access requests...");

      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          status: false,
          data: {
            message: "Authorization token is required.",
          },
        });
      }

      const token = authHeader.split(" ")[1];

      // Verify the token and extract user information
      let decodedToken: any;
      try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
      } catch (err) {
        return res.status(401).json({
          status: false,
          data: {
            message: "Invalid or expired token.",
          },
        });
      }

      const studentId = decodedToken.userId;

      // Fetch all class access requests with status "PENDING" for the student
      const pendingAccessRequests = await ClassAccess.findMany({
        where: {
          status: "PENDING",
          userId: studentId, // Filter by the student's requests
        },
        select: {
          id: true,
          classId: true,
          userId: true,
          status: true,
          class: {
            select: {
              name: true,
              year: true,
              teacher: {
                select: {
                  firstname: true,
                  lastname: true,
                },
              },
            },
          },
        },
      });

      console.log("Pending access requests fetched successfully.");
      return res.status(200).json({
        status: true,
        data: {
          requests: pendingAccessRequests,
        },
      });
    } catch (error: any) {
      console.error("Error fetching pending access requests:", error);
      return res.status(500).json({
        status: false,
        data: {
          message: "An error occurred while fetching pending access requests.",
          error: error.message,
        },
      });
    }
  },

  getStudentNotifications: async (req: any, res: any) => {
    try {
      const { studentId } = req.params; // Assuming studentId is passed as a route parameter

      // Validate that studentId is provided
      if (!studentId) {
        return res.status(400).json({
          status: false,
          data: {
            message: "Student ID is required.",
          },
        });
      }

      // Check if the user with this studentId exists and is a student
      const student = await User.findUnique({
        where: { id: studentId },
      });

      if (!student || student.role !== "STUDENT") {
        return res.status(404).json({
          status: false,
          data: {
            message: "Student not found or user is not a student.",
          },
        });
      }

      // Fetch notifications for the student
      const notifications = await Notification.findMany({
        where: {
          class: {
            students: {
              some: {
                userId: studentId,
              },
            },
          },
        },
        include: {
          sender: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.status(200).json({
        status: true,
        data: {
          notifications,
        },
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        status: false,
        error: error.message,
      });
    }
  },
};
