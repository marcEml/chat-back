import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const User = require("../../lib/prisma").user;
const saltRounds = 10;

export const AuthController = {
  createUser: async (req: any, res: any) => {
    try {
      console.log("Creating user...");
      const { lastname, firstname, phone, email, birthday, gender, role, password } = req.body;

      // Check for mandatory fields
      if (
        !lastname ||
        !firstname ||
        !phone ||
        !email ||
        !birthday ||
        !gender ||
        !role ||
        !password
      ) {
        return res.status(400).json({
          status: false,
          data: {
            message: "All mandatory fields must be completed.",
          },
        });
      }

      const salt = await bcrypt.genSalt(saltRounds);

      // Create user in the database
      let user = await User.create({
        data: {
          lastname: lastname,
          firstname: firstname,
          phone: phone,
          email: email,
          birthday: new Date(birthday),
          gender: gender,
          role: role,
          password: await bcrypt.hash(password, salt),
        },
      });

      // Fetch the created user with selected fields
      user = await User.findUnique({
        where: {
          id: user.id,
        },
        select: {
          id: true,
          lastname: true,
          firstname: true,
          phone: true,
          email: true,
          birthday: true,
          gender: true,
          role: true,
        },
      });

      console.log("User created successfully.");
      return res.status(201).json({
        status: true,
        data: {
          user: user,
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

  updateUser: async (req: any, res: any) => {
    try {
      console.log("Updating user...");
      const { id, lastname, firstname, phone, email, birthday, gender, role } = req.body;

      // Validate that all mandatory fields are provided
      if (!id || !lastname || !firstname || !phone || !email || !birthday || !gender || !role) {
        return res.status(400).json({
          status: false,
          data: {
            message: "All mandatory fields must be completed.",
          },
        });
      }

      // Update the user in the database
      await User.update({
        where: {
          id: id,
        },
        data: {
          lastname: lastname,
          firstname: firstname,
          phone: phone,
          email: email,
          birthday: new Date(birthday),
          gender: gender,
          role: role,
        },
      });

      // Fetch the updated user with selected fields
      const updatedUser = await User.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
          lastname: true,
          firstname: true,
          phone: true,
          email: true,
          birthday: true,
          gender: true,
          role: true,
        },
      });

      console.log("User updated successfully.");
      return res.status(200).json({
        status: true,
        data: updatedUser,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        status: false,
        error: error.message,
      });
    }
  },

  deleteUser: async (req: any, res: any) => {
    try {
      console.log("Deleting user...");
      const { id } = req.body;

      // Check if the user ID is provided
      if (!id) {
        return res.status(400).json({
          status: false,
          data: {
            message: "User ID must be provided.",
          },
        });
      }

      // Delete the user from the database
      await User.delete({
        where: {
          id: id,
        },
      });

      console.log("User deleted successfully.");
      return res.status(200).json({
        status: true,
        data: { message: "The user has been successfully deleted." },
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        status: false,
        error: error.message,
      });
    }
  },

  loginUser: async (req: any, res: any) => {
    try {
      console.log("Logging in user...");
      const { phone, password } = req.body;

      // Validate input
      if (!phone || !password) {
        return res.status(400).json({
          status: false,
          data: {
            message: "All mandatory fields must be completed.",
          },
        });
      }

      // Find the user by phone number
      const user = await User.findFirst({
        where: {
          phone: phone,
        },
        select: {
          id: true,
          lastname: true,
          firstname: true,
          phone: true,
          password: true,
          role: true,
          classAccesses: {
            select: {
              id: true,
              status: true,
              class: {
                select: {
                  id: true,
                  name: true,
                  year: true,
                  teacherId: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
          teachingClasses: {
            select: {
              id: true,
              name: true,
              year: true,
            },
          },
        },
      });

      if (user) {
        // Check if the password matches
        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (passwordsMatch) {
          console.log("Login successful");

          // Generate a token for the user
          const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || "your_secret_key",
            {
              expiresIn: "24h",
            }
          );

          return res.status(200).json({
            status: true,
            data: {
              user: {
                id: user.id,
                lastname: user.lastname,
                firstname: user.firstname,
                phone: user.phone,
                role: user.role,
                classAccesses: user.classAccesses, // Include classAccesses
                teachingClasses: user.teachingClasses, // Include teachingClasses
              },
              token: token,
            },
          });
        } else {
          console.log("Login failed: Invalid password");
          return res.status(401).json({
            status: false,
            data: {
              message: "The password is invalid.",
            },
          });
        }
      } else {
        console.log("Login failed: Phone number not found");
        return res.status(404).json({
          status: false,
          data: {
            message: "The phone number is not correct.",
          },
        });
      }
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        status: false,
        error: error.message,
      });
    }
  },

  getMe: async (req: any, res: any) => {
    try {
      // Extract token from the Authorization header
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1]; // Expecting 'Bearer token'

      // Check if token is provided
      if (!token) {
        return res.status(401).json({
          status: false,
          data: {
            message: "No token provided.",
          },
        });
      }

      // Verify the token
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");

      // Find the user by ID from the decoded token
      const user = await User.findFirst({
        where: { id: decoded.userId },
        select: {
          id: true,
          lastname: true,
          firstname: true,
          phone: true,
          password: true,
          role: true,
          classAccesses: {
            select: {
              id: true,
              status: true,
              class: {
                select: {
                  id: true,
                  name: true,
                  year: true,
                  teacherId: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
          teachingClasses: {
            select: {
              id: true,
              name: true,
              year: true,
            },
          },
        },
      });

      // Check if the user exists
      if (!user) {
        return res.status(404).json({
          status: false,
          data: {
            message: "User not found.",
          },
        });
      }

      // Return user information
      return res.status(200).json({
        status: true,
        data: {
          user,
        },
      });
    } catch (error) {
      console.error("Error verifying token:", error);
      return res.status(401).json({
        status: false,
        data: {
          message: "Invalid token.",
        },
      });
    }
  },
};
