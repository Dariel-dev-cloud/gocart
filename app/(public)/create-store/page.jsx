'use client'
import { assets } from "@/assets/assets"
import { useEffect, useState } from "react"
import Image from "next/image"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"

export default function CreateStore() {

    const [alreadySubmitted, setAlreadySubmitted] = useState(false)
    const [status, setStatus] = useState("")
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState("")

    const [storeInfo, setStoreInfo] = useState({
        name: "",
        username: "",
        description: "",
        email: "",
        contact: "",
        address: "",
        image: ""
    })

    const onChangeHandler = (e) => {
        setStoreInfo({ ...storeInfo, [e.target.name]: e.target.value })
    }

    const fetchSellerStatus = async () => {
        // Logic to check if the store is already submitted


        setLoading(false)
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        // Logic to submit the store details


    }

    useEffect(() => {
        fetchSellerStatus()
    }, [])

    return !loading ? (
        <>
            {!alreadySubmitted ? (
                <div className="mx-6 min-h-[70vh] my-16">
                    <form onSubmit={e => toast.promise(onSubmitHandler(e), { loading: "Enviando datos..." })} className="max-w-7xl mx-auto flex flex-col items-start gap-3 text-slate-500">
                        {/* Title */}
                        <div>
                            <h1 className="text-3xl ">Añade tu <span className="text-slate-800 font-medium">Tienda</span></h1>
                            <p className="max-w-lg">Para convertirte en vendedor en GoCart, envía los detalles de tu tienda para revisión. Tu tienda será activada después de la verificación del administrador.</p>
                        </div>

                        <label className="mt-10 cursor-pointer">
                            Logo de la Tienda
                            <Image src={storeInfo.image ? URL.createObjectURL(storeInfo.image) : assets.upload_area} className="rounded-lg mt-2 h-16 w-auto" alt="" width={150} height={100} />
                            <input type="file" accept="image/*" onChange={(e) => setStoreInfo({ ...storeInfo, image: e.target.files[0] })} hidden />
                        </label>

                        <p>Nombre de usuario</p>
                        <input name="username" onChange={onChangeHandler} value={storeInfo.username} type="text" placeholder="Ingresa el nombre de usuario de tu tienda" className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded" />

                        <p>Nombre</p>
                        <input name="name" onChange={onChangeHandler} value={storeInfo.name} type="text" placeholder="Ingresa el nombre de tu tienda" className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded" />

                        <p>Descripción</p>
                        <textarea name="description" onChange={onChangeHandler} value={storeInfo.description} rows={5} placeholder="Ingresa la descripción de tu tienda" className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded resize-none" />

                        <p>Correo electrónico</p>
                        <input name="email" onChange={onChangeHandler} value={storeInfo.email} type="email" placeholder="Ingresa el correo de tu tienda" className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded" />

                        <p>Número de contacto</p>
                        <input name="contact" onChange={onChangeHandler} value={storeInfo.contact} type="text" placeholder="Ingresa el número de contacto de tu tienda" className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded" />

                        <p>Dirección</p>
                        <textarea name="address" onChange={onChangeHandler} value={storeInfo.address} rows={5} placeholder="Ingresa la dirección de tu tienda" className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded resize-none" />

                        <button className="bg-slate-800 text-white px-12 py-2 rounded mt-10 mb-40 active:scale-95 hover:bg-slate-900 transition ">Enviar</button>
                    </form>
                </div>
            ) : (
                <div className="min-h-[80vh] flex flex-col items-center justify-center">
                    <p className="sm:text-2xl lg:text-3xl mx-5 font-semibold text-slate-500 text-center max-w-2xl">{message}</p>
                    {status === "approved" && <p className="mt-5 text-slate-400">redirigiendo al panel en <span className="font-semibold">5 segundos</span></p>}
                </div>
            )}
        </>
    ) : (<Loading />)
}