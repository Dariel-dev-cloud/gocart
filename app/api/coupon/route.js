import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


export async function POST(request) {
    try {
        const { userId, has } = getAuth(request)
        const { code } = await request.json()

        const coupon = await prisma.coupon.findUnique({
            where: {
                code: code.toUpperCase(),
                expiresAt: {
                    gt: new Date()
                }
            }
        })

        if (!coupon) {
            return NextResponse.json({ error: "El cupón no es válido o ha expirado" }, { status: 404 })
        }

        if (coupon.forNewUser) {
            const userOrders = await prisma.order.findMany({ where: { userId } })
            if (userOrders.length > 0) {
                return NextResponse.json({ error: "El cupón es solo para nuevos usuarios" }, { status: 400 })
            }
        }

        if (coupon.forMember) {
            const hasPlusPlan = has({ plan: 'plus' })
            if (!hasPlusPlan) {
                return NextResponse.json({ error: "El cupón es solo para usuarios con plan Plus" }, { status: 400 })
            }
        }
        return NextResponse.json({ coupon })

    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}