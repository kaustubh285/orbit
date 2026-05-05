import { createAppRouter } from "@/lib/create-app.js";
import * as handlers from "./quests.handlers.js";
import * as routes from "./routes.js";
import { resolveUser } from "@/middlewares/resolve-user.middleware.js";

const router = createAppRouter();

router.use("*", resolveUser);

router
	.openapi(routes.count, handlers.countQuests)
	.openapi(routes.timeline, handlers.timelineQuests)
	.openapi(routes.list, handlers.listQuests)
	.openapi(routes.create, handlers.createQuest)
	.openapi(routes.getOne, handlers.getOneQuest)
	.openapi(routes.update, handlers.updateQuest)
	.openapi(routes.remove, handlers.removeQuest);

export default router;
