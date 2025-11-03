import { getAuth } from "@clerk/nextjs/server"
import authAdmin from "@/middlewares/authAdmin"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        const isAdmin = await authAdmin(userId)

        if (!isAdmin) {
            return NextResponse.json({ error: "no authorizado" }, { status: 401 })
        }

        const { storeId } = await request.json()
        if (!storeId) {
            return NextResponse.json({ error: "storeId es requerido" }, { status: 400 })
        }

        const store = await prisma.store.findUnique({
            where: { id: storeId }
        })
        if (!store) {
            return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 })
        }
        await prisma.store.update({
            where: { id: storeId },
            data: { isActive: !store.isActive }
        })
        return NextResponse.json({ message: 'Estado de la tienda actualizado' })

    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }

}

