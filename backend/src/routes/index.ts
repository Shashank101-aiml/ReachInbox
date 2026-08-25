import { Router } from "express";
import { authRouter } from "./auth";
import { emailsRouter } from "./emails";
import { sendersRouter } from "./senders";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/emails", emailsRouter);
apiRouter.use("/senders", sendersRouter);
