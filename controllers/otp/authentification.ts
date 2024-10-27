import { sendMessage } from "./sendMessage";
import axios from "axios";

// Get Authenticate For Orange SMS API service

export const authController = {
  getAuthenticate : (params: object, encoded: string, res: any) => {
    const url: string | undefined = process.env.auth_api_orange;
  
    const data = {
      grant_type: "client_credentials",
    };
  
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: process.env.API_ORANGE_ACCESS_TOKEN,
    };
  
    axios
      .post(url as string, data, { headers })
      .then((response: any) => {
        const token = response.data["access_token"];
        const req = { token: token, params: params, encoded: encoded };
        sendMessage(req, res);
      })
      .catch((error: any) => {
        return res.status(400).send({ Status: "Failure", Details: error });
      });
  }
}

