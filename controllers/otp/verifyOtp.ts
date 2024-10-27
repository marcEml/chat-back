const OTP = require("../../lib/prisma").otp;
import { encode, decode } from "../../middleware/crypt";
import { Request, Response } from "express";

// Function to Compares dates (expiration time and current time in our case)
var dates = {
  convert: function (d: any) {
    return d.constructor === Date
      ? d
      : d.constructor === Array
      ? new Date(d[0], d[1], d[2])
      : d.constructor === Number
      ? new Date(d as number)
      : d.constructor === String
      ? new Date(d as string)
      : typeof d === "object"
      ? new Date(d.year, d.month, d.date)
      : NaN;
  },
  compare: function (a: number, b: number) {
    return isFinite((a = this.convert(a).valueOf())) &&
      isFinite((b = this.convert(b).valueOf()))
      ? Number(a > b) - Number(a < b)
      : NaN;
  },
  inRange: function (d: any, start: any, end: any) {
    return isFinite((d = this.convert(d).valueOf())) &&
      isFinite((start = this.convert(start).valueOf())) &&
      isFinite((end = this.convert(end).valueOf()))
      ? start <= d && d <= end
      : NaN;
  },
};

export const verifyController = {
  verifyotp: async (req: Request, res: Response) => {
    try {
      var currentdate = new Date();
      const { verification_key, otp, check } = req.body;

      if (!verification_key) {
        const response = {
          Status: "Failure",
          Details: "Verification Key not provided",
        };
        return res.status(400).send(response);
      }
      if (!otp) {
        const response = { Status: "Failure", Details: "OTP not Provided" };
        return res.status(400).send(response);
      }
      if (!check) {
        const response = { Status: "Failure", Details: "Check not Provided" };
        return res.status(400).send(response);
      }

      let decoded;

      //Check if verification key is altered or not and store it in variable decoded after decryption
      try {
        decoded = await decode(verification_key);
        console.log(decoded);
      } catch (err) {
        const response = { Status: "Failure", Details: "Bad Request" };
        return res.status(400).send(response);
      }

      var obj = JSON.parse(decoded);
      const check_obj = obj.check;

      // Check if the OTP was meant for the same email or phone number for which it is being verified
      if (check_obj != check) {
        const response = {
          Status: "Failure",
          Details: "OTP was not sent to this particular email or phone number",
        };
        return res.status(400).send(response);
      }

      const otp_instance = await OTP.findFirst({
        where: {
          id: obj.otp_id,
        },
      });

      //Check if OTP is available in the DB
      if (otp_instance != null) {
        //Check if OTP is already used or not
        if (otp_instance.verified != true) {
          //Check if OTP is expired or not
          if (
            dates.compare(
              otp_instance.expiration_time.getTime(),
              currentdate.getTime()
            ) === 1
          ) {
            //Check if OTP is equal to the OTP in the DB
            if (otp === otp_instance.otp) {
              // Mark OTP as verified or used

              await OTP.update({
                where: {
                  id: obj.otp_id,
                },
                data: {
                  verified: true,
                },
              });

              const response = {
                Status: "Success",
                Details: "OTP Matched",
                Check: check,
              };
              return res.status(200).send(response);
            } else {
              const response = {
                Status: "Failure",
                Details: "OTP NOT Matched",
              };
              return res.status(400).send(response);
            }
          } else {
            const response = { Status: "Failure", Details: "OTP Expired" };
            return res.status(400).send(response);
          }
        } else {
          const response = { Status: "Failure", Details: "OTP Already Used" };
          return res.status(400).send(response);
        }
      } else {
        const response = { Status: "Failure", Details: "Bad Request" };
        return res.status(400).send(response);
      }
    } catch (err: any) {
      const response = { Status: "Failure", Details: err.message };
      return res.status(400).send(response);
    }
  },
};
