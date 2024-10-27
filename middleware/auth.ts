import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Define a custom interface extending Request
interface AuthRequest extends Request {
    auth?: {
        userId: string;
    };
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token: string | undefined = req.headers.authorization?.split(" ")[1];
        if (!token) {
            throw new Error("Authorization token not provided");
        }
        const decodedToken: any = jwt.verify(token, process.env.DECRYPT_TOKEN as string);
        const userId: string = decodedToken.userId;
        req.auth = {
            userId: userId,
        };
        next();
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
};

export default authMiddleware;
