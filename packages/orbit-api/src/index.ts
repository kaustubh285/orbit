import app from './app.js'
import env from './env.js'

console.log(`Server is running on http://0.0.0.0:${env.PORT}`)

export default {
	port: env.PORT,
	hostname: "0.0.0.0",
	fetch: app.fetch,
}
