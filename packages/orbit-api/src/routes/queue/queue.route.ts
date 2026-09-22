import { createAppRouter } from "@/lib/create-app.js";
import { resolveUser } from "@/middlewares/resolve-user.middleware.js";
import * as handlers from "./queue.handlers.js";
import * as routes from "./routes.js";

const router = createAppRouter();

router.use("*", resolveUser);

router
	.openapi(routes.list, handlers.listQueue)
	.openapi(routes.create, handlers.createQueueItem)
	.openapi(routes.remove, handlers.removeQueueItem);

export default router;
