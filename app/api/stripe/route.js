import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
    try {
        const body = await request.text()
        const sig = request.headers.get('stripe-signature')

        const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)

        const handlePaymentIntent = async () => {
            const session = await stripe.checkout.sessions.list({
                payment_intent: paymentIntentId
            })

            const { ordersId, userId, appId } = session.data[0].metadata

            if (appId !== 'gocart') {
                return NextResponse.json({ received: true, message: 'Id de la app Invalido' })
            }

            const orderIdsArray = ordersId.split(',')

            if (isPaid) {
                await Promise.all(orderIdsArray.map(async (orderId) => {
                    await prisma.order.update({
                        where: { id: orderId },
                        data: { isPaid: true }
                    })
                }))
                await prisma.user.update({
                    where: { id: userId },
                    data: { cart: {} }
                })
            } else {
                await Promise.all(orderIdsArray.map(async (orderId) => {
                    await prisma.order.delete({
                        where: { id: orderId }
                    })
                }))
            }
        }

        switch (event.type) {
            case 'payment_intent.succeeded': {
                await handlePaymentIntent(event.data.object.id, true)
                break;
            }
            case 'payment_intent.canceled': {
                await handlePaymentIntent(event.data.object.id, true)
                break;
            }

            default:
                console.log('tipo de evento no controlado', event.type)
                break;
        }
        return NextResponse.json({ received: true })
    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}

export const confin = {
    api: { bodyparser: false }
}
