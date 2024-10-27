const OTP = require("../../lib/prisma").otp;
import { encode, decode } from "../../middleware/crypt";
import { authController } from "./authentification";

export const otpController = {
  sendOtpToPhone: async (req: any, res: any) => {
    try {
      const { phone, type } = req.body;

      let phone_message;

      if (!phone) {
        const response = {
          Status: "Failure",
          Details: "Phone Number not provided",
        };
        return res.status(400).send(response);
      }
      if (!type) {
        const response = { Status: "Failure", Details: "Type not provided" };
        return res.status(400).send(response);
      }

      //Generate OTP
      const randomNumber = Math.round(Math.random() * 1000000);
      const otp = ("000000" + randomNumber).slice(-6);
      const now = new Date();
      const expiration_time = AddMinutesToDate(now, 10);

      // Create OTP instance in DB
      var otp_instance = await OTP.create({
        data: {
          otp: otp,
          expiration_time: expiration_time,
        },
      });

      // Create details object containing the phone number and otp id
      var details = {
        timestamp: now,
        check: phone,
        success: true,
        message: "OTP sent to user",
        otp_id: otp_instance.id,
      };

      // Encrypt the details object
      const encoded = await encode(JSON.stringify(details));

      //Choose message template according type requested
      if (type) {
        if (type == "VERIFICATION") {
          const message = require("../../templates/sms/phone_verification");
          phone_message = message(otp);
        } else if (type == "FORGET") {
          const message = require("../templates/sms/phone_forget");
          phone_message = message(otp);
        } else if (type == "2FA") {
          const message = require("../templates/sms/phone_2FA");
          phone_message = message(otp);
        } else {
          const response = {
            Status: "Failure",
            Details: "Incorrect Type Provided",
          };
          return res.status(400).send(response);
        }
      }

      // Settings Params for SMS
      var params = {
        Message: phone_message,
        PhoneNumber: phone,
      };

      //Send response back to the client if the message is sent
      authController.getAuthenticate(params, encoded, res);
    } catch (err: any) {
      const response = { Status: "Failure", Details: err.message };
      return res.status(400).send(response);
    }
  },
};

function AddMinutesToDate(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000);
}
