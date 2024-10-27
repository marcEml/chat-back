import express from "express";
import { TeacherController } from "../controllers/teachers/teachers";

const router = express.Router();

// routes for teachers ...

router.post("/teacher/register/class", TeacherController.createClass); // create class
router.put("/teacher/update/class", TeacherController.updateClass); // update class
router.post("/teacher/delete/class", TeacherController.deleteClass); // delete class

router.post("/teacher/approve/class-access", TeacherController.approveClassAccess); // approve class access
router.get("/teacher/get/request", TeacherController.getPendingAccessRequests); // get class access request

router.get("/teacher/get/class", TeacherController.getTeacherClasses); // approve class access

router.post("/teacher/create/document", TeacherController.registerDocument); // approve class access
router.post("/teacher/create/evaluation", TeacherController.registerEvaluation); // approve class access

export default router;
