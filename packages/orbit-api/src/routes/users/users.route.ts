import { createAppRouter } from "@/lib/create-app.js";
import * as handlers from "./users.handlers.js";
import * as routes from "./routes.js";
import { resolveUser } from "@/middlewares/resolve-user.middleware.js";

const router = createAppRouter();

router.use("*", resolveUser);

router
	.openapi(routes.getMe, handlers.getMe)
	.openapi(routes.updateMe, handlers.updateMe);

export default router;
