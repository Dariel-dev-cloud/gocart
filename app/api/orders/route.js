import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PaymentMethod } from "@prisma/client";
import Stripe from "stripe";

export async function POST(request) {
    try {
        const { userId, has } = getAuth(request);
        if (!userId) {
            return NextResponse.json({ message: "No autorizado" }, { status: 401 });
        }
        const { addressId, items, couponCode, paymentMethod } = await request.json();

        if (!addressId || !items || items.length === 0 || !paymentMethod || !Array.isArray(items)) {
            return NextResponse.json({ message: "Datos de pedido inválidos" }, { status: 401 });
        }
        let coupon = null;
        if (couponCode) {

            coupon = await prisma.coupon.findUnique({
                where: { code: couponCode.toUpperCase(), }
            })

            if (!coupon) {
                return NextResponse.json({ error: "El cupón no es válido o ha expirado" }, { status: 404 })
            }

        }


        if (couponCode && coupon.forNewUser) {
            const userOrders = await prisma.order.findMany({ where: { userId } })
            if (userOrders.length > 0) {
                return NextResponse.json({ error: "El cupón es solo para nuevos usuarios" }, { status: 400 })
            }
        }

        const isPlusMember = has({ plan: 'plus' })

        if (couponCode && coupon.forMember) {
            if (!isPlusMember) {
                return NextResponse.json({ error: "El cupón es solo para usuarios con plan Plus" }, { status: 400 })
            }
        }

        const ordersByStore = new Map()

        for (const item of items) {
            const product = await prisma.product.findUnique({ where: { id: item.id } })
            const storeId = product.storeId
            if (!ordersByStore.has(storeId)) {
                ordersByStore.set(storeId, [])
            }
            ordersByStore.get(storeId).push({ ...item, price: product.price })
        }

        let ordersId = []
        let fullAmount = 0;

        let isShippingFeeAdded = false;

        for (const [storeId, sellerItems] of ordersByStore.entries()) {
            let total = sellerItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
            if (couponCode) {
                total -= (total * coupon.discount) / 100
            }
            if (!isPlusMember && !isShippingFeeAdded) {
                total += 5;
                isShippingFeeAdded = true;
            }

            fullAmount += parseFloat(total.toFixed(2));
            const order = await prisma.order.create({
                data: {
                    userId,
                    storeId,
                    addressId,
                    total: parseFloat(total.toFixed(2)),
                    paymentMethod,
                    isCouponUsed: coupon ? true : false,
                    coupon: coupon ? coupon : {},
                    orderItems: {
                        create: sellerItems.map(item => ({
                            productId: item.id,
                            quantity: item.quantity,
                            price: item.price,
                        }))
                    }

                }
            })
            ordersId.push(order.id)
        }

        if (paymentMethod === 'STRIPE') {
            const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
            const origin = await request.headers.get('origin');

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Order'
                        },
                        unit_amount: Math.round(fullAmount * 100),
                    },
                    quantity: 1,
                }],
                expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutos
                mode: 'payment',
                success_url: `${origin}/loading?nexturl=orders`,
                cancel_url: `${origin}/cart`,
                metadata: {
                    ordersId: ordersId.join(','),
                    userId,
                    appId: 'gocart'
                }
            })
            return NextResponse.json({ session })
        }

        // clear the cart 
        await prisma.user.update({
            where: { id: userId },
            data: { cart: {} }
        })

        return NextResponse.json({ message: "Pedido creado con éxito" });

    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// get all orders for user 

export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        const orders = await prisma.order.findMany({
            where: {
                userId, OR: [
                    { paymentMethod: PaymentMethod.COD },
                    { AND: [{ paymentMethod: PaymentMethod.STRIPE }, { isPaid: true }] }
                ]
            },
            include: {
                orderItems: { include: { product: true } },
                address: true,
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ orders })


    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}
