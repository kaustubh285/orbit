import { createAppRouter } from "@/lib/create-app.js";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as handlers from "./saves.handlers.js";
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
	.openapi(routes.list, handlers.listSaves)
	.openapi(routes.create, handlers.createSave)
	.openapi(routes.getOne, handlers.getOneSave)
	.openapi(routes.update, handlers.updateSave)
	.openapi(routes.remove, handlers.removeSave);

export default router;
