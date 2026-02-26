import fp from "fastify-plugin"
import { Server } from "socket.io"
import type { FastifyInstance } from "fastify"
import { env } from "@/config/env.config"
import {
	SOCKET_JOIN_ROOM,
	SOCKET_LEAVE_ROOM,
	SOCKET_MESSAGE,
	SOCKET_TYPING,
} from "@/socket/events"

declare module "fastify" {
	interface FastifyInstance {
		io: Server
	}
}

function getSocketCorsOrigin(): string | string[] | boolean {
	const origins = [
		...(Array.isArray(env.FRONTEND_URL) ? env.FRONTEND_URL : [env.FRONTEND_URL]),
		`http://localhost:${env.PORT}`,
		`http://127.0.0.1:${env.PORT}`,
		`https://localhost:${env.PORT}`,
		`https://127.0.0.1:${env.PORT}`,
		...(env.API_URL ? [env.API_URL] : []),
		...(process.env.RENDER_EXTERNAL_URL ? [process.env.RENDER_EXTERNAL_URL] : []),
	]
	if (env.NODE_ENV !== "production") return true
	return origins
}

async function socketPlugin(app: FastifyInstance) {
	const io = new Server({
		cors: {
			origin: getSocketCorsOrigin(),
			credentials: true,
		},
	})

	io.on("connection", (socket) => {
		app.log.info({ socketId: socket.id }, "Socket connected")

		socket.on(SOCKET_JOIN_ROOM, (roomId: string) => {
			if (roomId && typeof roomId === "string") {
				socket.join(roomId)
				app.log.debug({ socketId: socket.id, roomId }, "Socket joined room")
			}
		})

		socket.on(SOCKET_LEAVE_ROOM, (roomId: string) => {
			if (roomId && typeof roomId === "string") {
				socket.leave(roomId)
				app.log.debug({ socketId: socket.id, roomId }, "Socket left room")
			}
		})

		socket.on(SOCKET_MESSAGE, (payload: unknown) => {
			const roomIds = Array.from(socket.rooms).filter((r) => r !== socket.id)
			for (const roomId of roomIds) {
				socket.to(roomId).emit(SOCKET_MESSAGE, payload)
			}
		})

		socket.on(SOCKET_TYPING, (payload: unknown) => {
			const roomIds = Array.from(socket.rooms).filter((r) => r !== socket.id)
			for (const roomId of roomIds) {
				socket.to(roomId).emit(SOCKET_TYPING, payload)
			}
		})

		socket.on("disconnect", (reason) => {
			app.log.info({ socketId: socket.id, reason }, "Socket disconnected")
		})
	})

	app.decorate("io", io)

	app.addHook("onListen", async function (this: FastifyInstance) {
		const server = this.server
		if (server) {
			io.attach(server)
			this.log.info("🔌 Socket.IO attached to HTTP server")
		}
	})

	app.addHook("onClose", async (instance) => {
		io.close()
		instance.log.info("Socket.IO server closed")
	})
}

export default fp(socketPlugin, {
	name: "socket.io-plugin",
})
