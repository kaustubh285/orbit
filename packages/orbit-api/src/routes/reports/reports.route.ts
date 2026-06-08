import { createAppRouter } from "@/lib/create-app.js";
import * as handlers from "./reports.handlers.js";
import * as routes from "./routes.js";
import { resolveUser } from "@/middlewares/resolve-user.middleware.js";

const router = createAppRouter();

router.use("*", resolveUser);

router
	.openapi(routes.inAppReport, handlers.generateReport);

export default router;
