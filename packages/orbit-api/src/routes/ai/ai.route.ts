import { createAppRouter } from "@/lib/create-app.js";
import * as routes from "./routes.js";
import * as handlers from "./ai.handlers.js";
import { resolveUser } from "@/middlewares/resolve-user.middleware.js";

const router = createAppRouter();

router.use("*", resolveUser);

router
	.openapi(routes.getAiQueryResult, handlers.getAiQueryResult);

export default router;
