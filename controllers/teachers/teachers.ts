import jwt from "jsonwebtoken";

const User = require("../../lib/prisma").user;
const Class = require("../../lib/prisma").class;
const Document = require("../../lib/prisma").document;
const Evaluation = require("../../lib/prisma").evaluation;
const ClassAccess = require("../../lib/prisma").classAccess;

export const TeacherController = {
  createClass: async (req: any, res: any) => {
    try {
      console.log("Creating class...");
      const { name, year } = req.body; // Remove teacherId from the request body

      // Validate mandatory fields
      if (!name || !year) {
        return res.status(400).json({
          status: false,
          data: {
            message: "All mandatory fields must be completed.",
          },
        });
      }

      // Get the token from the request headers
      const token = JSON.parse(req.headers.authorization?.split(" ")[1]);

      // Vérifier le token et extraire les informations de l'utilisateur
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
      const teacherId = decoded.userId;

      if (!token) {
        return res.status(401).json({
          status: false,
          data: {
            message: "Authorization token is required.",
          },
        });
      }

      // Verify if the user is a teacher
      const user = await User.findUnique({
        where: {
          id: teacherId,
        },
        select: {
          role: true,
        },
      });

      if (!user || user.role !== "TEACHER") {
        return res.status(403).json({
          status: false,
          data: {
            message: "Only teachers are allowed to create classes.",
          },
        });
      }

      // Create the class in the database
      const newClass = await Class.create({
        data: {
          name: name,
          year: year,
          teacherId: teacherId, // Use teacherId extracted from token
        },
      });

      console.log("Class created successfully.");
      return res.status(201).json({
        status: true,
        data: {
          class: newClass,
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

  updateClass: async (req: any, res: any) => {
    try {
      console.log("Updating class...");
      const { id, name, year, teacherId } = req.body;

      // Validate mandatory fields
      if (!id || !name || !year || !teacherId) {
        return res.status(400).json({
          status: false,
          data: {
            message: "All mandatory fields must be completed.",
          },
        });
      }

      // Verify if the teacher is the assigned teacher for the class
      const existingClass = await Class.findUnique({
        where: {
          id: id,
        },
        select: {
          teacherId: true,
        },
      });

      if (!existingClass || existingClass.teacherId !== teacherId) {
        return res.status(403).json({
          status: false,
          data: {
            message: "You are not authorized to update this class.",
          },
        });
      }

      // Update the class in the database
      const updatedClass = await Class.update({
        where: {
          id: id,
        },
        data: {
          name: name,
          year: year,
        },
      });

      console.log("Class updated successfully.");
      return res.status(200).json({
        status: true,
        data: {
          class: updatedClass,
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

  deleteClass: async (req: any, res: any) => {
    try {
      console.log("Deleting class...");
      const { id } = req.body;

      // Get the token from the request headers
      const token = JSON.parse(req.headers.authorization?.split(" ")[1]);
      console.log(token);

      // Vérifier le token et extraire les informations de l'utilisateur
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
      const teacherId = decoded.userId;

      // Validate mandatory fields
      if (!id || !teacherId) {
        return res.status(400).json({
          status: false,
          data: {
            message: "Class ID and Teacher ID must be provided.",
          },
        });
      }

      // Verify if the teacher is the assigned teacher for the class
      const existingClass = await Class.findUnique({
        where: {
          id: id,
        },
        select: {
          teacherId: true,
        },
      });

      if (!existingClass || existingClass.teacherId !== teacherId) {
        return res.status(403).json({
          status: false,
          data: {
            message: "You are not authorized to delete this class.",
          },
        });
      }

      // Delete the class from the database
      await Class.delete({
        where: {
          id: id,
        },
      });

      console.log("Class deleted successfully.");
      return res.status(200).json({
        status: true,
        data: { message: "The class has been successfully deleted." },
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        status: false,
        error: error.message,
      });
    }
  },

  approveClassAccess: async (req: any, res: any) => {
    try {
      console.log("Approving class access...");
      const { classAccessId, teacherId } = req.body;

      // Validate the input
      if (!classAccessId || !teacherId) {
        return res.status(400).json({
          status: false,
          data: {
            message: "Class Access ID and Teacher ID must be provided.",
          },
        });
      }

      // Verify if the teacher is the owner of the class
      const classAccess = await ClassAccess.findUnique({
        where: {
          id: classAccessId,
        },
        include: {
          class: true,
        },
      });

      if (!classAccess || classAccess.class.teacherId !== teacherId) {
        console.log(classAccess.class.teacherId);
        return res.status(403).json({
          status: false,
          data: {
            message: "You are not authorized to approve this request.",
          },
        });
      }

      // Update the ClassAccess status to "APPROVED"
      const updatedClassAccess = await ClassAccess.update({
        where: {
          id: classAccessId,
        },
        data: {
          status: "APPROVED",
        },
      });

      console.log("Class access approved successfully.");
      return res.status(200).json({
        status: true,
        data: {
          updatedClassAccess,
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

  getTeacherClasses: async (req: any, res: any) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          status: false,
          data: {
            message: "Le token est requis.",
          },
        });
      }

      // Vérifier le token et extraire les informations de l'utilisateur
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");

      const userId = decoded.userId;

      // Vérifier si l'utilisateur existe et est un professeur
      const teacher = await User.findFirst({
        where: {
          id: userId,
          role: "TEACHER", // Ensure the role is 'TEACHER'
        },
        select: {
          id: true,
          lastname: true,
          firstname: true,
          teachingClasses: {
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
                    },
                  },
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
      });

      // Vérifier si le professeur existe
      if (!teacher) {
        return res.status(404).json({
          status: false,
          data: {
            message: "Professeur introuvable ou l'utilisateur n'est pas un professeur.",
          },
        });
      }

      // Retourner les classes enseignées par le professeur
      return res.status(200).json({
        status: true,
        data: {
          class: teacher.teachingClasses,
        },
      });
    } catch (error: any) {
      console.error("Erreur lors de la récupération des classes du professeur :", error);

      if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
        return res.status(401).json({
          status: false,
          data: {
            message: "Token invalide ou expiré.",
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
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({
          status: false,
          data: {
            message: "Authorization token is required.",
          },
        });
      }

      // Vérifier le token et extraire les informations de l'utilisateur
      const decodedToken: any = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
      const teacherId = decodedToken.userId;

      // Fetch all class access requests with status "PENDING" for the teacher's classes
      const pendingAccessRequests = await ClassAccess.findMany({
        where: {
          status: "PENDING",
          class: {
            teacherId: teacherId,
          },
        },
        select: {
          id: true,
          classId: true,
          userId: true,
          status: true,
          user: {
            select: {
              firstname: true,
              lastname: true,
            },
          },
          class: {
            select: {
              name: true,
              year: true,
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
      console.error(error);
      return res.status(500).json({
        status: false,
        error: error.message,
      });
    }
  },

  registerDocument: async (req: any, res: any) => {
    try {
      console.log("Registering document...");
      const { title, content, classId } = req.body;

      // Validate mandatory fields
      if (!title || !content || !classId) {
        return res.status(400).json({
          status: false,
          data: {
            message: "All mandatory fields (title, content, classId) must be completed.",
          },
        });
      }

      // Verify that the class exists
      const existingClass = await Class.findUnique({
        where: { id: classId },
      });

      if (!existingClass) {
        return res.status(404).json({
          status: false,
          data: {
            message: "The specified class does not exist.",
          },
        });
      }

      // Create the document
      const newDocument = await Document.create({
        data: {
          title,
          content,
          classId,
        },
      });

      console.log("Document registered successfully.");
      return res.status(201).json({
        status: true,
        data: {
          document: newDocument,
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

  registerEvaluation: async (req: any, res: any) => {
    try {
      console.log("Registering evaluation...");
      const { title, content, classId } = req.body;

      // Validate mandatory fields
      if (!title || !content || !classId) {
        return res.status(400).json({
          status: false,
          data: {
            message: "All mandatory fields (title, content, classId) must be completed.",
          },
        });
      }

      // Verify that the class exists
      const existingClass = await Class.findUnique({
        where: { id: classId },
      });

      if (!existingClass) {
        return res.status(404).json({
          status: false,
          data: {
            message: "The specified class does not exist.",
          },
        });
      }

      // Create the document
      const newEvaluation = await Evaluation.create({
        data: {
          title,
          content,
          classId,
        },
      });

      console.log("Evaluation registered successfully.");
      return res.status(201).json({
        status: true,
        data: {
          evaluation: newEvaluation,
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
