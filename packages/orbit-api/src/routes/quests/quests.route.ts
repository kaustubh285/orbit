import { createAppRouter } from "@/lib/create-app.js";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as handlers from "./quests.handlers.js";
import * as routes from "./routes.js";

const router = createAppRouter();

router.use("*", async (c, next) => {
	const userId = c.req.header("x-user-id");
	if (!userId) {
		return c.json({ message: "Missing x-user-id header" }, HttpStatusCodes.UNAUTHORIZED);
	}
	c.set("userId", userId);
	await next();
});

router
	.openapi(routes.list, handlers.listQuests)
	.openapi(routes.create, handlers.createQuest)
	.openapi(routes.getOne, handlers.getOneQuest)
	.openapi(routes.update, handlers.updateQuest)
	.openapi(routes.remove, handlers.removeQuest);

export default router;
