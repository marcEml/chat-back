import express from "express";
import { StudentController } from "../controllers/students/student";

const router = express.Router();

// routes for students ...

router.post("/student/register/class-access", StudentController.createClassAccess); // create class access
router.delete("/student/delete/class-access", StudentController.deleteClassAccess); // delete class access

router.get("/student/get/class", StudentController.getStudentClasses); // create class access
router.get("/student/get/request", StudentController.getPendingAccessRequests); // get class access request

router.get("/student/:studentId/notifications", StudentController.getStudentNotifications); // get class access request

export default router;
