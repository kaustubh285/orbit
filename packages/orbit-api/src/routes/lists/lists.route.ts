import { createAppRouter } from "@/lib/create-app.js";
import * as handlers from "./lists.handlers.js";
import * as routes from "./routes.js";
import { resolveUser } from "@/middlewares/resolve-user.middleware.js";

const router = createAppRouter();

router.use("*", resolveUser);

router
	.openapi(routes.list, handlers.listLists)
	.openapi(routes.create, handlers.createList)
	.openapi(routes.getOne, handlers.getOneList)
	.openapi(routes.update, handlers.updateList)
	.openapi(routes.remove, handlers.removeList)
	.openapi(routes.addItem, handlers.addListItem)
	.openapi(routes.removeItem, handlers.removeListItem);

export default router;
