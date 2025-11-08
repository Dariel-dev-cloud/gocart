import imagekit from "@/configs/imageKit";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        const formData = await request.formData()

        const name = formData.get('name')
        const username = formData.get('username')
        const description = formData.get('description')
        const email = formData.get('email')
        const contact = formData.get('contact')
        const address = formData.get('address')
        const image = formData.get('image')
        if (!name || !username || !description || !email || !contact || !address || !image) {
            return NextResponse.json({ error: "Faltan datos de la tienda" }, { status: 400 })
        }
        const store = await prisma.store.findFirst({
            where: { userId: userId }
        })
        if (store) {
            return NextResponse.json({ status: store.status })
        }
        const isUsernameTaken = await prisma.store.findFirst({
            where: { username: username.toLowerCase() }
        })
        if (isUsernameTaken) {
            return NextResponse.json({ error: "Nombre de usuario ya en uso" }, { status: 400 });
        }

        //image upload to imagekit
        const response = await imagekit.files.upload({
            file: image,
            fileName: image.name,
            folder: "logos"
        });

        const optimizedImage = imagekit.helper.buildSrc({
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
            src: response.filePath,
            transformation: [
                { quality: "auto", format: "webp", width: 512 }
            ]
        });

        const newStore = await prisma.store.create({
            data: {
                userId,
                name,
                description,
                username: username.toLowerCase(),
                email,
                contact,
                address,
                logo: optimizedImage,
            }

        })
        await prisma.user.update({
            where: { id: userId },
            data: { store: { connect: { id: newStore.id } } }
        })

        return NextResponse.json({ message: "Solicitud enviada, en espera de aprobación" })

    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }

}

export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        const store = await prisma.store.findFirst({
            where: { userId: userId }
        })
        if (store) {
            return NextResponse.json({ status: store.status })
        }

        return NextResponse.json({ status: "no registrado" })

    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}