import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const { productId } = await request.json();

        if (!productId) {
            return NextResponse.json({ error: 'faltan detalles: productId' }, { status: 400 });
        }
        const storeId = await authSeller(userId)
        if (!storeId) {
            return NextResponse.json({ error: 'no autorizado' }, { status: 401 });
        }

        const product = await prisma.product.findFirst({
            where: { id: productId, storeId: storeId }
        })

        if (!product) {
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
        }

        await prisma.product.update({
            where: { id: productId },
            data: {
                inStock: !product.inStock
            }
        })
        return NextResponse.json({ message: 'Stock del producto actualizado con éxito' }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}
