import express from "express";
import { getBarChartStats, getDashboardStats, getLineChartStats, getPieChartStats } from "../controllers/stats.js";
import { adminOnly } from "../middlewares/auth.js";

const dashboardRoute = express.Router();

dashboardRoute.get("/stats", adminOnly, getDashboardStats);
dashboardRoute.get("/pie", adminOnly, getPieChartStats);
dashboardRoute.get("/bar", adminOnly, getBarChartStats);
dashboardRoute.get("/line", adminOnly, getLineChartStats);

export default dashboardRoute;
