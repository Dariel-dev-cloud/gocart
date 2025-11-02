'use client'
import { assets } from "@/assets/assets"
import { useEffect, useState } from "react"
import Image from "next/image"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import { useAuth, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import axios from "axios"

export default function CreateStore() {

    const { user } = useUser()
    const router = useRouter()
    const { getToken } = useAuth()



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
        const token = await getToken()
        try {
            const { data } = await axios.get('/api/store/create', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (["pending", "approved", "rejected"].includes(data.status)) {
                setStatus(data.status)
                setAlreadySubmitted(true)
                switch (data.status) {
                    case "approved":
                        setMessage("¡Felicidades! Tu tienda ha sido aprobada y ahora estás listo para vender en GoCart.")
                        setTimeout(() => router.push("/store"), 5000)
                        break;
                    case "rejected":
                        setMessage("¡Lo sentimos! Tu tienda ha sido rechazada. Por favor, revisa los requisitos y vuelve a intentarlo.")
                        break;
                    case "pending":
                        setMessage("Tu tienda está en revisión. Por favor, espera la aprobación.")
                        break;
                    default:
                        break;
                }
            } else {
                setAlreadySubmitted(false)
            }
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
        setLoading(false)
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        if (!user) {
            return toast('Por favor inicia sesión para continuar.', { icon: '⚠️' })
        }

        try {
            const token = await getToken()
            const formData = new FormData()
            formData.append("name", storeInfo.name)
            formData.append("description", storeInfo.description)
            formData.append("username", storeInfo.username)
            formData.append("email", storeInfo.email)
            formData.append("contact", storeInfo.contact)
            formData.append("address", storeInfo.address)
            formData.append("image", storeInfo.image)

            const { data } = await axios.post('/api/store/create', formData, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success(data.message)
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }


    }

    useEffect(() => {
        if (user) {
            fetchSellerStatus()
        }

    }, [user])

    if (!user) {
        return (
            <div className="min-h-[80vh] mx-6 flex items-center justify-center text-slate-400 " >
                <h1 className="text-2xl sm:text-4xl font-semibold  " >Por favor <span className="text-slate-500" >inicia sesión</span> para continuar.</h1>
            </div>
        )
    }

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