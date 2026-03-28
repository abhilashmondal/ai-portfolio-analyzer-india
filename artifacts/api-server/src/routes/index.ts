import { Router, type IRouter } from "express";
import healthRouter from "./health";
import stocksRouter from "./stocks";
import portfolioRouter from "./portfolio";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/stocks", stocksRouter);
router.use("/portfolio", portfolioRouter);
router.use("/ai", aiRouter);

export default router;
