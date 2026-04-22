import { createAppRouter } from "@/lib/create-app.js";
import * as handlers from "./saves.handlers.js";
import * as routes from "./routes.js";
import { resolveUser } from "@/middlewares/resolve-user.middleware.js";

const router = createAppRouter();

router.use("*", resolveUser);

router
	.openapi(routes.list, handlers.listSaves)
	.openapi(routes.create, handlers.createSave)
	.openapi(routes.getOne, handlers.getOneSave)
	.openapi(routes.update, handlers.updateSave)
	.openapi(routes.remove, handlers.removeSave);

export default router;
