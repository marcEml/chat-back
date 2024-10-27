import axios from "axios";

// function : sending message to the person who want do a transaction

export const sendMessage = async (req: any, res: any) => {
  const url: string | undefined = process.env.send_message_uri;

  const data = {
    outboundSMSMessageRequest: {
      address: "tel:+225" + req.params.PhoneNumber,
      senderAddress: "tel:+2250000",
      outboundSMSTextMessage: {
        message: req.params.Message,
      },
    },
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + req.token,
  };

  axios
    .post(url as string, data, { headers })
    .then(() => {
      console.log("message envoyé...");
      return res
        .status(200)
        .send({ message: "Message envoyé avec succès", Status: "Success", Details: req.encoded });
    })
    .catch((error) => {
      console.log(error);
    });
}