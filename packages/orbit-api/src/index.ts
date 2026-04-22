import app from './app.js'
import env from './env.js'

console.log(`Server is running on http://localhost:${env.PORT}`)

export default {
	port: env.PORT,
	fetch: app.fetch,
}
