import { Router, type IRouter } from "express";
import healthRouter from "./health";
import friendsRouter from "./friends";
import roomsRouter from "./rooms";
import profileRouter from "./profile";
import gamesRouter from "./games";

const router: IRouter = Router();

router.use(healthRouter);
router.use(friendsRouter);
router.use(roomsRouter);
router.use(profileRouter);
router.use(gamesRouter);

export default router;
