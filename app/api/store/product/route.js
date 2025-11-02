import imagekit from "@/configs/imageKit";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const storeId = await authSeller(userId);
        if (!storeId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 });
        }
        //get data from the form
        const formData = await request.formData()
        const name = formData.get('name')
        const description = formData.get('description')
        const mrp = Number(formData.get('mrp'))
        const price = Number(formData.get('price'))
        const category = formData.get('category')
        const images = formData.getAll('images')

        if (!name || !description || !mrp || !price || !category || images.length < 1) {
            return NextResponse.json({ error: "missing product details" }, { status: 400 })
        }

        // Uploading Images to ImageKit
        const imagesUrl = await Promise.all(images.map(async (image) => {
            const response = await imagekit.files.upload({
                file: image,
                fileName: image.name,
                folder: "products",
            });
            const url = imagekit.helper.buildSrc({
                urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
                src: response.filePath,
                transformation: [
                    { quality: "auto", format: "webp", width: 1024 }
                ]
            });
            return url;
        }));

        await prisma.product.create({
            data: {
                name,
                description,
                mrp,
                price,
                category,
                images: imagesUrl,
                storeId

            }
        })

        return NextResponse.json({ message: "product added successfully" })


    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// get all product for a seller
export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        const storeId = await authSeller(userId);
        if (!storeId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 });
        }
        const products = await prisma.product.findMany({
            where: { storeId }
        })

        return NextResponse.json({ products })

    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}