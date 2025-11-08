import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { openai } from "@/configs/openai";

async function main(base64Image, mimeType) {
    const messages = [
        {
            "role": "system",
            "content": `Eres asistente de listado de productos para una tienda de comercio electrónico.
            Tu trabajo consiste en analizar la imagen de un producto y generar datos estructurados.

            Responde SOLO con JSON sin formato (sin bloque de código, sin Markdown, sin explicación).
            ⚠️ IMPORTANTE: Debes responder SIEMPRE en ESPAÑOL (idioma castellano).

             El JSON debe seguir estrictamente este esquema:

            {
            "name": string,  // Nombre corto del producto

            "description": string, // Descripción del producto para marketing
            }
            `
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Analiza la siguiente imagen y genera el nombre y la descripción del producto.",
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": `data:${mimeType};base64,${base64Image}`
                    },
                },
            ],
        }
    ];

    const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL,
        messages,
    });
    const raw = response.choices[0].message.content

    const cleaned = raw.replace(/```json|```/g, '').trim();
    let parsed;
    try {
        parsed = JSON.parse(cleaned);
    } catch (error) {
        throw new Error("la ia no retornó un json válido");
    }
    return parsed;
}

export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        const isSeller = await authSeller(userId)
        if (!isSeller) {
            return NextResponse.json({ error: "no autorizado" }, { status: 401 })
        }
        const { base64Image, mimeType } = await request.json();
        const result = await main(base64Image, mimeType);
        return NextResponse.json({ ...result })

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}